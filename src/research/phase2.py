"""Reproducible purposive cohort, bounded history and descriptive research pipeline."""
import argparse
import csv
import hashlib
import json
import math
import statistics
from datetime import datetime, timezone
from pathlib import Path

import duckdb
import pyarrow as pa
import pyarrow.parquet as pq
from jsonschema import Draft202012Validator

from research.collector import Client, atomic_json
from research.rpc_discovery import address_valid

STABLE = {'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v','Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB'}
SOL = 'So11111111111111111111111111111111111111112'
STRATA = [
    ('high_tvl', {'sort_by':'tvl:desc'}),
    ('mid_tvl', {'sort_by':'tvl:desc','filter_by':'tvl>=10000 && tvl<100000'}),
    ('low_tvl', {'sort_by':'tvl:desc','filter_by':'tvl>=100 && tvl<1000'}),
    ('high_volume', {'sort_by':'volume_24h:desc'}),
    ('low_active_volume', {'sort_by':'volume_24h:asc','filter_by':'volume_24h>0 && tvl>=100'}),
    ('newest', {'sort_by':'pool_created_at:desc','filter_by':'tvl>=100'}),
    ('oldest', {'sort_by':'pool_created_at:asc','filter_by':'tvl>=100'}),
    ('small_bins', {'sort_by':'bin_step:asc','filter_by':'tvl>=100'}),
    ('large_bins', {'sort_by':'bin_step:desc','filter_by':'tvl>=100'}),
    ('stable_quote', {'sort_by':'volume_24h:desc','filter_by':f'token_y={next(iter(sorted(STABLE)))}'}),
    ('sol_quote', {'sort_by':'tvl:desc','filter_by':f'token_y={SOL}'}),
]


class Archive:
    def __init__(self, root, client=None):
        self.root=Path(root); self.api=client or Client(); self.spec=json.loads(Path('data/evidence/meteora-openapi.json').read_text())

    def get(self, route, path, params):
        key=hashlib.sha256(json.dumps([path,params],sort_keys=True).encode()).hexdigest()
        raw=self.root/'api'/f'{key}.json'; meta=raw.with_suffix('.meta.json')
        if raw.exists() and meta.exists() and json.loads(meta.read_text()).get('validated'):
            body=raw.read_bytes()
            if hashlib.sha256(body).hexdigest()!=json.loads(meta.read_text())['sha256']: raise ValueError('Cached raw hash mismatch')
        else:
            response=self.api.get(path,params); body=response.content
            raw.parent.mkdir(parents=True,exist_ok=True); raw.write_bytes(body)
            atomic_json(meta,{'url':str(response.url),'observed_at':datetime.now(timezone.utc).isoformat(),'sha256':hashlib.sha256(body).hexdigest(),'status':response.status_code,'validated':False})
        schema=self.spec['paths'][route]['get']['responses']['200']['content']['application/json']['schema']
        payload=json.loads(body)
        Draft202012Validator({**schema,'components':self.spec['components']}).validate(payload)
        metadata=json.loads(meta.read_text()); metadata['validated']=True
        metadata['schema_sha256']=hashlib.sha256(json.dumps(self.spec,sort_keys=True).encode()).hexdigest()
        atomic_json(meta,metadata)
        return payload,metadata


def category(p):
    mints={p['token_x']['address'],p['token_y']['address']}
    if len(mints & STABLE)==2: return 'two_allowlisted_stables'
    if mints & STABLE: return 'stable_paired'
    if SOL in mints: return 'SOL_paired'
    return 'other_unclassified'


def series_quality(rows, start, end, candles=False):
    times=[r['timestamp'] for r in rows]; issues=[]
    if len(times)!=len(set(times)): issues.append('duplicate_timestamps')
    if times!=sorted(times): issues.append('unsorted')
    if any(t<start or t>end for t in times): issues.append('outside_request_bounds')
    if any(int(datetime.fromisoformat(r['timestamp_str']).timestamp())!=r['timestamp'] for r in rows): issues.append('timestamp_string_mismatch')
    if candles and any(not (r['low']<=min(r['open'],r['close'])<=max(r['open'],r['close'])<=r['high']) for r in rows): issues.append('invalid_ohlc')
    for r in rows:
        if any(not math.isfinite(v) or v<0 for k,v in r.items() if k not in ['timestamp','timestamp_str'] and isinstance(v,(float,int))): issues.append('negative_or_nonfinite')
    expected=set(range(start,end,86400)); observed=set(times)
    prices=[r['close'] for r in rows if start<=r['timestamp']<end] if candles else []
    flat=bool(len(prices)>1 and len(set(prices))==1)
    if flat: issues.append('flat_close_series')
    return {'rows':len(rows),'complete_daily_rows':len(observed & expected),'expected_daily_rows':len(expected),'missing_daily_rows':len(expected-observed),'first':min(times) if times else None,'last':max(times) if times else None,'issues':sorted(set(issues))}


def ranks(values):
    sorted_values=sorted(set(values)); mapping={v:statistics.mean([i+1 for i,x in enumerate(sorted(values)) if x==v]) for v in sorted_values}
    return [mapping[x] for x in values]


