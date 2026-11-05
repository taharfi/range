"""Historical USD attribution, independent balance checks and funded hold benchmark."""
import csv
import json
from collections import defaultdict
from decimal import Decimal, localcontext
from pathlib import Path

from research.collector import atomic_json
from research.dlmm_schema import account_keys
from research.finance import token_units
from research.historical_prices import CoinGeckoHistorical,HTTPArchive,SOL,USDC,select_asof
from research.lifecycle import TOKEN_PROGRAMS,canonical_events,get_tx
from research.rpc_discovery import RPC,b58decode,b58encode


def ledger(record):
    result=[];pool=record['pool_metadata'];events,_=canonical_events(record['events'])
    for e in events:
        f=e['fields'];kind=e['event'];parts=[]
        if kind in ['AddLiquidity','RemoveLiquidity']:parts=[('deposit' if kind=='AddLiquidity' else 'withdrawal',f['amounts'])]
        elif kind in ['ClaimFee','ClaimFee2']:parts=[('fee',[f['fee_x'],f['fee_y']])]
        elif kind=='Rebalancing':parts=[('deposit',[f['x_added_amount'],f['y_added_amount']]),('withdrawal',[f['x_withdrawn_amount'],f['y_withdrawn_amount']]),('fee',[f['x_fee_amount'],f['y_fee_amount']])]
        elif kind in ['ClaimReward','ClaimReward2']:raise ValueError('Reward mint attribution requires historical reward configuration')
        for label,amounts in parts:
            for side,amount in zip(['x','y'],amounts):
                if amount:
                    result.append({'kind':label,'mint':pool[f'token_{side}']['address'],'atomic':str(amount),'decimals':pool[f'token_{side}']['decimals'],'time':e['block_time'],'signature':e['signature'],'outer_index':e['outer_index'],'inner_index':e['inner_index']})
    return result


def initialized_owner_token_accounts(tx,owner):
    """Identify temporary accounts even when closed within one transaction.

    Such accounts can be absent from both pre/postTokenBalances; their token
    initialization instructions still specify the mint and controlling owner.
    """
    keys=account_keys(tx);found=set()
    instructions=tx['transaction']['message']['instructions']+[ix for group in tx['meta'].get('innerInstructions',[]) for ix in group['instructions']]
    for ix in instructions:
        if keys[ix['programIdIndex']] not in TOKEN_PROGRAMS or 'data' not in ix:continue
        data=b58decode(ix['data']);accounts=ix.get('accounts',[])
        if not data or len(accounts)<2 or keys[accounts[1]] not in {SOL,USDC}:continue
        controller=None
        if data[0]==1 and len(accounts)>=3:controller=keys[accounts[2]]
        elif data[0] in {16,18} and len(data)==33:controller=b58encode(data[1:33])
        if controller==owner:found.add(accounts[0])
    return found


