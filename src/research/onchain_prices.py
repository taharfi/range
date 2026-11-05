"""Historical executed SOL/USDC legs, never represented as USD or a mid quote."""
import hashlib
import json
from collections import Counter,defaultdict
from decimal import Decimal
from pathlib import Path
from statistics import median

from research.dlmm_schema import Codec,account_keys,decode_all
from research.finance import token_units
from research.historical_prices import SOL,USDC
from research.lifecycle import transfers
from research.rpc_discovery import PROGRAM,b58decode

CLMM='CAMMCzo5YL8w4VFF8KVHrK22GGUsp5VTaW7grrKgrWqK'
AMM='675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8'
JUPITER='JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4'
D=Decimal

def schema_map():
    dlmm=json.loads(Path('data/evidence/dlmm-idl.json').read_text())
    clmm=json.loads(Path('data/phase5/schemas/raydium-clmm.json').read_text())
    result={}
    for program,idl,names,pool,vaults in [
        (PROGRAM,dlmm,{'swap','swap2','swap_exact_out','swap_exact_out2','swap_with_price_impact','swap_with_price_impact2'},'lb_pair',['reserve_x','reserve_y']),
        (CLMM,clmm,{'swap','swap_v2'},'pool_state',['input_vault','output_vault'])]:
        for ix in idl['instructions']:
            if ix['name'] not in names:continue
            accounts=[a['name'] for a in ix['accounts']]
            result[(program,bytes(ix['discriminator']))]=(ix['name'],accounts.index(pool),[accounts.index(v) for v in vaults])
    return result

def instructions(tx):
    """Invocation identities; inner indexes are preserved for independent evidence."""
    groups={g['index']:g['instructions'] for g in tx['meta'].get('innerInstructions') or []}
    for outer,ix in enumerate(tx['transaction']['message']['instructions']):
        yield outer,-1,ix
        for index,inner in enumerate(groups.get(outer,[])):yield outer,index,inner

def observation_quality(row):
    issues=list(row.get('validation_issues',[]))
    if D(row['trade_size_usdc'])<100:issues.append('tiny_trade_below_100_usdc')
    if D(row['historical_usdc_vault_balance'])<100000:issues.append('usdc_vault_below_100k')
    if D(row['reserve_consumption_proxy'])>D('.01'):issues.append('reserve_consumption_above_1pct')
    return sorted(set(issues))

