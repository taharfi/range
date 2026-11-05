"""Independent on-chain account checks and API event reconciliation attempts."""
import json
from pathlib import Path

from research.collector import atomic_json
from research.finance import reconstruct
from research.phase2 import Archive
from research.rpc_discovery import PROGRAM, RPC


def validate_accounts(root):
    root=Path(root); cohort=json.loads((root/'cohort.json').read_text())['pools']
    mints={}
    for item in cohort:
        for side in ['token_x','token_y']:
            token=item['pool'][side]; mints.setdefault(token['address'],set()).add(token['decimals'])
    rpc=RPC(root); output={'pool_accounts':[],'mint_accounts':[],'errors':[]}
    try:
        for kind,addresses in [('pool_accounts',[i['pool']['address'] for i in cohort]),('mint_accounts',sorted(mints))]:
            for offset in range(0,len(addresses),100):
                batch=addresses[offset:offset+100]
                try:
                    result=rpc.call('getMultipleAccounts',[batch,{'encoding':'jsonParsed','commitment':'finalized'}])
                    for address,account in zip(batch,result['value']):
                        row={'address':address,'slot':result['context']['slot'],'exists':account is not None,'owner':account.get('owner') if account else None}
                        if kind=='pool_accounts': row['program_owner_matches']=bool(account and account['owner']==PROGRAM)
                        else:
                            data=account.get('data',{}) if account else {}
                            parsed=data.get('parsed',{}) if isinstance(data,dict) else {}
                            decimals=parsed.get('info',{}).get('decimals')
                            row.update(api_decimals=sorted(mints[address]),chain_decimals=decimals,matches=decimals is not None and mints[address]=={decimals},account_type=parsed.get('type'))
                        output[kind].append(row)
                except Exception as exc: output['errors'].append({'kind':kind,'offset':offset,'error':str(exc)})
    finally: rpc.http.close()
    atomic_json(root/'onchain_validation.json',output); return output


def position_attempt(root, limit=30):
    root=Path(root); discovery=json.loads((root/'wallet_discovery.json').read_text()); archive=Archive(root)
    positions=sorted({e['position'] for e in discovery['events'] if e.get('position')})[:limit]
    output=[]
    try:
        for position in positions:
            try:
                payload,meta=archive.get('/positions/{address}/historical',f'/positions/{position}/historical',{})
                # Endpoint history does not certify creation/closure, transfers or index completeness.
                result=reconstruct(payload['events'])
                links=[e for e in discovery['events'] if e.get('position')==position]
                output.append({'position':position,'api_event_count':len(payload['events']),'rpc_events':links,'api_matches_rpc_signature':sum(any(a['signature']==e['signature'] for a in payload['events']) for e in links),'result':result,'source':meta})
            except Exception as exc: output.append({'position':position,'error':str(exc)})
    finally: archive.api.http.close()
    atomic_json(root/'position_reconstruction.json',output); return output


if __name__=='__main__':
    import argparse
    p=argparse.ArgumentParser(); p.add_argument('--output',type=Path,default=Path('data/phase2')); p.add_argument('--positions',action='store_true')
    a=p.parse_args()
    result=position_attempt(a.output) if a.positions else validate_accounts(a.output)
    print(json.dumps(result,indent=2)[:3000])