def verify_balances(record,rpc):
    """Check event sums against reserve pre/post balances independently of SPL decoding.

    Reconcile owner native+wrapped SOL plus recoverable account rent against LP
    SOL flows and meta.fee. An unexplained residual blocks cost attribution.
    """
    flows=ledger(record);pool=record['pool_metadata'];owner=record['creation_owner'];rows=[];costs=[];issues=[]
    sigs=rpc.call('getSignaturesForAddress',[record['position'],{'commitment':'finalized','limit':1000}])
    if len(sigs)>=1000:issues.append('signature_page_budget_not_exhausted')
    for item in sigs:
        if not record['creation_slot']<=item['slot']<=record['closure_slot']:continue
        tx=get_tx(rpc,item['signature'])
        if tx is None:issues.append('transaction_unavailable');continue
        keys=account_keys(tx);meta=tx['meta'];ts=tx.get('blockTime');signature=item['signature'];own_flows=[f for f in flows if f['signature']==signature]
        payer=keys[0];fee=meta['fee'];row={'signature':signature,'slot':tx['slot'],'block_time':ts,'failed':meta['err'] is not None,'fee_lamports':fee,'fee_payer':payer,'solscan':f'https://solscan.io/tx/{signature}','reserve_checks':[]}
        for side in ['x','y']:
            reserve=pool[f'reserve_{side}'];mint=pool[f'token_{side}']['address']
            expected=sum(int(f['atomic'])*(1 if f['kind']=='deposit' else -1) for f in own_flows if f['mint']==mint)
            if reserve not in keys:
                passed=expected==0;actual=0
            else:
                idx=keys.index(reserve)
                pre=next((b for b in meta.get('preTokenBalances',[]) if b['accountIndex']==idx),None)
                post=next((b for b in meta.get('postTokenBalances',[]) if b['accountIndex']==idx),None)
                actual=int(post['uiTokenAmount']['amount'])-int(pre['uiTokenAmount']['amount']) if pre and post else None
                passed=actual==expected
            row['reserve_checks'].append({'mint':mint,'expected_event_delta_atomic':str(expected),'actual_balance_delta_atomic':str(actual) if actual is not None else None,'matches':passed})
            if not passed:issues.append('reserve_balance_delta_mismatch')
        # Correctly avoid double-counting WSOL: use its account lamports, which
        # already include both wrapped inventory and recoverable rent collateral.
        controlled={b['accountIndex']:b for b in meta.get('preTokenBalances',[])+meta.get('postTokenBalances',[]) if b.get('owner')==owner}
        usdc_pre=sum(int(b['uiTokenAmount']['amount']) for b in meta.get('preTokenBalances',[]) if b.get('owner')==owner and b['mint']==USDC)
        usdc_post=sum(int(b['uiTokenAmount']['amount']) for b in meta.get('postTokenBalances',[]) if b.get('owner')==owner and b['mint']==USDC)
        usdc_expected=sum(int(f['atomic'])*(-1 if f['kind']=='deposit' else 1) for f in own_flows if f['mint']==USDC)
        row['owner_usdc_delta_atomic']=str(usdc_post-usdc_pre);row['owner_usdc_expected_atomic']=str(usdc_expected)
        if usdc_post-usdc_pre!=usdc_expected:issues.append('owner_usdc_balance_mismatch')
        if owner not in keys:
            residual=None;issues.append('owner_native_balance_missing')
        else:
            owner_idx=keys.index(owner);indexes={owner_idx}|initialized_owner_token_accounts(tx,owner)
            if record['position'] in keys:indexes.add(keys.index(record['position']))
            for idx,b in controlled.items():
                if b['mint'] in {SOL,USDC}:indexes.add(idx)
                else:issues.append('unrelated_owner_token_activity')
            wealth_delta=sum(meta['postBalances'][i]-meta['preBalances'][i] for i in indexes)
            sol_flow=sum(int(f['atomic'])*(-1 if f['kind']=='deposit' else 1) for f in own_flows if f['mint']==SOL)
            residual=wealth_delta-sol_flow+(fee if payer==owner else 0)
            # Explicit native transfers leaving the controlled-account set are
            # observed transaction payments, not automatically labeled tips.
            payments=[]
            instructions=tx['transaction']['message']['instructions']+[ix for group in meta.get('innerInstructions',[]) for ix in group['instructions']]
            for ix in instructions:
                if keys[ix['programIdIndex']]!='11111111111111111111111111111111' or 'data' not in ix:continue
                data=b58decode(ix['data']);accounts=ix.get('accounts',[])
                if len(data)==12 and int.from_bytes(data[:4],'little')==2 and len(accounts)>=2:
                    source,dest=accounts[:2]
                    if keys[source]==owner and dest not in indexes:
                        amount=int.from_bytes(data[4:12],'little')
                        payments.append({'destination':keys[dest],'lamports':str(amount)})
            row['observed_external_native_payments']=payments
            if payments and residual+sum(int(p['lamports']) for p in payments)==0:
                for payment in payments:
                    costs.append({'kind':'cost','mint':SOL,'atomic':payment['lamports'],'decimals':9,'time':ts,'signature':signature,'classification':'observed_external_native_transaction_payment','destination':payment['destination'],'estimated':False})
                residual=0
            if residual!=0:issues.append('unallocated_native_sol_balance_residual')
        row['owner_sol_wealth_residual_lamports']=str(residual) if residual is not None else None
        if payer!=owner:issues.append('network_fee_paid_by_other_party')
        elif ts is not None:costs.append({'kind':'cost','mint':SOL,'atomic':str(fee),'decimals':9,'time':ts,'signature':signature,'classification':'observed_network_fee','estimated':False})
        else:issues.append('fee_timestamp_missing')
        rows.append(row)
    return {'transactions':rows,'costs':costs,'complete':not issues,'issues':sorted(set(issues))}