def correlation(rows, x, y):
    pairs=[(r[x],r[y]) for r in rows if r[x] is not None and r[y] is not None and math.isfinite(r[x]) and math.isfinite(r[y])]
    if len(pairs)<3: return {'n':len(pairs),'spearman':None}
    a,b=zip(*pairs)
    return {'n':len(pairs),'spearman':statistics.correlation(ranks(a),ranks(b)) if len(set(a))>1 and len(set(b))>1 else None}


def run(root=Path('data/phase2'), history_pools=24, days=30):
    root=Path(root); root.mkdir(parents=True,exist_ok=True); archive=Archive(root)
    plan_path=root/'plan.json'
    if plan_path.exists(): plan=json.loads(plan_path.read_text())
    else:
        end=int(datetime.now(timezone.utc).timestamp())//86400*86400
        plan={'created_at':datetime.now(timezone.utc).isoformat(),'start':end-days*86400,'end':end,'days':days,'history_pools':history_pools,'strata':STRATA,'per_stratum':30,'selection':'Purposive extremes and bands, not random or population representative'}
        atomic_json(plan_path,plan)
    if plan['days']!=days or plan['history_pools']!=history_pools: raise ValueError('Use a new output directory to change frozen study plan')
    pools={}; members={}; errors=[]
    try:
        for label, query in plan['strata']:
            print('collect',label,flush=True)
            payload,meta=archive.get('/pools','/pools',{'page':1,'page_size':plan['per_stratum'],**query})
            for p in payload['data']:
                pools.setdefault(p['address'],(p,meta)); members.setdefault(p['address'],[]).append(label)
        atomic_json(root/'cohort.json',{'plan':plan,'pools':[{'pool':p,'metadata':m,'strata':members[a]} for a,(p,m) in pools.items()]})
        # Round robin across strata selects history cohort without looking at outcomes.
        selected=[]; ordered=[[a for a in pools if label in members[a]] for label,_ in plan['strata']]
        for i in range(plan['per_stratum']):
            for group in ordered:
                if i<len(group) and group[i] not in selected: selected.append(group[i])
                if len(selected)>=history_pools: break
            if len(selected)>=history_pools: break
        atomic_json(root/'history_cohort.json',selected)
        histories={}; coverage=[]
        for n,address in enumerate(selected):
            print('history',n+1,len(selected),address,flush=True); histories[address]={}
            for kind,suffix in [('ohlcv','ohlcv'),('volume','volume/history')]:
                route='/pools/{address}/'+suffix; params={'timeframe':'24h','start_time':plan['start'],'end_time':plan['end']}
                try:
                    payload,meta=archive.get(route,f'/pools/{address}/{suffix}',params)
                    histories[address][kind]=payload['data']
                    coverage.append({'address':address,'kind':kind,**series_quality(payload['data'],plan['start'],plan['end'],kind=='ohlcv')})
                except Exception as exc: errors.append({'address':address,'kind':kind,'error':str(exc)})
        atomic_json(root/'histories.json',histories); atomic_json(root/'coverage.json',coverage)
        history_records=[{'address':address,'kind':kind,**row} for address,kinds in histories.items() for kind,rows in kinds.items() for row in rows]
        if history_records:
            # Explicit union avoids losing fees columns when the first row is OHLCV.
            schema=pa.schema([('address',pa.string()),('kind',pa.string()),('timestamp',pa.int64()),('timestamp_str',pa.string()),('open',pa.float64()),('high',pa.float64()),('low',pa.float64()),('close',pa.float64()),('volume',pa.float64()),('fees',pa.float64()),('protocol_fees',pa.float64())])
            pq.write_table(pa.Table.from_pylist(history_records,schema=schema),root/'historical_series.parquet')
        records=[]; issues=[]
        for address,(p,meta) in pools.items():
            observed=datetime.fromisoformat(meta['observed_at']).timestamp(); created=p['created_at']/1000
            flags=[]
            if not all(address_valid(a) for a in [address,p['token_x']['address'],p['token_y']['address']]): flags.append('invalid_address')
            if not all(isinstance(p[t]['decimals'],int) and 0<=p[t]['decimals']<=255 for t in ['token_x','token_y']): flags.append('invalid_decimals')
            if not 1577836800<=created<=observed: flags.append('implausible_created_at_ms')
            for k in ['tvl','current_price']:
                if not math.isfinite(p[k]) or p[k]<0: flags.append('invalid_'+k)
            inventory=p['token_x_amount']*p['token_x']['price']+p['token_y_amount']*p['token_y']['price']
            inventory_error=abs(inventory-p['tvl'])/p['tvl'] if p['tvl']>0 else None
            if inventory_error is not None and inventory_error>.05: flags.append('inventory_valuation_diff_gt_5pct')
            price_ratio=p['token_x']['price']/p['token_y']['price'] if p['token_y']['price']>0 else None
            closes=[r['close'] for r in histories.get(address,{}).get('ohlcv',[]) if r['timestamp']<plan['end'] and r['close']>0]
            price_rows=[r for r in histories.get(address,{}).get('ohlcv',[]) if r['timestamp']<plan['end'] and r['close']>0]
            logs=[math.log(b['close']/a['close']) for a,b in zip(price_rows,price_rows[1:]) if b['timestamp']-a['timestamp']==86400]
            daily_vol=statistics.stdev(logs) if len(logs)>=2 else None
            if len(closes)>1 and len(set(closes))==1: flags.append('flat_historical_prices')
            records.append({'address':address,'name':p['name'],'observed_at':meta['observed_at'],'strata':'|'.join(members[address]),'category':category(p),'is_blacklisted':p['is_blacklisted'],'tvl_api':p['tvl'],'volume_24h_api':p['volume']['24h'],'fees_24h_api':p['fees']['24h'],'volume_tvl_24h':p['volume']['24h']/p['tvl'] if p['tvl']>0 else None,'fees_tvl_24h':p['fees']['24h']/p['tvl'] if p['tvl']>0 else None,'age_days_ms_interpretation':(observed-created)/86400 if 'implausible_created_at_ms' not in flags else None,'bin_step':p['pool_config']['bin_step'],'token_x_decimals':p['token_x']['decimals'],'token_y_decimals':p['token_y']['decimals'],'inventory_valuation_relative_error':inventory_error,'pair_price_vs_token_usd_ratio_relative_error':abs(p['current_price']-price_ratio)/price_ratio if price_ratio else None,'daily_log_return_std_api':daily_vol,'history_close_count':len(closes),'quality_flags':'|'.join(flags)})
            if flags: issues.append({'address':address,'flags':flags})
        with Path('POOL_STATISTICS.csv').open('w',newline='',encoding='utf-8') as f:
            writer=csv.DictWriter(f,fieldnames=list(records[0])); writer.writeheader(); writer.writerows(records)
        pq.write_table(pa.Table.from_pylist(records),root/'pool_statistics.parquet')
        db=duckdb.connect(str(root/'research.duckdb'))
        db.register('records',pa.Table.from_pylist(records)); db.execute('CREATE OR REPLACE TABLE pool_statistics AS SELECT * FROM records')
        if history_records:
            db.register('history_records',pa.Table.from_pylist(history_records,schema=schema)); db.execute('CREATE OR REPLACE TABLE historical_series AS SELECT * FROM history_records')
        tvls=sorted(r['tvl_api'] for r in records); total=sum(tvls)
        metrics={'pools':len(records),'tvl_min':min(tvls),'tvl_median':statistics.median(tvls),'tvl_max':max(tvls),'sample_tvl':total,'top_10_pool_tvl_share':sum(tvls[-10:])/total,'sample_pool_tvl_hhi':sum((v/total)**2 for v in tvls),'median_volume_tvl_24h':statistics.median(r['volume_tvl_24h'] for r in records if r['volume_tvl_24h'] is not None),'median_fees_tvl_24h':statistics.median(r['fees_tvl_24h'] for r in records if r['fees_tvl_24h'] is not None),'categories':{c:sum(r['category']==c for r in records) for c in sorted(set(r['category'] for r in records))},'bin_steps':sorted(set(r['bin_step'] for r in records)),'correlations':{f'{x}__{y}':correlation(records,x,y) for x,y in [('age_days_ms_interpretation','volume_24h_api'),('age_days_ms_interpretation','fees_24h_api'),('volume_24h_api','fees_24h_api'),('tvl_api','fees_24h_api')]},'quality_flagged_pools':len(issues),'history_pools':len(histories),'historical_rows':sum(c['rows'] for c in coverage),'coverage':coverage,'errors':errors}
        metrics['tvl_quantiles'] = dict(zip(['p10','p25','p75','p90'],db.execute('SELECT quantile_cont(tvl_api,[0.1,0.25,0.75,0.9]) FROM pool_statistics').fetchone()[0]))
        metrics['age_range_days']=[min(r['age_days_ms_interpretation'] for r in records if r['age_days_ms_interpretation'] is not None),max(r['age_days_ms_interpretation'] for r in records if r['age_days_ms_interpretation'] is not None)]
        metrics['positive_tvl_nonblacklisted_pools']=sum(r['tvl_api']>0 and not r['is_blacklisted'] for r in records)
        metrics['clean_subset_correlations']={f'{x}__{y}':correlation([r for r in records if r['tvl_api']>0 and not r['is_blacklisted']],x,y) for x,y in [('age_days_ms_interpretation','volume_24h_api'),('age_days_ms_interpretation','fees_24h_api')]}
        db.close(); atomic_json(root/'statistics_summary.json',metrics); atomic_json(root/'quality_issues.json',issues)
        print(json.dumps({k:v for k,v in metrics.items() if k not in ['coverage']},indent=2))
        return metrics
    finally: archive.api.http.close()


if __name__=='__main__':
    parser=argparse.ArgumentParser(); parser.add_argument('--output',type=Path,default=Path('data/phase2')); parser.add_argument('--history-pools',type=int,default=24); parser.add_argument('--days',type=int,default=30)
    args=parser.parse_args(); run(args.output,args.history_pools,args.days)