def extract(tx,schemas=None,codec=None):
    if not tx.get('meta') or tx['meta'].get('err') is not None:return []
    schemas=schemas or schema_map();codec=codec or Codec();keys=account_keys(tx)
    if not {PROGRAM,CLMM,AMM}.intersection(keys):return []
    balances=tx['meta'].get('preTokenBalances',[])
    if not {SOL,USDC}.issubset({b['mint'] for b in balances}):return []
    pre={b['accountIndex']:b for b in tx['meta'].get('preTokenBalances',[])}
    post={b['accountIndex']:b for b in tx['meta'].get('postTokenBalances',[])}
    moves,_=transfers(tx);events=decode_all(tx,codec);candidates=[]
    for outer,index,ix in instructions(tx):
        program=keys[ix['programIdIndex']]
        if program not in {PROGRAM,CLMM,AMM} or 'data' not in ix:continue
        raw=b58decode(ix['data']);spec=schemas.get((program,raw[:8]));accounts=ix.get('accounts',[])
        if program==AMM and len(raw)==17:
            if raw[0] in {9,11} and len(accounts) in {17,18}:
                spec=('swap_base_in' if raw[0]==9 else 'swap_base_out',1,[4,5] if len(accounts)==17 else [5,6])
            elif raw[0] in {16,17} and len(accounts)==8:spec=('swap_v2',1,[3,4])
        if not spec:continue
        name,pool_idx,vault_idx=spec
        if len(accounts)<=max([pool_idx]+vault_idx):continue
        vaults=[accounts[i] for i in vault_idx]
        if any(v not in pre or v not in post for v in vaults):continue
        if {pre[v]['mint'] for v in vaults}!={SOL,USDC}:continue
        candidates.append((outer,index,program,name,keys[accounts[pool_idx]],vaults))
    counts=Counter(c[4] for c in candidates);result=[]
    for outer,index,program,name,pool,vaults in candidates:
        issues=[]
        if counts[pool]!=1:issues.append('multiple_same_pool_invocations_transaction')
        amounts={};reserves={};raw_amounts={};decimals={};directions={}
        for v in vaults:
            b=pre[v];mint=b['mint'];scale=b['uiTokenAmount']['decimals'];decimals[mint]=scale
            if scale!={SOL:9,USDC:6}[mint] or post[v]['mint']!=mint or post[v]['uiTokenAmount']['decimals']!=scale:issues.append('mint_or_decimals_mismatch')
            # Only a unique invocation is admitted. Net reserve deltas must agree
            # with independent raw SPL transfers in the same outer invocation.
            inbound=sum(m['amount'] for m in moves if m['outer_index']==outer and m['destination']==keys[v])
            outbound=sum(m['amount'] for m in moves if m['outer_index']==outer and m['source']==keys[v])
            delta=int(post[v]['uiTokenAmount']['amount'])-int(b['uiTokenAmount']['amount'])
            if inbound-outbound!=delta:issues.append('reserve_delta_transfer_mismatch')
            if (inbound>0)==(outbound>0):issues.append('ambiguous_or_missing_transfer_direction')
            amount=max(inbound,outbound)
            # Cumulative transfer amounts are not silently coerced to u64.
            if amount>=2**64:issues.append('transfer_sum_exceeds_u64');continue
            raw_amounts[mint]=str(amount);amounts[mint]=token_units(amount,scale);directions[mint]='in' if inbound else 'out'
            reserves[mint]=token_units(b['uiTokenAmount']['amount'],scale)
        if set(amounts)!={SOL,USDC} or not all(amounts.values()):continue
        if directions[SOL]==directions[USDC]:issues.append('not_opposite_token_directions')
        relevant=[e for e in events if e.get('fields',{}).get('lb_pair')==pool and e['outer_index']==outer and e['event'] in {'Swap','Swap2Evt'}]
        rich=[e for e in relevant if e['event']=='Swap2Evt'];preferred=rich or relevant
        matched_event=None
        if program==PROGRAM:
            if len(preferred)!=1 or preferred[0].get('decode_error'):issues.append('swap_event_missing_or_ambiguous')
            else:
                matched_event=preferred[0];f=matched_event['fields'];mint_x=pre[vaults[0]]['mint'];mint_y=pre[vaults[1]]['mint']
                input_mint,output_mint=(mint_x,mint_y) if f['swap_for_y'] else (mint_y,mint_x)
                if f.get('amount_left',0):issues.append('unused_input_requires_extra_attribution')
                if str(f['amount_in'])!=raw_amounts[input_mint] or str(f['amount_out'])!=raw_amounts[output_mint]:issues.append('event_transfer_amount_mismatch')
        price=amounts[USDC]/amounts[SOL]
        row={'signature':tx['transaction']['signatures'][0],'slot':tx['slot'],'timestamp':tx['blockTime'],
             'transaction_index':tx.get('transaction_index'),'outer_index':outer,'inner_index':index,
             'pool':pool,'program':program,'venue':'Meteora DLMM' if program==PROGRAM else 'Raydium CLMM' if program==CLMM else 'Raydium AMM v4',
             'instruction':name,'jupiter_program_present':JUPITER in keys,'transaction_fee_payer':keys[0],
             'sol_atomic':raw_amounts[SOL],'usdc_atomic':raw_amounts[USDC],
             'sol_decimals':decimals[SOL],'usdc_decimals':decimals[USDC],'sol_direction_relative_to_pool':directions[SOL],
             'price_usdc_per_sol':str(price),'trade_size_sol':str(amounts[SOL]),'trade_size_usdc':str(amounts[USDC]),
             'historical_sol_vault_balance':str(reserves[SOL]),'historical_usdc_vault_balance':str(reserves[USDC]),
             'reserve_consumption_proxy':str(max(amounts[m]/reserves[m] if reserves[m] else D('Infinity') for m in [SOL,USDC])),
             'active_bin_liquidity':None,'actual_price_impact':None,'liquidity_note':'Transaction pre-vault balances, not active-bin depth or executable liquidity.',
             'matched_event':matched_event,'validation_issues':issues,'evidence_tier':'exact_execution_evidence' if not issues else 'unverified_execution',
             'solscan':f"https://solscan.io/tx/{tx['transaction']['signatures'][0]}"}
        row['reference_rejections']=observation_quality(row);row['reference_eligible']=not row['reference_rejections'];result.append(row)
    return result

