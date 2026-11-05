"""Historical-only USD price adapters with explicit freshness/provenance gates."""
import hashlib
import json
import os
import time
from bisect import bisect_right
from decimal import Decimal
from pathlib import Path

import httpx

from research.collector import atomic_json

SOL='So11111111111111111111111111111111111111112'
USDC='EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'
COINS={SOL:'solana',USDC:'usd-coin'}
SYMBOLS={SOL:'Crypto.SOL/USD',USDC:'Crypto.USDC/USD'}


class HTTPArchive:
    def __init__(self,root):
        self.root=Path(root);self.http=httpx.Client(timeout=45,follow_redirects=True);self.last={}

    def get(self,url,params=None,headers=None,interval=2.1):
        key=hashlib.sha256(json.dumps([url,params],sort_keys=True).encode()).hexdigest();raw=self.root/'prices_raw'/f'{key}.json';meta=raw.with_suffix('.meta.json')
        if raw.exists() and meta.exists():
            metadata=json.loads(meta.read_text());body=raw.read_bytes()
            if hashlib.sha256(body).hexdigest()!=metadata['sha256']:raise ValueError('Price response hash mismatch')
            if metadata['status']==200:return json.loads(body,parse_float=Decimal),metadata
            has_auth=any(k.lower() in {'authorization','x-cg-demo-api-key'} for k in (headers or {}))
            retryable=metadata['status']==429 or metadata['status']>=500
            if not retryable and not (metadata['status'] in (401,403) and has_auth):
                raise ValueError(f"Archived HTTP {metadata['status']} from {metadata['url']}")
        host=httpx.URL(url).host
        for attempt in range(3):
            time.sleep(max(0,interval-(time.monotonic()-self.last.get(host,0))));self.last[host]=time.monotonic()
            response=self.http.get(url,params=params,headers=headers)
            raw.parent.mkdir(parents=True,exist_ok=True);raw.write_bytes(response.content)
            metadata={'url':str(response.url),'status':response.status_code,'retrieved_at':time.time(),'sha256':hashlib.sha256(response.content).hexdigest()}
            # Authentication headers are deliberately never archived.
            atomic_json(meta,metadata)
            if response.status_code==429 or response.status_code>=500:
                if attempt<2:
                    time.sleep(max(float(response.headers.get('Retry-After','5')),5));continue
            response.raise_for_status();return json.loads(response.content,parse_float=Decimal),metadata


def select_asof(points,event_time,max_age=60):
    """Never interpolate, select a future sample, or substitute a current price."""
    ordered=sorted(points,key=lambda p:p['timestamp']);times=[p['timestamp'] for p in ordered]
    idx=bisect_right(times,event_time)-1
    if idx<0:return {'event_time':event_time,'price':None,'timestamp':None,'source':None,'quality':'missing_no_nonfuture_observation','usable':False}
    result=dict(ordered[idx]);value=Decimal(str(result['price']));age=event_time-result['timestamp']
    result.update(event_time=event_time,age_seconds=age,usable=False)
    if len({str(p['price']) for p in ordered if p['timestamp']==result['timestamp']})>1:result['quality']='conflicting_source_prices'
    elif not value.is_finite() or value<=0:result['quality']='invalid_price'
    elif age>max_age:result['quality']='stale_for_policy'
    else:result.update(quality='historical_aggregate_within_freshness_policy' if result.get('aggregation') else 'historical_oracle_within_freshness_policy',usable=True)
    return result


class CoinGeckoHistorical:
    def __init__(self,archive):self.archive=archive

    def fetch(self,mint,start,end):
        if mint not in COINS:raise ValueError('No independently mapped CoinGecko ID for mint')
        headers={}
        if os.environ.get('COINGECKO_DEMO_API_KEY'):headers['x-cg-demo-api-key']=os.environ['COINGECKO_DEMO_API_KEY']
        payload,meta=self.archive.get(f'https://api.coingecko.com/api/v3/coins/{COINS[mint]}/market_chart/range',{'vs_currency':'usd','from':start,'to':end},headers,interval=12.1)
        if not isinstance(payload.get('prices'),list):raise ValueError('Invalid CoinGecko response')
        points=[];seen={}
        for row in payload['prices']:
            if not isinstance(row,list) or len(row)!=2:raise ValueError('Invalid price row')
            timestamp_ms,price=row;timestamp=Decimal(str(timestamp_ms))/1000
            if timestamp_ms<10**11:raise ValueError('CoinGecko millisecond timestamp expected')
            if timestamp in seen and seen[timestamp]!=str(price):raise ValueError('Conflicting price timestamp')
            seen[timestamp]=str(price)
            points.append({'mint':mint,'price':str(price),'timestamp':float(timestamp),'source':'CoinGecko historical market_chart/range','source_url':meta['url'],'response_sha256':meta['sha256'],'quote':'USD','aggregation':True,'quality':'historical_aggregate_unassessed','retrieved_at':meta['retrieved_at']})
        return points


class PythHistorical:
    def __init__(self,archive):self.archive=archive

    def fetch(self,mint,event_time):
        if mint not in SYMBOLS:raise ValueError('No verified Pyth symbol mapping')
        symbols,_=self.archive.get('https://pyth.dourolabs.app/v1/symbols',{'query':SYMBOLS[mint]})
        matches=[s for s in symbols if s['symbol']==SYMBOLS[mint] and s.get('quote_currency')=='USD' and s.get('instrument_type')=='spot']
        if len(matches)!=1:raise ValueError('Pyth symbol identity ambiguous or unavailable')
        headers={}
        if os.environ.get('PYTH_API_KEY'):headers['Authorization']='Bearer '+os.environ['PYTH_API_KEY']
        # Request a bounded past-only range; the API returns microsecond timestamps.
        payload,meta=self.archive.get('https://pyth.dourolabs.app/v1/real_time/price/range',{'ids':str(matches[0]['pyth_lazer_id']),'start_timestamp':(event_time-60)*1000000,'end_timestamp':event_time*1000000,'limit':1000},headers)
        points=[]
        for row in payload['data']:
            if row['price_feed_id']!=matches[0]['pyth_lazer_id']:raise ValueError('Wrong Pyth feed')
            ts=row['feed_update_timestamp']/1000000
            points.append({'mint':mint,'price':str(Decimal(str(row['price']))*Decimal(10)**row['exponent']),'timestamp':ts,'source':'Pyth Pro historical range','source_url':meta['url'],'response_sha256':meta['sha256'],'quote':'USD','aggregation':False,'quality':'historical_oracle_unassessed','retrieved_at':meta['retrieved_at']})
        if payload.get('next'):raise ValueError('Pyth range truncated; pagination required before verification')
        return points
