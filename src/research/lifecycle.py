"""Chain-evidence accounting with independent closure, coverage and price gates."""
import hashlib
import json
from collections import defaultdict
from decimal import Decimal
from pathlib import Path

import pyarrow as pa
import pyarrow.parquet as pq

from research.collector import atomic_json
from research.dlmm_schema import Codec, account_keys, decode_all
from research.finance import token_units
from research.phase2 import Archive
from research.rpc_discovery import RPC, b58decode

TOKEN_PROGRAMS={'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA','TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb'}


def dedup_chain(events):
    seen={};result=[]
    for e in events:
        key=(e['signature'],e['outer_index'],e['inner_index'])
        if key in seen:
            if seen[key]!=e:raise ValueError('Conflicting event identity')
            continue
        seen[key]=e;result.append(e)
    return result


def canonical_events(events):
    """Pair compatibility aliases only within one invocation, preserving unmatched events."""
    events=dedup_chain(events);suppressed=set();pairs=[]
    for old,new in [('ClaimFee','ClaimFee2'),('ClaimReward','ClaimReward2')]:
        for i,a in enumerate(events):
            if a['event']!=old:continue
            candidates=[(j,b) for j,b in enumerate(events) if b['event']==new and b['signature']==a['signature'] and b['outer_index']==a['outer_index'] and j not in suppressed and all(b.get('fields',{}).get(k)==v for k,v in a.get('fields',{}).items())]
            if len(candidates)==1:
                j,_=candidates[0];suppressed.add(i);pairs.append({'compatibility_event':i,'preferred_event':j})
            elif len(candidates)>1:
                # Ambiguous alias identity must not silently erase financial events.
                raise ValueError('Ambiguous compatibility alias')
    return [e for i,e in enumerate(events) if i not in suppressed],pairs


def transfers(tx):
    keys=account_keys(tx);rows=[];unknown=[]
    groups=[(-1,tx['transaction']['message']['instructions'])]+[(x['index'],x['instructions']) for x in (tx['meta'].get('innerInstructions') or [])]
    for outer,instructions in groups:
        for index,ix in enumerate(instructions):
            if ix.get('programIdIndex',len(keys))>=len(keys) or keys[ix['programIdIndex']] not in TOKEN_PROGRAMS or 'data' not in ix:continue
            data=b58decode(ix['data']);accounts=[keys[a] for a in ix.get('accounts',[])]
            if len(data)>=9 and data[0] in (3,12):
                source=accounts[0];dest=accounts[1 if data[0]==3 else 2]
                rows.append({'source':source,'destination':dest,'amount':int.from_bytes(data[1:9],'little'),'outer_index':index if outer==-1 else outer,'instruction_index':index,'mint':accounts[1] if data[0]==12 else None,'decimals':data[9] if data[0]==12 and len(data)>9 else None})
            else:unknown.append({'opcode':data[0] if data else None,'accounts':accounts,'outer_index':outer,'instruction_index':index})
    return rows,unknown


def timestamp_errors(events):
    values=[e for e in events if e.get('block_time') is not None]
    issues=[]
    if len(values)!=len(events):issues.append('missing_block_time')
    ordered=sorted(values,key=lambda e:(e['slot'],e.get('transaction_index',0),e['outer_index'],e['inner_index']))
    if any(b['block_time']<a['block_time'] for a,b in zip(ordered,ordered[1:])):issues.append('timestamp_reverses_slot_order')
    if any(e['block_time']>10**11 for e in values):issues.append('milliseconds_in_seconds_field')
    return issues


def evaluate(events, coverage_complete, reconciled, prices=None, costs_complete=False):
    """Financial output gate; absent prices never become zero or a $1 peg."""
    canonical,pairs=canonical_events(events); reasons=timestamp_errors(canonical)
    creates=[e for e in canonical if e['event']=='PositionCreate'];closes=[e for e in canonical if e['event']=='PositionClose']
    if len(creates)!=1:reasons.append('creation_count_not_one')
    if len(closes)!=1:reasons.append('closure_count_not_one')
    if creates and closes and creates[0]['slot']>closes[0]['slot']:reasons.append('creation_after_close')
    if not coverage_complete:reasons.append('incomplete_signature_history')
    if any(e.get('decode_error') for e in canonical):reasons.append('unmatched_or_undecoded_events')
    event_history_complete=not reasons
    if not reconciled:reasons.append('unreconciled_token_transfers')
    unsupported=[e for e in canonical if e['event'] not in {'PositionCreate','PositionClose','AddLiquidity','RemoveLiquidity','ClaimFee','ClaimFee2','Rebalancing','CompositionFee','IncreasePositionLength','DecreasePositionLength','UpdatePositionOperator','SetPositionPermissionlessOperationBitsEvt'}]
    if unsupported:reasons.append('unsupported_lifecycle_event')
    owners={e.get('fields',{}).get('owner') for e in canonical if e.get('fields',{}).get('owner')}
    if len(owners)>1:reasons.append('ownership_change_unallocated')
    chain_complete=not reasons
    missing_prices=prices is None or any(e['signature'] not in prices for e in canonical if e['event'] in {'AddLiquidity','RemoveLiquidity','ClaimFee','ClaimFee2','ClaimReward','ClaimReward2'})
    economic_reasons=list(reasons)
    if missing_prices:economic_reasons.append('timestamp_aligned_usd_prices_missing')
    if not costs_complete:economic_reasons.append('economic_cost_allocation_incomplete')
    return {'event_history_complete':event_history_complete,'cash_flow_reconciled':reconciled,'chain_history_complete':chain_complete,'chain_issues':sorted(set(reasons)),'economic_issues':sorted(set(economic_reasons)),'usd_pnl':None,'hold_benchmark_usd':None,'alias_pairs_suppressed':len(pairs)}


