"""Frozen finalized block interval, retaining all unmatched and unknown events."""
import json
from pathlib import Path

from research.collector import atomic_json
from research.dlmm_schema import Codec, account_keys, decode_all
from research.rpc_discovery import PROGRAM, RPC


def scan(root=Path('data/phase3'),start=458874016,end=458874079):
    root=Path(root);plan_path=root/'scan_plan.json'
    plan={'start_slot':start,'end_slot':end,'commitment':'finalized','selection':'Fixed 64-slot interval anchored on phase-2 sample before decoding closures; full returned blocks, no current-account filter'}
    if plan_path.exists() and json.loads(plan_path.read_text())!=plan:raise ValueError('Frozen interval mismatch')
    atomic_json(plan_path,plan);rpc=RPC(root);codec=Codec();output={'plan':plan,'blocks':[],'events':[],'errors':[],'program_transactions':0,'all_transactions':0}
    try:
        slots=rpc.call('getBlocks',[start,end,{'commitment':'finalized'}]);output['produced_slots']=slots
        for slot in slots:
            print('block',slot,flush=True)
            try:
                block=rpc.call('getBlock',[slot,{'encoding':'json','transactionDetails':'full','rewards':False,'commitment':'finalized','maxSupportedTransactionVersion':1}])
                if block is None:raise ValueError('Null block')
                output['all_transactions']+=len(block['transactions'])
                for i,tx in enumerate(block['transactions']):
                    tx={**tx,'slot':slot,'blockTime':block['blockTime'],'transaction_index':i}
                    if PROGRAM not in account_keys(tx):continue
                    output['program_transactions']+=1
                    for event in decode_all(tx,codec):
                        event['transaction_index']=i;output['events'].append(event)
                output['blocks'].append({'slot':slot,'block_time':block['blockTime'],'transactions':len(block['transactions'])})
            except Exception as exc:output['errors'].append({'slot':slot,'error':str(exc)})
            atomic_json(root/'closed_scan.json',output)
    except Exception as exc:output['errors'].append({'error':str(exc)})
    finally:rpc.http.close()
    output['interval_complete']=not output['errors'] and len(output['blocks'])==len(output.get('produced_slots',[]))
    atomic_json(root/'closed_scan.json',output)
    closes=[e for e in output['events'] if e['event']=='PositionClose' and not e.get('decode_error')]
    print('closed positions',len({e['fields']['position'] for e in closes}),'blocks',len(output['blocks']),'errors',len(output['errors']))
    return output


if __name__=='__main__':
    import argparse
    parser=argparse.ArgumentParser();parser.add_argument('--output',type=Path,default=Path('data/phase3'));parser.add_argument('--start',type=int,default=458874016);parser.add_argument('--end',type=int,default=458874079)
    args=parser.parse_args();scan(args.output,args.start,args.end)
