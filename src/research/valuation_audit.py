"""Audit every original >5% discrepancy without rewriting reported TVL."""
import json
from decimal import Decimal, localcontext
from pathlib import Path

import httpx

from research.collector import atomic_json
from research.dlmm_schema import Codec
from research.finance import token_units
from research.phase2 import Archive
from research.rpc_discovery import RPC


def D(value):return Decimal(str(value))


def run(root=Path('data/phase3')):
    root=Path(root);root.mkdir(parents=True,exist_ok=True)
    original=json.loads(Path('data/phase2/cohort.json').read_text())['pools']
    selected=[]
    for item in original:
        p=item['pool'];value=sum(p[f'token_{s}_amount']*p[f'token_{s}']['price'] for s in ['x','y'])
        if p['tvl']>0 and abs(value-p['tvl'])/p['tvl']>.05:selected.append(item)
    archive=Archive(root);rpc=RPC(root/'valuation');codec=Codec();fresh={};meta_by_pool={};errors=[]
    try:
        addresses=[x['pool']['address'] for x in selected]
        for i in range(0,len(addresses),35):
            batch=addresses[i:i+35]
            payload,meta=archive.get('/pools','/pools',{'page':1,'page_size':100,'filter_by':'pool_address=['+'|'.join(batch)+']'})
            for p in payload['data']:fresh[p['address']]=p;meta_by_pool[p['address']]=meta
        # The documented OR-list filter returned empty pages for known pool addresses.
        # Retain those responses and fall back to the documented single-pool route.
        archive.api.interval=.3  # Official overview documents a 30-RPS API ceiling.
        for address in addresses:
            if address not in fresh:
                print('pool detail',len(fresh)+1,len(addresses),flush=True)
                try:
                    payload,meta=archive.get('/pools/{address}',f'/pools/{address}',{})
                    fresh[address]=payload;meta_by_pool[address]=meta
                except Exception as exc:errors.append({'address':address,'stage':'pool_detail','error':str(exc)})
        pool_accounts=rpc.call('getMultipleAccounts',[addresses,{'encoding':'base64','commitment':'finalized'}])
        pool_map=dict(zip(addresses,pool_accounts['value']));prefixes={}
        for address,account in pool_map.items():
            try:prefixes[address]=codec.pool_prefix(account)
            except Exception as exc:errors.append({'address':address,'error':str(exc)})
        reserves=sorted({v[k] for v in prefixes.values() for k in ['reserve_x','reserve_y']})
        mints=sorted({v[k] for v in prefixes.values() for k in ['token_x_mint','token_y_mint']})
        parsed={};contexts=[]
        for i in range(0,len(reserves+mints),100):
            batch=(reserves+mints)[i:i+100]
            result=rpc.call('getMultipleAccounts',[batch,{'encoding':'jsonParsed','commitment':'finalized'}])
            contexts.append(result['context']['slot']);parsed.update(zip(batch,result['value']))
        # Current independent price comparison only. Never used as historical correction.
        prices={};price_path=root/'jupiter_current_prices.json'
        if price_path.exists():prices=json.loads(price_path.read_text())
        else:
            client=httpx.Client(base_url='https://api.jup.ag',timeout=40)
            import time,hashlib
            try:
                for i in range(0,len(mints),50):
                    time.sleep(2.1)
                    response=client.get('/price/v3',params={'ids':','.join(mints[i:i+50])})
                    raw=root/f'jupiter_price_batch_{i//50}.json';raw.write_bytes(response.content)
                    atomic_json(raw.with_suffix('.meta.json'),{'url':str(response.url),'retrieved_at':time.time(),'status':response.status_code,'sha256':hashlib.sha256(response.content).hexdigest()})
                    response.raise_for_status();prices.update(response.json())
            except Exception as exc:errors.append({'source':'jupiter_current','error':str(exc)})
            finally:client.close()
            atomic_json(price_path,prices)
        rows=[]
        for item in selected:
            p=item['pool'];address=p['address'];f=fresh.get(address);prefix=prefixes.get(address)
            row={'address':address,'name':p['name'],'original_observed_at':item['metadata']['observed_at'],'reported_tvl_original':str(p['tvl']),'original_price_source':'Meteora /pools token_x.price and token_y.price; upstream provider not disclosed','price_source_timestamp':None,'reported_tvl_definition':'API total liquidity held; excludes/inclusions and pricing methodology not fully disclosed','correction_applied':False,'root_cause':'unresolved_price_or_accounting_definition','checks':{},'tokens':[]}
            original_value=sum(D(p[f'token_{s}_amount'])*D(p[f'token_{s}']['price']) for s in ['x','y'])
            row['original_inventory_value']=str(original_value);row['original_relative_difference']=str(abs(original_value-D(p['tvl']))/D(p['tvl']))
            missing=False
            for side in ['x','y']:
                token=p[f'token_{side}'];mint=token['address'];mint_data=parsed.get(mint);mint_info=(mint_data or {}).get('data',{})
                mint_info=mint_info.get('parsed',{}).get('info',{}) if isinstance(mint_info,dict) else {}
                decimals=mint_info.get('decimals');reserve=prefix.get(f'reserve_{side}') if prefix else None
                reserve_account=parsed.get(reserve);reserve_info=(reserve_account or {}).get('data',{})
                reserve_info=reserve_info.get('parsed',{}).get('info',{}) if isinstance(reserve_info,dict) else {}
                amount=reserve_info.get('tokenAmount',{}).get('amount')
                chain_units=token_units(amount,decimals) if amount is not None and decimals is not None else None
                source_price=D(token['price']);missing|=source_price<=0
                row['tokens'].append({'side':side,'mint':mint,'api_decimals':token['decimals'],'chain_decimals':decimals,'decimals_match':decimals==token['decimals'],'mint_matches_pool':bool(prefix and prefix[f'token_{side}_mint']==mint),'reserve_matches_api':reserve==p[f'reserve_{side}'],'reserve_mint_matches':reserve_info.get('mint')==mint,'chain_reserve_raw':amount,'chain_reserve_ui':str(chain_units) if chain_units is not None else None,'api_quantity_original_ui':str(p[f'token_{side}_amount']),'api_quantity_fresh_ui':str(f[f'token_{side}_amount']) if f else None,'api_price_original':str(source_price),'api_price_fresh':str(f[f'token_{side}']['price']) if f else None,'jupiter_current':prices.get(mint),'source_price_timestamp':None,'protocol_fee_atomic':str(prefix['protocol_fee'][f'amount_{side}']) if prefix else None})
                t=row['tokens'][-1]
                if chain_units is not None and prefix:
                    net_units=chain_units-token_units(t['protocol_fee_atomic'],decimals)
                    t['chain_reserve_less_protocol_fee_ui']=str(net_units)
                    if f:
                        t['net_quantity_matches_fresh_api_within_one_atomic_unit']=abs(net_units-D(t['api_quantity_fresh_ui']))<=Decimal(1)/(Decimal(10)**decimals)
            row['checks']['missing_source_price']=missing
            if missing:row['root_cause']='missing_or_nonpositive_source_price'
            if any(not t['decimals_match'] or not t['mint_matches_pool'] for t in row['tokens']):row['root_cause']='mint_or_decimal_mismatch'
            row['pool_account_slot']=pool_accounts['context']['slot'];row['reserve_mint_batch_slots']=contexts
            row['fresh_observed_at']=meta_by_pool.get(address,{}).get('observed_at')
            if f and prefix:
                gross=Decimal(0);net=Decimal(0);quantity_deltas=[]
                for t in row['tokens']:
                    if t['chain_reserve_ui'] is None:continue
                    units=D(t['chain_reserve_ui']);price=D(t['api_price_fresh']);gross+=units*price
                    net+=(units-token_units(t['protocol_fee_atomic'],t['chain_decimals']))*price
                    api_units=D(t['api_quantity_fresh_ui']);quantity_deltas.append(str(abs(units-api_units)/api_units) if api_units else None)
                row.update(fresh_tvl=str(f['tvl']),chain_gross_reserves_at_fresh_api_prices=str(gross),chain_reserves_less_protocol_fees_at_fresh_api_prices=str(net),fresh_quantity_relative_differences=quantity_deltas)
                row['checks']['accounting_note']='Gross custody reserves and reserves less protocol fees are diagnostics, not established API TVL corrections; token prices and reserve slots are not synchronized.'
            rows.append(row)
        atomic_json(root/'valuation_audit.json',{'outliers':rows,'errors':errors,'price_timestamp_available':False,'historical_state_available':False})
        print('audited',len(rows),'errors',errors)
        return rows
    finally:archive.api.http.close();rpc.http.close()


if __name__=='__main__':
    with localcontext() as ctx:ctx.prec=100;run()