def value_flows(flows,costs,prices,exit_time,max_age):
    """LP payouts become USD cash when received; no interest/reinvestment assumed.

    Hold counterfactual keeps every externally funded token lot until closure.
    Contributions have exactly the same mints, quantities and funding timestamps.
    Fees/withdrawals never create additional benchmark purchase lots.
    """
    with localcontext() as ctx:
        ctx.prec=100;totals={k:Decimal(0) for k in ['deposit','withdrawal','fee','reward','cost']};missing=[];quotes=[];hold_terminal=Decimal(0)
        for flow in flows+costs:
            quote=select_asof(prices.get(flow['mint'],[]),flow['time'],max_age)
            quotes.append({**flow,'price_observation':quote})
            if not quote['usable']:missing.append(f"{flow['signature']}:{flow['mint']}:{quote['quality']}");continue
            totals[flow['kind']]+=token_units(flow['atomic'],flow['decimals'])*Decimal(quote['price'])
        for flow in flows:
            if flow['kind']!='deposit':continue
            quote=select_asof(prices.get(flow['mint'],[]),exit_time,max_age)
            if not quote['usable']:missing.append(f"hold:{flow['mint']}:{quote['quality']}");continue
            hold_terminal+=token_units(flow['atomic'],flow['decimals'])*Decimal(quote['price'])
        if missing:return {'available':False,'missing':sorted(set(missing)),'quotes':quotes,'net_usd_pnl':None,'hold_pnl_usd':None,'excess_vs_hold_usd':None}
        net=totals['withdrawal']+totals['fee']+totals['reward']-totals['deposit']-totals['cost']
        hold=hold_terminal-totals['deposit']
        return {'available':True,'missing':[],'quotes':quotes,'totals_usd':{k:str(v) for k,v in totals.items()},'net_usd_pnl':str(net),'hold_pnl_usd':str(hold),'hold_terminal_usd':str(hold_terminal),'excess_vs_hold_usd':str(net-hold),'return_on_deposited_value':str(net/totals['deposit']) if totals['deposit'] else None}


