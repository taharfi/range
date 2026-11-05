"""Price/outcome-blind SOL/USDC closed-position enrollment from known pool owners."""
import base64
import json
import time
from pathlib import Path

from research.collector import atomic_json
from research.dlmm_schema import Codec, decode_all
from research.lifecycle import get_tx
from research.phase2 import Archive
from research.rpc_discovery import PROGRAM, RPC, b58encode

SOL='So11111111111111111111111111111111111111112'
USDC='EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'


def run(root=Path('data/phase4'),target=6):
    root=Path(root);root.mkdir(parents=True,exist_ok=True);codec=Codec();rpc=RPC(root/'discovery');api=Archive(root);api.api.interval=.4
    plan_path=root/'recent_cohort_plan.json'
    if plan_path.exists():plan=json.loads(plan_path.read_text())
    else:
        plan={'cutoff':int(time.time())-30*86400,'target':target,'owner_limit':30,'selection':'Highest phase-2 TVL SOL/USDC pool; first 30 sorted current owners; first six closures in past 30 days, API order; no P&L/price filtering. Current-owner survivorship bias applies.'}
        atomic_json(plan_path,plan)
    result={'selection':plan['selection'],'cutoff':plan['cutoff'],'candidates':[],'verified_closures':[],'errors':[]}
    pools=[x['pool'] for x in json.loads(Path('data/phase2/cohort.json').read_text())['pools'] if {x['pool']['token_x']['address'],x['pool']['token_y']['address']}=={SOL,USDC}]
    pool=max(pools,key=lambda x:x['tvl'])['address'];result['pool']=pool
    disc=bytes(next(a['discriminator'] for a in codec.idl['accounts'] if a['name']=='PositionV2'))
    try:
        response=rpc.call('getProgramAccounts',[PROGRAM,{'encoding':'base64','commitment':'finalized','withContext':True,'dataSlice':{'offset':0,'length':72},'filters':[{'memcmp':{'offset':0,'bytes':b58encode(disc)}},{'memcmp':{'offset':8,'bytes':pool}}]}])
        owners=sorted({b58encode(base64.b64decode(row['account']['data'][0])[40:72]) for row in response['value']})[:30]
        result['owners']=owners;atomic_json(root/'cohort_plan.json',{k:v for k,v in result.items() if k not in ['candidates','verified_closures','errors']})
        for owner in owners:
            print('candidate owner',owner,flush=True)
            payload,meta=api.get('/positions/{pool_address}/pnl',f'/positions/{pool}/pnl',{'user':owner,'status':'closed','page':1,'page_size':100})
            for candidate in payload['positions']:
                if not candidate['isClosed']:continue
                if not candidate.get('closedAt') or candidate['closedAt']<plan['cutoff']:continue
                position=candidate['positionAddress']
                if any(c['position']==position for c in result['candidates']):continue
                entry={'position':position,'owner':owner,'pool':pool,'api_created_at':candidate.get('createdAt'),'api_closed_at':candidate.get('closedAt')};result['candidates'].append(entry)
                try:
                    signatures=rpc.call('getSignaturesForAddress',[position,{'limit':100,'commitment':'finalized'}])
                    for sig in signatures:
                        if sig['err'] is not None:continue
                        tx=get_tx(rpc,sig['signature']);events=decode_all(tx,codec)
                        closes=[e for e in events if e['event']=='PositionClose' and e.get('fields',{}).get('position')==position]
                        if closes:
                            close=closes[0];result['verified_closures'].append(close);break
                except Exception as exc:result['errors'].append({'position':position,'error':str(exc)})
                atomic_json(root/'solusdc_discovery.json',result)
                if len(result['verified_closures'])>=target:break
            if len(result['verified_closures'])>=target:break
    except Exception as exc:result['errors'].append({'error':str(exc)})
    finally:rpc.http.close();api.api.http.close()
    atomic_json(root/'solusdc_discovery.json',result)
    atomic_json(root/'closed_scan.json',{'events':result['verified_closures'],'cohort_method':result['selection']})
    print('SOL/USDC closures verified',len(result['verified_closures']),'errors',result['errors'])
    return result


if __name__=='__main__':run()
