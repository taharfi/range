"""Reproducible historical reference recovery and explicitly estimated USD marks."""
import csv
import hashlib
import json
from collections import Counter,defaultdict
from decimal import Decimal,localcontext
from pathlib import Path
from statistics import median

from research.collector import atomic_json
from research.finance import token_units
from research.historical_prices import SOL,USDC,select_asof
from research.onchain_prices import decode_archive,robust_reference

D=Decimal
ROOT=Path('data/phase5')

def empirical_history(points,time):
    """Past-only six-hour observed range. This is a sensitivity, never a CI."""
    q=select_asof(points,time,3600)
    if not q['usable']:return None
    past={p['timestamp']:D(p['price']) for p in points if time-21600<=p['timestamp']<=time and D(p['price'])>0}
    if len(past)<3:return None
    center=D(q['price']);values=list(past.values())
    variation=max(abs(p/center-1) for p in values)
    return {'asof':q,'past_samples':len(values),'past_window_seconds':max(past)-min(past),
            'observed_range_fraction':str(variation),
            'interpretation':'Observed prior six-hour range relative to last sample; not a bound on future or unobserved prices.'}

def estimate_quote(mint,time,slot,series,reference):
    history=empirical_history(series.get(mint,[]),time)
    if not history:return {'available':False,'quality':'unavailable','reason':'insufficient_past_usd_history_for_measured_sensitivity'}
    p=D(history['asof']['price']);variation=D(history['observed_range_fraction']);method='coarse_historical_usd_aggregate'
    components={'usd_aggregate':history['asof']};comparison=None
    if mint==SOL and reference.get('available'):
        anchor=empirical_history(series.get(USDC,[]),time)
        if not anchor:return {'available':False,'quality':'unavailable','reason':'usdc_usd_anchor_unavailable'}
        onchain=D(reference['price_usdc_per_sol'])*D(anchor['asof']['price'])
        comparison=onchain/p-1
        # Absolute hourly/source disagreement and past range are observed stress
        # magnitudes, NOT a promise that the true target price lies inside them.
        variation=max(variation,abs(comparison),D(reference['observed_max_deviation_fraction']))+D(anchor['observed_range_fraction'])
        p=onchain;method='prior_swap_reference_times_historical_usdc_usd'
        components={'onchain':reference,'usdc_usd':anchor}
    return {'available':True,'quality':'approximate_historical_estimate','verified':False,'method':method,'price':str(p),
            'target_timestamp':time,'target_slot':slot,'mint':mint,'components':components,'empirical_history':history,
            'empirical_sensitivity_fraction':str(variation),'onchain_vs_hourly_fraction':str(comparison) if comparison is not None else None,
            'price_low_sensitivity':str(p*max(D(0),1-variation)),'price_high_sensitivity':str(p*(1+variation)),
            'uncertainty_status':'Empirical stress envelope; uncalibrated, no probabilistic coverage guarantee.'}

def cash_coefficients(flows,costs,exit_time):
    """One coefficient per token/time; shared marks cancel before sensitivity."""
    net=defaultdict(D);hold=defaultdict(D)
    for f in flows+costs:
        quantity=token_units(f['atomic'],f['decimals']);key=(f['mint'],f['time'])
        net[key]+=quantity*(-1 if f['kind'] in {'deposit','cost'} else 1)
        if f['kind']=='deposit':hold[key]-=quantity;hold[(f['mint'],exit_time)]+=quantity
    excess={k:net[k]-hold[k] for k in set(net)|set(hold)}
    return {'net':dict(net),'hold':dict(hold),'excess':excess}

def value_coefficients(coefficients,quotes,stress=None):
    total=low=high=D(0)
    for key,amount in coefficients.items():
        if not amount:continue
        q=quotes[key]
        if not q['available']:return None
        price=D(q['price']);a=D(q['price_low_sensitivity']);b=D(q['price_high_sensitivity'])
        if stress is not None:a=price*(1-stress);b=price*(1+stress)
        total+=amount*price;low+=amount*(a if amount>=0 else b);high+=amount*(b if amount>=0 else a)
    return {'central':str(total),'low_sensitivity':str(low),'high_sensitivity':str(high)}

def write_csv(path,rows):
    if not rows:return
    with Path(path).open('w',encoding='utf-8',newline='') as f:
        w=csv.DictWriter(f,fieldnames=list(rows[0]));w.writeheader();w.writerows(rows)

def run():
    with localcontext() as ctx:
        ctx.prec=100
        return _run()