def run(root=Path('data/phase4')):
    root=Path(root);policy={'strict_max_age_seconds':60,'coarse_sensitivity_max_age_seconds':3600,'future_prices_allowed':False,'interpolation':False,'valuation':'Historical market-value estimate, not executable swap proceeds','benchmark':'Hold each funded token lot to closure; LP withdrawals/fees held as USD cash from receipt; no interest; no new purchase lots for fees/withdrawals; hold incurs no LP transaction fees; recoverable rent is collateral, not expense.'}
    path=root/'pricing_policy.json'
    if path.exists() and json.loads(path.read_text())!=policy:raise ValueError('Frozen pricing policy differs')
    atomic_json(path,policy)
    records=json.loads((root/'position_lifecycles.json').read_text());rpc=RPC(root/'lifecycles');http=HTTPArchive(root);cg=CoinGeckoHistorical(http);reports=[];errors=[];daily_prices={}
    try:
        for record in records:
            print('USD audit',record['position'],flush=True)
            try:
                if {record['pool_metadata'][s]['address'] for s in ['token_x','token_y']}!={SOL,USDC}:raise ValueError('Not SOL/USDC')
                flows=ledger(record);verification=verify_balances(record,rpc)
                needed=flows+verification['costs']+[{'mint':SOL,'time':record['closure_time']},{'mint':USDC,'time':record['closure_time']}]
                prices=defaultdict(list)
                for mint,day in sorted({(f['mint'],f['time']//86400*86400) for f in needed}):
                    key=(mint,day)
                    if key not in daily_prices:
                        try:daily_prices[key]=cg.fetch(mint,day,day+86400-1)
                        except Exception as exc:
                            daily_prices[key]=[];errors.append({'mint':mint,'day':day,'error':str(exc)})
                    prices[mint]+=daily_prices[key]
                # Merge repeated day-edge observations without changing their source time.
                prices={mint:list({(p['timestamp'],p['price']):p for p in values}.values()) for mint,values in prices.items()}
                strict=value_flows(flows,verification['costs'],prices,record['closure_time'],policy['strict_max_age_seconds'])
                coarse=value_flows(flows,verification['costs'],prices,record['closure_time'],policy['coarse_sensitivity_max_age_seconds'])
                verified=record['funded'] and record['assessment']['chain_history_complete'] and verification['complete'] and strict['available']
                reports.append({'position':record['position'],'owner':record['creation_owner'],'pool':record['pool'],'funded':record['funded'],'creation_time':record['creation_time'],'closure_time':record['closure_time'],'closure_signature':record['closure_signature'],'creation_signature':record['creation_signature'],'chain_history_complete':record['assessment']['chain_history_complete'],'independent_verification':verification,'flows':flows,'price_series':prices,'strict':strict,'coarse_sensitivity':coarse,'verified':verified,'status':'verified_under_declared_market_value_and_cost_policy' if verified else 'unverified'})
            except Exception as exc:errors.append({'position':record['position'],'error':str(exc)})
            atomic_json(root/'usd_analysis.json',{'policy':policy,'positions':reports,'errors':errors})
    finally:rpc.http.close();http.http.close()
    pnl=[];hold=[]
    for row in reports:
        strict=row['strict'];coarse=row['coarse_sensitivity'];valid=row['verified'];why=[]
        if not strict['available']:why.append('strict_historical_price_coverage_incomplete')
        why+=row['independent_verification']['issues']
        pnl.append({'position':row['position'],'status':row['status'],'funded':row['funded'],'chain_reconciled':row['chain_history_complete'],'cost_and_balance_reconciliation':row['independent_verification']['complete'],'net_usd_pnl':strict['net_usd_pnl'] if valid else None,'source_priced_scenario_pnl_usd_60s':strict['net_usd_pnl'],'coarse_sensitivity_pnl_usd_3600s':coarse['net_usd_pnl'],'coarse_sensitivity_status':'unverified_hourly_mark_to_market_sensitivity' if coarse['available'] else 'unavailable','observable_network_fees_lamports':str(sum(int(c['atomic']) for c in row['independent_verification']['costs'] if c['classification']=='observed_network_fee')),'observable_native_payments_lamports':str(sum(int(c['atomic']) for c in row['independent_verification']['costs'] if c['classification']=='observed_external_native_transaction_payment')),'missing_reasons':'|'.join(sorted(set(why))),'creation_solscan':f"https://solscan.io/tx/{row['creation_signature']}",'closure_solscan':f"https://solscan.io/tx/{row['closure_signature']}"})
        hold.append({'position':row['position'],'status':row['status'],'hold_benchmark_pnl_usd':strict['hold_pnl_usd'] if valid else None,'excess_lp_vs_hold_usd':strict['excess_vs_hold_usd'] if valid else None,'coarse_sensitivity_hold_pnl_usd_3600s':coarse['hold_pnl_usd'],'coarse_sensitivity_excess_usd_3600s':coarse['excess_vs_hold_usd'],'funding_lots':sum(f['kind']=='deposit' for f in row['flows']),'benchmark_convention':policy['benchmark']})
    for name,rows in [('POSITION_USD_PNL.csv',pnl),('HOLD_BENCHMARKS.csv',hold)]:
        if rows:
            with Path(name).open('w',encoding='utf-8',newline='') as f:
                writer=csv.DictWriter(f,fieldnames=list(rows[0]));writer.writeheader();writer.writerows(rows)
    print('funded positions',sum(r['funded'] for r in reports),'verified USD',sum(r['verified'] for r in reports),'coarse sensitivities',sum(r['coarse_sensitivity']['available'] for r in reports),'errors',len(errors))
    return reports


if __name__=='__main__':run()