def get_tx(rpc,signature):
    config={'encoding':'json','maxSupportedTransactionVersion':0,'commitment':'finalized'}
    try:return rpc.call('getTransaction',[signature,config])
    except RuntimeError as exc:
        if '-32015' not in str(exc) or 'version (1)' not in str(exc):raise
        config['maxSupportedTransactionVersion']=1;return rpc.call('getTransaction',[signature,config])


def run(root=Path('data/phase3'),target=10):
    root=Path(root);scan=json.loads((root/'closed_scan.json').read_text());codec=Codec();rpc=RPC(root/'lifecycles');archive=Archive(root)
    extension=root/'extension/closed_scan.json'
    scan_events=scan['events']
    if extension.exists():scan_events=scan_events+json.loads(extension.read_text())['events']
    closes=[e for e in scan_events if e['event']=='PositionClose' and not e.get('decode_error')]
    closes=sorted({e['fields']['position']:e for e in closes}.values(),key=lambda e:(e['slot'],e.get('transaction_index',-1),e['outer_index'],e['inner_index'],e['signature']))[:target]
    records=[];all_rows=[];archive.api.interval=.3
    try:
        for close in closes:
            position=close['fields']['position'];print('lifecycle',len(records)+1,position,flush=True)
            record={'position':position,'closure_owner':close['fields']['owner'],'closure_signature':close['signature'],'closure_slot':close['slot'],'closure_time':close['block_time'],'solscan_close':f"https://solscan.io/tx/{close['signature']}",'errors':[],'transactions':[]}
            signatures=[];before=None;exhausted=False
            for page in range(4):
                config={'commitment':'finalized','limit':1000}
                if before:config['before']=before
                try:batch=rpc.call('getSignaturesForAddress',[position,config])
                except Exception as exc:record['errors'].append({'stage':'signatures','error':str(exc)});break
                signatures+=batch
                if len(batch)<1000:exhausted=True;break
                before=batch[-1]['signature']
            record['signature_history_exhausted']=exhausted;record['signatures_found']=len(signatures)
            txs={};events=[]
            for signature in signatures:
                if signature['slot']>close['slot'] or signature['err'] is not None:continue
                try:
                    tx=get_tx(rpc,signature['signature'])
                    if not tx:raise ValueError('Null transaction')
                    txs[signature['signature']]=tx
                    decoded=decode_all(tx,codec)
                    relevant=[e for e in decoded if e.get('fields',{}).get('position')==position]
                    # Retain unassignable decode failures and composition fee events as evidence.
                    unmatched=[e for e in decoded if e.get('decode_error')]
                    for e in decoded:
                        if e['event']!='CompositionFee':continue
                        peers=[d for d in decoded if d['outer_index']==e['outer_index'] and d.get('fields',{}).get('position') and d['event'] in ['AddLiquidity','Rebalancing']]
                        peer_positions={d['fields']['position'] for d in peers}
                        sender_matches=any(d['fields'].get('from',d['fields'].get('owner'))==e['fields']['from'] for d in peers)
                        if peer_positions=={position} and sender_matches:
                            relevant.append({**e,'attribution':'unique_position_and_sender_in_same_outer_invocation'})
                        else:unmatched.append(e)
                    events+=relevant
                    record['transactions'].append({'signature':signature['signature'],'slot':tx['slot'],'block_time':tx.get('blockTime'),'fee_lamports':tx['meta']['fee'],'fee_payer':account_keys(tx)[0],'all_decoded_events':decoded,'unmatched_events':unmatched})
                    if unmatched:record['errors'].append({'stage':'unmatched_events','signature':signature['signature'],'count':len(unmatched)})
                except Exception as exc:record['errors'].append({'stage':'transaction','signature':signature['signature'],'error':str(exc)})
            events=dedup_chain(events)
            creates=[e for e in events if e['event']=='PositionCreate'];pools={e.get('fields',{}).get('lb_pair') for e in events if e.get('fields',{}).get('lb_pair')}
            record.update(pool=next(iter(pools)) if len(pools)==1 else None,creation_signature=creates[0]['signature'] if len(creates)==1 else None,creation_time=creates[0]['block_time'] if len(creates)==1 else None,creation_owner=creates[0]['fields']['owner'] if len(creates)==1 else None,creation_slot=creates[0]['slot'] if len(creates)==1 else None)
            record['pool_metadata']=None
            if record['pool']:
                try:
                    payload,metadata=archive.get('/pools/{address}',f"/pools/{record['pool']}",{});record['pool_metadata']=payload;record['pool_metadata_provenance']=metadata
                except Exception as exc:record['errors'].append({'stage':'pool','error':str(exc)})
            try:
                payload,metadata=archive.get('/positions/{address}/historical',f'/positions/{position}/historical',{});record['api_history']=payload;record['api_provenance']=metadata
            except Exception as exc:record['errors'].append({'stage':'api_history','error':str(exc)})
            canonical,pairs=canonical_events(events);record['events']=events;record['alias_pairs']=pairs
            totals={k:[0,0] for k in ['deposits','withdrawals','claimed_fees']};reward_events=[];reconciliation=[]
            for e in canonical:
                fields=e['fields'];kind=e['event']
                if kind in ['AddLiquidity','RemoveLiquidity']:
                    dest=totals['deposits' if kind=='AddLiquidity' else 'withdrawals']
                    for i in range(2):dest[i]+=int(fields['amounts'][i])
                elif kind in ['ClaimFee','ClaimFee2']:
                    for i,s in enumerate(['x','y']):totals['claimed_fees'][i]+=int(fields[f'fee_{s}'])
                elif kind in ['ClaimReward','ClaimReward2']:reward_events.append(e)
                elif kind=='Rebalancing':
                    for i,s in enumerate(['x','y']):
                        totals['deposits'][i]+=fields[f'{s}_added_amount'];totals['withdrawals'][i]+=fields[f'{s}_withdrawn_amount'];totals['claimed_fees'][i]+=fields[f'{s}_fee_amount']
            pool=record['pool_metadata'];all_reconciled=bool(pool)
            for signature,tx in txs.items():
                es=[e for e in canonical if e['signature']==signature]
                all_events=decode_all(tx,codec);positions_in_tx={e.get('fields',{}).get('position') for e in all_events if e.get('fields',{}).get('position')}
                ambiguous=len(positions_in_tx)>1 or any(e['event'] in ['Swap','Swap2Evt'] and e.get('fields',{}).get('lb_pair')==record['pool'] for e in all_events)
                ts,unknown=transfers(tx);r={'signature':signature,'ambiguous':ambiguous,'unknown_token_instructions':unknown,'sides':[]}
                if pool:
                    for i,s in enumerate(['x','y']):
                        reserve=pool[f'reserve_{s}'];incoming=sum(t['amount'] for t in ts if t['destination']==reserve);outgoing=sum(t['amount'] for t in ts if t['source']==reserve)
                        expected_in=sum(e['fields']['amounts'][i] for e in es if e['event']=='AddLiquidity')
                        expected_out=sum(e['fields']['amounts'][i] for e in es if e['event']=='RemoveLiquidity')+sum(e['fields'][f'fee_{s}'] for e in es if e['event'] in ['ClaimFee','ClaimFee2'])
                        expected_in+=sum(e['fields'][f'{s}_added_amount'] for e in es if e['event']=='Rebalancing')
                        expected_out+=sum(e['fields'][f'{s}_withdrawn_amount']+e['fields'][f'{s}_fee_amount'] for e in es if e['event']=='Rebalancing')
                        matches=not ambiguous and expected_in==incoming and expected_out==outgoing
                        r['sides'].append({'side':s,'reserve_in_atomic':str(incoming),'reserve_out_atomic':str(outgoing),'event_deposit_atomic':str(expected_in),'event_withdraw_plus_fee_atomic':str(expected_out),'matches':matches})
                        all_reconciled&=matches
                else:all_reconciled=False
                reconciliation.append(r)
            record['token_cash_flows_atomic']={k:[str(v) for v in values] for k,values in totals.items()};record['reward_events']=reward_events;record['transfer_reconciliation']=reconciliation
            record['embedded_composition_fee_events']=[e for e in events if e['event']=='CompositionFee']
            record['composition_fee_treatment']='Retained as embedded deposit/rebalance cost; never added as a second external payment when deposits already reconcile to transfers.'
            if pool:
                record['token_cash_flows_ui']={k:[str(token_units(v,pool[f'token_{s}']['decimals'])) for v,s in zip(values,['x','y'])] for k,values in totals.items()}
                record['realized_token_inventory_change_atomic']=[str(totals['withdrawals'][i]+totals['claimed_fees'][i]-totals['deposits'][i]) for i in range(2)]
                chain_decimals={pool[f'token_{s}']['address']:set() for s in ['x','y']}
                for tx in txs.values():
                    for balance in tx['meta'].get('preTokenBalances',[])+tx['meta'].get('postTokenBalances',[]):
                        if balance['mint'] in chain_decimals:chain_decimals[balance['mint']].add(balance['uiTokenAmount']['decimals'])
                record['historical_decimal_checks']={s:{'api':pool[f'token_{s}']['decimals'],'observed_in_transactions':sorted(chain_decimals[pool[f'token_{s}']['address']]),'matches':chain_decimals[pool[f'token_{s}']['address']]=={pool[f'token_{s}']['decimals']}} for s in ['x','y']}
                needs_decimals=any(v for amounts in totals.values() for v in amounts)
                if needs_decimals and not all(x['matches'] for x in record['historical_decimal_checks'].values()):record['errors'].append({'stage':'decimals','error':'Missing or inconsistent historical token decimals'})
                record['funded']=bool(any(totals['deposits']))
                record['historical_pair_price_attempts']=[]
                for label,ts in [('creation',record['creation_time']),('closure',record['closure_time'])]:
                    if ts is None:continue
                    start=ts//300*300
                    try:
                        price,provenance=archive.get('/pools/{address}/ohlcv',f"/pools/{record['pool']}/ohlcv",{'timeframe':'5m','start_time':start,'end_time':start+300})
                        record['historical_pair_price_attempts'].append({'event':label,'event_time':ts,'response':price,'provenance':provenance,'usable_for_usd_pnl':False,'reason':'Pair OHLCV is not two timestamp-aligned independent mint/USD prices; candle may include trades after event.'})
                    except Exception as exc:record['historical_pair_price_attempts'].append({'event':label,'error':str(exc),'usable_for_usd_pnl':False})
            close_tx=txs.get(close['signature']);record['closure_lamports_zero']=False
            if close_tx and position in account_keys(close_tx):
                idx=account_keys(close_tx).index(position);record['closure_lamports_zero']=close_tx['meta']['postBalances'][idx]==0
                record['position_lamports_before_close']=close_tx['meta']['preBalances'][idx]
            record['observed_transaction_fee_lamports']=str(sum(tx['meta']['fee'] for tx in txs.values()))
            record['fee_attribution']='Full transaction fees observed; payer and other instructions retained. No arbitrary allocation to position.'
            history_failures=[e for e in record['errors'] if e['stage'] in ['signatures','transaction']]
            record['assessment']=evaluate(events,exhausted and not history_failures and record['closure_lamports_zero'],all_reconciled and not record['errors'])
            if any(t['unmatched_events'] for t in record['transactions']):
                record['assessment']['chain_issues'].append('unallocated_composition_or_unknown_events')
                record['assessment']['economic_issues'].append('unallocated_composition_or_unknown_events')
                record['assessment']['chain_history_complete']=False
            record['timestamp_aligned_prices']=None
            record['historical_valuation_note']='Pool API event totalUsd values are retained estimates, not independently timestamp-aligned mint/USD prices; current pool token prices are not historical prices.'
            records.append(record)
            for e in events:all_rows.append({'position':position,'signature':e['signature'],'slot':e['slot'],'block_time':e['block_time'],'outer_index':e['outer_index'],'inner_index':e['inner_index'],'event':e['event'],'fields_json':json.dumps(e.get('fields',{}),sort_keys=True),'raw_hex':e['raw_hex'],'solscan':f"https://solscan.io/tx/{e['signature']}"})
            atomic_json(root/'position_lifecycles.json',records)
    finally:rpc.http.close();archive.api.http.close()
    schema=pa.schema([('position',pa.string()),('signature',pa.string()),('slot',pa.int64()),('block_time',pa.int64()),('outer_index',pa.int64()),('inner_index',pa.int64()),('event',pa.string()),('fields_json',pa.string()),('raw_hex',pa.string()),('solscan',pa.string())])
    parquet_path=Path('POSITION_LIFECYCLES.parquet') if root==Path('data/phase3') else root/'POSITION_LIFECYCLES.parquet'
    pq.write_table(pa.Table.from_pylist(all_rows,schema=schema),parquet_path)
    print('positions',len(records),'chain complete',sum(r['assessment']['chain_history_complete'] for r in records))
    return records


if __name__=='__main__':
    import argparse
    parser=argparse.ArgumentParser();parser.add_argument('--output',type=Path,default=Path('data/phase3'));parser.add_argument('--target',type=int,default=10)
    args=parser.parse_args();run(args.output,args.target)