def _run():
    prior=json.loads(Path('data/phase4/usd_analysis.json').read_text());plan=json.loads((ROOT/'capture_plan.json').read_text())
    exchange_path=ROOT/'exchange_validation.json'
    exchange=json.loads(exchange_path.read_text()) if exchange_path.exists() else {}
    exchange_scenarios={p['position']:p for p in exchange.get('position_scenarios',[])}
    policy={'quality_tiers':['exact_execution_evidence','high_confidence_historical_market_estimate','approximate_historical_estimate','unavailable'],
            'legacy_freshness_seconds':60,'reference_max_age_seconds':60,'usd_aggregate_max_age_seconds':3600,
            'minimum_trade_usdc':100,'minimum_historical_usdc_vault':100000,'maximum_reserve_consumption_fraction':'.01',
            'reference':'Median trade per pool, then median pools; reject pool medians > max(4 MAD,20bps) from cross-pool median.',
            'future_prices':False,'uncertainty':'Past six-hour observed range, cross-source disagreement and swap dispersion; stress only, no coverage guarantee.',
            'verified_usd_requires':'Independent target-time USD validation and calibrated uncertainty; not satisfied by an hourly stablecoin anchor.',
            'benchmark':prior['policy']['benchmark']}
    policy_path=ROOT/'policy.json'
    if policy_path.exists() and json.loads(policy_path.read_text())!=policy:raise ValueError('Frozen policy differs')
    atomic_json(policy_path,policy)
    observations,errors,txcount=decode_archive(ROOT);atomic_json(ROOT/'onchain_observations.json',observations)
    atomic_json(ROOT/'decode_diagnostics.json',{'transactions':txcount,'errors':errors})
    targets={(t['slot'],t['time']) for t in plan['targets']}
    references={key:robust_reference(observations,*key) for key in targets}
    atomic_json(ROOT/'references.json',[{'target_slot':k[0],'target_timestamp':k[1],**v} for k,v in sorted(references.items())])
    series=defaultdict(dict)
    for p in prior['positions']:
        for mint,points in p['price_series'].items():
            for q in points:series[mint][(q['timestamp'],q['price'])]=q
    series={mint:list(points.values()) for mint,points in series.items()}
    results=[];pnl_rows=[];quote_rows=[];comparisons=[];distance_rows=[]
    for (slot,time),ref in sorted(references.items()):
        for o in observations:
            if o['slot']<slot and 0<=time-o['timestamp']<=60:
                distance_rows.append({'target_slot':slot,'target_timestamp':time,'signature':o['signature'],'outer_index':o['outer_index'],'inner_index':o['inner_index'],
                                      'pool':o['pool'],'distance_seconds':time-o['timestamp'],'eligible':o['reference_eligible'],'rejections':'|'.join(o['reference_rejections'])})
        q=estimate_quote(SOL,time,slot,series,ref)
        if q.get('onchain_vs_hourly_fraction') is not None:
            comparisons.append({'slot':slot,'timestamp':time,'onchain_sol_usdc':ref['price_usdc_per_sol'],
                                'usdc_usd':q['components']['usdc_usd']['asof']['price'],'hourly_sol_usd':q['empirical_history']['asof']['price'],
                                'hourly_age_seconds':q['empirical_history']['asof']['age_seconds'],
                                'difference_fraction':q['onchain_vs_hourly_fraction'],'trade_count':ref['trade_count'],'pools':ref['pool_count'],'venues':ref['venue_count']})
    for p in prior['positions']:
        txs=p['independent_verification']['transactions'];time_slots={t['block_time']:t['slot'] for t in txs}
        coefficients=cash_coefficients(p['flows'],p['independent_verification']['costs'],p['closure_time'])
        keys=set().union(*(c.keys() for c in coefficients.values()));quotes={}
        for mint,time in sorted(keys):
            slot=time_slots[time];ref=references[(slot,time)]
            quotes[(mint,time)]=estimate_quote(mint,time,slot,series,ref)
            q=quotes[(mint,time)];quote_rows.append({'position':p['position'],'mint':mint,'target_time':time,'target_slot':slot,
                          'quality':q['quality'],'method':q.get('method'),'price':q.get('price'),
                          'empirical_sensitivity_fraction':q.get('empirical_sensitivity_fraction'),'reason':q.get('reason')})
        complete=p['chain_history_complete'] and p['independent_verification']['complete']
        values={name:value_coefficients(c,quotes) if complete else None for name,c in coefficients.items()}
        available=all(v is not None for v in values.values())
        row={'position':p['position'],'status':'approximate_historical_estimate' if available else 'unavailable','verified_usd_pnl':None,
             'estimated_net_usd_pnl':values['net']['central'] if values['net'] else None,
             'empirical_pnl_low_sensitivity':values['net']['low_sensitivity'] if values['net'] else None,
             'empirical_pnl_high_sensitivity':values['net']['high_sensitivity'] if values['net'] else None,
             'estimated_hold_pnl_usd':values['hold']['central'] if values['hold'] else None,
             'estimated_excess_vs_hold_usd':values['excess']['central'] if values['excess'] else None,
             'independent_usd_candle_scenario_pnl':exchange_scenarios.get(p['position'],{}).get('net_usd_pnl'),
             'independent_usd_candle_scenario_hold_pnl':exchange_scenarios.get(p['position'],{}).get('hold_usd_pnl'),
             'independent_usd_candle_scenario_excess':exchange_scenarios.get(p['position'],{}).get('excess_usd_pnl'),
             'empirical_excess_low_sensitivity':values['excess']['low_sensitivity'] if values['excess'] else None,
             'empirical_excess_high_sensitivity':values['excess']['high_sensitivity'] if values['excess'] else None,
             'one_pct_price_stress_pnl_low':None,'one_pct_price_stress_pnl_high':None,
             'chain_and_cost_reconciled':complete,'historical_usd_quality':'Approximate; no calibrated accuracy guarantee',
             'onchain_sol_quotes':sum(q.get('method')=='prior_swap_reference_times_historical_usdc_usd' for q in quotes.values()),
             'network_cost_lamports':str(sum(int(c['atomic']) for c in p['independent_verification']['costs'] if c['classification']=='observed_network_fee')),
             'external_native_payments_lamports':str(sum(int(c['atomic']) for c in p['independent_verification']['costs'] if c['classification']=='observed_external_native_transaction_payment')),
             'creation_solscan':f"https://solscan.io/tx/{p['creation_signature']}",'closure_solscan':f"https://solscan.io/tx/{p['closure_signature']}"}
        stress=value_coefficients(coefficients['net'],quotes,D('.01')) if available else None
        if stress:row.update(one_pct_price_stress_pnl_low=stress['low_sensitivity'],one_pct_price_stress_pnl_high=stress['high_sensitivity'])
        pnl_rows.append(row);results.append({'summary':row,'valuation':values,'quotes':[{'mint':k[0],'time':k[1],**q} for k,q in quotes.items()],
                                             'input_reconciliation_passed':complete,'policy':policy})
    write_csv('UPDATED_POSITION_USD_PNL.csv',pnl_rows);write_csv(ROOT/'valuation_quotes.csv',quote_rows)
    write_csv(ROOT/'source_agreement.csv',comparisons);write_csv(ROOT/'observation_distances.csv',distance_rows)
    # Complete observations (including rejected ones) are JSON; a flat view aids inspection.
    flat=[{k:v for k,v in o.items() if k not in {'matched_event','validation_issues','reference_rejections'}}|{'rejections':'|'.join(o['reference_rejections'])} for o in observations]
    write_csv(ROOT/'ONCHAIN_PRICE_OBSERVATIONS.csv',flat)
    capture=json.loads((ROOT/'capture_summary.json').read_text());diffs=[abs(D(c['difference_fraction'])) for c in comparisons]
    summary={'positions':len(results),'verified_usd_pnl':0,'estimated_usd_pnl':sum(r['status']=='approximate_historical_estimate' for r in pnl_rows),
             'unavailable':sum(r['status']=='unavailable' for r in pnl_rows),'blocks_available':sum(b['available'] for b in capture['blocks']),
             'block_errors':capture['errors'],'transactions_inspected':txcount,'swap_observations':len(observations),
             'exact_execution_observations':sum(o['evidence_tier']=='exact_execution_evidence' for o in observations),
             'eligible_reference_observations':sum(o['reference_eligible'] for o in observations),'observation_venues':dict(Counter(o['venue'] for o in observations)),
             'rejections':dict(Counter(v for o in observations for v in o['reference_rejections'])),
             'target_slot_times':len(targets),'targets_with_onchain_reference':sum(v['available'] for v in references.values()),
             'targets_with_two_venues':sum(v.get('venue_count',0)>=2 for v in references.values()),
             'unique_valuation_quotes':len({(q['mint'],q['target_time']) for q in quote_rows}),
             'valuation_quote_references':len(quote_rows),'unavailable_quote_references':sum(q['quality']=='unavailable' for q in quote_rows),
             'onchain_vs_hourly_comparisons':len(comparisons),'median_absolute_difference_bps':str(median(diffs)*10000) if diffs else None,
             'max_absolute_difference_bps':str(max(diffs)*10000) if diffs else None,
             'onchain_max_reference_age_seconds':max((v.get('max_age_seconds',0) for v in references.values()),default=0),
             'decoder_errors':len(errors),'external_service_spend_usd':0}
    summary['coinbase_completed_sol_usd_targets']=sum(r['quotes'][SOL]['available'] for r in exchange.get('rows',[]))
    summary['bitstamp_nonzero_usdc_usd_targets']=sum(r['quotes'][USDC]['available'] for r in exchange.get('rows',[]))
    summary['exchange_validation_errors']=len(exchange.get('errors',[]))
    atomic_json(ROOT/'usd_analysis.json',{'policy':policy,'summary':summary,'positions':results});atomic_json(ROOT/'summary.json',summary)
    manifest=[]
    for path in sorted(ROOT.rglob('*')):
        if path.is_file() and path.name!='evidence_manifest.json':manifest.append({'path':str(path),'sha256':hashlib.sha256(path.read_bytes()).hexdigest(),'bytes':path.stat().st_size})
    atomic_json(ROOT/'evidence_manifest.json',manifest)
    print(json.dumps(summary,indent=2));return summary

if __name__=='__main__':run()
