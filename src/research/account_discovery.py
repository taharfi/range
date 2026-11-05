"""Current PositionV2 owner discovery; explicitly survivorship-biased."""
import base64
import json
from pathlib import Path

from research.collector import atomic_json
from research.finance import reconstruct
from research.phase2 import Archive
from research.rpc_discovery import PROGRAM, RPC, b58encode, decode_events


def run(root=Path('data/phase2'), target=20):
    root=Path(root); idl=json.loads(Path('data/evidence/dlmm-idl.json').read_text())
    account=next(a for a in idl['accounts'] if a['name']=='PositionV2')
    fields=next(t for t in idl['types'] if t['name']=='PositionV2')['type']['fields']
    assert [(f['name'],f['type']) for f in fields[:2]]==[('lb_pair','pubkey'),('owner','pubkey')]
    disc=bytes(account['discriminator']); rpc=RPC(root); archive=Archive(root)
    cohort=json.loads((root/'cohort.json').read_text())['pools']
    pools=[x['pool']['address'] for x in cohort if 'high_tvl' in x['strata']][:5]
    output={'method':'filtered current PositionV2 scan + API historical events + RPC spot verification','historical_cohort_complete':False,'accounts':[],'linked_wallets':[],'positions':[],'errors':[]}
    owners=set(); candidates={}
    try:
        for pool in pools:
            try:
                response=rpc.call('getProgramAccounts',[PROGRAM,{'encoding':'base64','commitment':'finalized','withContext':True,'dataSlice':{'offset':0,'length':72},'filters':[{'memcmp':{'offset':0,'bytes':b58encode(disc)}},{'memcmp':{'offset':8,'bytes':pool}}]}])
                for row in sorted(response['value'],key=lambda x:x['pubkey']):
                    data=base64.b64decode(row['account']['data'][0])
                    if len(data)!=72 or data[:8]!=disc or b58encode(data[8:40])!=pool or row['account']['owner']!=PROGRAM: raise ValueError('Invalid position prefix')
                    owner=b58encode(data[40:72]); record={'position':row['pubkey'],'current_owner':owner,'pool':pool,'slot':response['context']['slot']}
                    output['accounts'].append(record); candidates.setdefault(owner,record)
                if len(candidates)>=40: break
            except Exception as exc: output['errors'].append({'pool':pool,'error':str(exc)})
        atomic_json(root/'account_discovery.json',output)
        for owner,record in sorted(candidates.items()):
            if len(owners)>=target: break
            print('link wallet',len(owners)+1,owner,flush=True)
            try:
                payload,meta=archive.get('/positions/{address}/historical',f"/positions/{record['position']}/historical",{})
                matching=[e for e in payload['events'] if e['userAddress']==owner and e['positionAddress']==record['position'] and e['poolAddress']==record['pool']]
                # Prefer explicit ownership events rather than relying on an add sender.
                matching.sort(key=lambda e:(e['eventType']!='claim_fee',e['slot'],e['ixIndex']))
                verified=None
                for e in matching[:2]:
                    config={'encoding':'json','maxSupportedTransactionVersion':0,'commitment':'finalized'}
                    try: tx=rpc.call('getTransaction',[e['signature'],config])
                    except RuntimeError as exc:
                        if '-32015' not in str(exc) or 'version (1)' not in str(exc): raise
                        config['maxSupportedTransactionVersion']=1;tx=rpc.call('getTransaction',[e['signature'],config])
                    decoded=decode_events(tx,idl)
                    matches=[d for d in decoded if d.get('position')==record['position'] and d.get('owner')==owner]
                    if matches:
                        verified={'api_event':e,'decoded_owner_events':matches,'signature':e['signature'],'explorer':f"https://explorer.solana.com/tx/{e['signature']}"}; break
                if verified:
                    owners.add(owner); output['linked_wallets'].append(owner)
                creation_verified=bool(verified and any(e['event']=='PositionCreate' for e in verified['decoded_owner_events']))
                output['positions'].append({**record,'api_events':len(payload['events']),'owner_matched_api_events':len(matching),'verified_link':verified,'reconstruction':reconstruct(payload['events'],creation_verified=creation_verified)})
            except Exception as exc: output['errors'].append({**record,'error':str(exc)})
            atomic_json(root/'account_discovery.json',output)
    finally: rpc.http.close(); archive.api.http.close()
    atomic_json(root/'account_discovery.json',output)
    print('linked wallets',len(owners),'positions attempted',len(output['positions']),'errors',len(output['errors']))
    return output


if __name__=='__main__':
    import argparse
    parser=argparse.ArgumentParser();parser.add_argument('--output',type=Path,default=Path('data/phase2'));args=parser.parse_args();run(args.output)