def robust_reference(observations,target_slot,target_time,max_age=60):
    """Past-only, pool-balanced median. No volume weighting or duplicate votes."""
    rows=[r for r in observations if r['reference_eligible'] and r['slot']<target_slot and 0<=target_time-r['timestamp']<=max_age]
    unique={(r['signature'],r['outer_index'],r['inner_index']):r for r in rows};rows=list(unique.values())
    if not rows:return {'available':False,'reason':'no_eligible_strictly_prior_observations'}
    groups=defaultdict(list)
    for r in rows:groups[r['pool']].append(D(r['price_usdc_per_sol']))
    per_pool={k:median(v) for k,v in groups.items()};center=median(per_pool.values());mad=median([abs(v-center) for v in per_pool.values()])
    threshold=max(center*D('.002'),mad*4)
    admitted={k:v for k,v in per_pool.items() if abs(v-center)<=threshold}
    retained=[r for r in rows if r['pool'] in admitted];price=median(admitted.values())
    deviations=[abs(D(r['price_usdc_per_sol'])/price-1) for r in retained]
    dispersion=max(deviations,default=D(0));venues=sorted({r['venue'] for r in retained})
    # Dispersion is observed agreement, NOT a statistical error bound.
    protocols=sorted({'Meteora' if r['venue']=='Meteora DLMM' else 'Raydium' if r['venue'].startswith('Raydium') else r['venue'] for r in retained})
    return {'available':True,'price_usdc_per_sol':str(price),'pool_count':len(admitted),'venue_count':len(venues),'venues':venues,
            'protocol_count':len(protocols),'protocols':protocols,
            'fee_payer_count':len({r.get('transaction_fee_payer',r['signature']) for r in retained}),
            'trade_count':len(retained),'signature_count':len({r['signature'] for r in retained}),
            'max_age_seconds':max(target_time-r['timestamp'] for r in retained),
            'observed_max_deviation_fraction':str(dispersion),'pool_mad':str(mad),
            'outlier_pools':sorted(set(per_pool)-set(admitted)),
            'quality':'approximate_historical_estimate',
            'quality_reason':'Executed trade median; active depth, counterfactual execution and absolute market error not established.',
            'observations':[{'signature':r['signature'],'slot':r['slot'],'pool':r['pool'],'outer_index':r['outer_index'],'inner_index':r['inner_index'],
                             'distance_seconds':target_time-r['timestamp'],'price_usdc_per_sol':r['price_usdc_per_sol']} for r in retained]}

def cached_blocks(root):
    for request_path in sorted((Path(root)/'rpc').glob('*.request.json')):
        request=json.loads(request_path.read_text())
        if request['method']!='getBlock':continue
        body_path=request_path.with_name(request_path.name.replace('.request.json','.json'))
        meta=json.loads(body_path.with_suffix('.meta.json').read_text());raw=body_path.read_bytes()
        if hashlib.sha256(raw).hexdigest()!=meta['sha256']:raise ValueError('RPC evidence hash mismatch')
        payload=json.loads(raw);block=payload.get('result')
        if block:yield request['params'][0],block

def decode_archive(root):
    codec=Codec();schemas=schema_map();observations=[];errors=[];count=0;seen=set()
    for slot,block in cached_blocks(root):
        for index,tx in enumerate(block['transactions']):
            count+=1;seen.add(tx['transaction']['signatures'][0]);tx.update(slot=slot,blockTime=block['blockTime'],transaction_index=index)
            try:observations.extend(extract(tx,schemas,codec))
            except Exception as exc:errors.append({'slot':slot,'signature':tx['transaction']['signatures'][0],'error':str(exc)})
    for request_path in sorted((Path(root)/'rpc').glob('*.request.json')):
        request=json.loads(request_path.read_text())
        if request['method']!='getTransaction':continue
        body_path=request_path.with_name(request_path.name.replace('.request.json','.json'))
        raw=body_path.read_bytes();meta=json.loads(body_path.with_suffix('.meta.json').read_text())
        if hashlib.sha256(raw).hexdigest()!=meta['sha256']:raise ValueError('RPC evidence hash mismatch')
        tx=json.loads(raw).get('result')
        if not tx or tx['transaction']['signatures'][0] in seen:continue
        seen.add(tx['transaction']['signatures'][0]);count+=1
        try:observations.extend(extract(tx,schemas,codec))
        except Exception as exc:errors.append({'slot':tx['slot'],'signature':tx['transaction']['signatures'][0],'error':str(exc)})
    return observations,errors,count
