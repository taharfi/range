"""Independent, free historical USD candle cross-check; no execution claims."""
import json
from datetime import datetime,timezone
from decimal import Decimal as D
from pathlib import Path
from research.collector import atomic_json
from research.historical_prices import HTTPArchive,SOL,USDC,select_asof

ROOT=Path('data/phase5')

def candle_quote(candles,target,maximum_age):
    """The bar must have completed. Zero-volume carry-forwards never qualify.

    Timestamp is the earliest possible last-trade time (bar start), not an
    invented exact execution time. The true last trade lies within the bar.
    """
    completed=[c for c in candles if c['start']+60<=target and 0<=target-c['start']<=maximum_age and D(c['volume'])*D(c['close'])>=100]
    if not completed:return {'available':False,'quality':'unavailable','reason':'no_completed_bar_with_100usd_volume_in_window'}
    c=max(completed,key=lambda c:c['start'])
    return {'available':True,'quality':'approximate_historical_estimate','price':c['close'],
            'earliest_possible_trade_timestamp':c['start'],'bar_completed_at':c['start']+60,
            'last_trade_age_upper_bound_seconds':target-c['start'],'actual_last_trade_timestamp':None,
            'intrabar_range_fraction':str((D(c['high'])-D(c['low']))/D(c['close'])),
            'source':c['source'],'source_url':c['source_url'],'response_sha256':c['response_sha256'],
            'base_volume':c['volume'],'note':'Completed historical USD bar; exact last-trade time and execution proceeds unknown.'}

def run():
    targets=sorted({t['time'] for t in json.loads((ROOT/'capture_plan.json').read_text())['targets']})
    plan={'targets':targets,'coinbase_product':'SOL-USD','bitstamp_market':'usdcusd','bar_seconds':60,
          'minimum_bar_usd_volume':100,'sol_maximum_possible_trade_age_seconds':120,'usdc_maximum_possible_trade_age_seconds':3600,
          'role':'Additional independent validation only. Does not change frozen primary valuation selection or upgrade quality.',
          'reason':'New permitted free historical USD endpoints found; require completed bars and reject zero-volume carry-forward.'}
    path=ROOT/'exchange_validation_plan.json'
    if path.exists() and json.loads(path.read_text())!=plan:raise ValueError('Exchange validation plan differs')
    atomic_json(path,plan);archive=HTTPArchive(ROOT/'exchange');rows=[];errors=[]
    prior=json.loads(Path('data/phase4/usd_analysis.json').read_text())['positions'];series={SOL:[],USDC:[]}
    for p in prior:
        for mint in series:series[mint]+=p['price_series'].get(mint,[])
    series={m:list({(p['timestamp'],p['price']):p for p in v}.values()) for m,v in series.items()}
    try:
        for target in targets:
            end=target//60*60;quotes={};candles={}
            for mint in [SOL,USDC]:
                print('exchange validation',target,'SOL' if mint==SOL else 'USDC',flush=True)
                try:
                    if mint==SOL:
                        iso=lambda t:datetime.fromtimestamp(t,timezone.utc).isoformat()
                        body,meta=archive.get('https://api.exchange.coinbase.com/products/SOL-USD/candles',{'start':iso(end-3600),'end':iso(end),'granularity':60})
                        candles[mint]=[{'start':int(c[0]),'low':str(c[1]),'high':str(c[2]),'open':str(c[3]),'close':str(c[4]),'volume':str(c[5]),'source':'Coinbase Exchange SOL-USD','source_url':meta['url'],'response_sha256':meta['sha256']} for c in body]
                    else:
                        body,meta=archive.get('https://www.bitstamp.net/api/v2/ohlc/usdcusd/',{'step':60,'limit':61,'end':end,'exclude_current_candle':'true'})
                        if body['data']['pair']!='USDC/USD':raise ValueError('Unexpected USD market identity')
                        candles[mint]=[{'start':int(c['timestamp']),'low':str(c['low']),'high':str(c['high']),'open':str(c['open']),'close':str(c['close']),'volume':str(c['volume']),'source':'Bitstamp USDC/USD','source_url':meta['url'],'response_sha256':meta['sha256']} for c in body['data']['ohlc']]
                    quotes[mint]=candle_quote(candles[mint],target,120 if mint==SOL else 3600)
                except Exception as exc:errors.append({'time':target,'mint':mint,'error':str(exc)});quotes[mint]={'available':False,'quality':'unavailable','reason':str(exc)}
            cg=select_asof(series[SOL],target,3600)
            diff=str(D(quotes[SOL]['price'])/D(cg['price'])-1) if quotes[SOL]['available'] and cg['usable'] else None
            rows.append({'target_time':target,'quotes':quotes,'coinbase_vs_hourly_sol_fraction':diff,
                         'zero_volume_usdc_bars_rejected':sum(D(c['volume'])==0 for c in candles.get(USDC,[]) if c['start']+60<=target),
                         'thin_nonzero_usdc_bars':sum(0<D(c['volume'])*D(c['close'])<100 for c in candles.get(USDC,[]) if c['start']+60<=target)})
            atomic_json(ROOT/'exchange_validation.json',{'plan':plan,'rows':rows,'errors':errors})
    finally:archive.http.close()
    # A second, predeclared source-selection scenario measures sensitivity to
    # the independently recovered USD data. It never overwrites primary marks.
    from research.phase5 import cash_coefficients,value_coefficients,write_csv
    by_time={r['target_time']:r for r in rows};scenarios=[]
    for p in prior:
        coefficients=cash_coefficients(p['flows'],p['independent_verification']['costs'],p['closure_time']);quotes={}
        for mint,time in set().union(*(v.keys() for v in coefficients.values())):
            bar=by_time[time]['quotes'][mint]
            if bar['available']:q={'available':True,'price':bar['price'],'source':bar['source'],'evidence':bar}
            else:
                cg=select_asof(series[mint],time,3600)
                q={'available':cg['usable'],'price':cg.get('price'),'source':'CoinGecko hourly fallback','evidence':cg}
            if q['available']:
                price=D(q['price']);q.update(price_low_sensitivity=str(price*D('.99')),price_high_sensitivity=str(price*D('1.01')))
            quotes[(mint,time)]=q
        values={name:value_coefficients(c,quotes) for name,c in coefficients.items()}
        complete=p['chain_history_complete'] and p['independent_verification']['complete'] and all(v is not None for v in values.values())
        scenarios.append({'position':p['position'],'quality':'approximate_historical_estimate' if complete else 'unavailable',
                          'net_usd_pnl':values['net']['central'] if complete else None,'hold_usd_pnl':values['hold']['central'] if complete else None,
                          'excess_usd_pnl':values['excess']['central'] if complete else None,'one_pct_stress':values['net'],
                          'quotes':[{'mint':k[0],'time':k[1],**v} for k,v in quotes.items()]})
    atomic_json(ROOT/'exchange_validation.json',{'plan':plan,'rows':rows,'errors':errors,'position_scenarios':scenarios})
    write_csv(ROOT/'INDEPENDENT_USD_CROSSCHECK.csv',[{k:v for k,v in p.items() if k not in {'quotes','one_pct_stress'}} for p in scenarios])
    print('exchange validation done',len(rows),'errors',len(errors))

if __name__=='__main__':run()
