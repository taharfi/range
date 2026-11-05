"""Frozen, bounded, strictly prior-slot historical block sample. Read-only RPC."""
import json
from pathlib import Path
from research.collector import atomic_json
from research.rpc_discovery import RPC

ROOT=Path('data/phase5')

def run():
    positions=json.loads(Path('data/phase4/usd_analysis.json').read_text())['positions']
    targets={}
    for p in positions:
        needed={f['signature'] for f in p['flows']+p['independent_verification']['costs']}
        for t in p['independent_verification']['transactions']:
            if t['signature'] in needed:targets[t['signature']]={'signature':t['signature'],'slot':t['slot'],'time':t['block_time']}
    plan={'targets':sorted(targets.values(),key=lambda t:(t['slot'],t['signature'])),'prior_slot_offsets':[1,2,3,4],
          'reason':'Fixed four strictly prior slots per cash-flow/cost slot; bounded feasibility sample, not continuous coverage.',
          'future_observations_allowed':False}
    path=ROOT/'capture_plan.json'
    if path.exists() and json.loads(path.read_text())!=plan:raise ValueError('Frozen plan differs')
    atomic_json(path,plan);rpc=RPC(ROOT);blocks=[];errors=[]
    slots=sorted({t['slot']-d for t in targets.values() for d in plan['prior_slot_offsets']})
    try:
        for i,slot in enumerate(slots):
            print('historical block',i+1,'/',len(slots),slot,flush=True)
            try:
                block=rpc.call('getBlock',[slot,{'encoding':'json','transactionDetails':'full','rewards':False,'commitment':'finalized','maxSupportedTransactionVersion':1}])
                blocks.append({'slot':slot,'block_time':block.get('blockTime') if block else None,'available':block is not None,'transaction_count':len(block['transactions']) if block else 0})
            except Exception as exc:errors.append({'slot':slot,'error':str(exc)})
            atomic_json(ROOT/'capture_summary.json',{'blocks':blocks,'errors':errors,'requested_slots':len(slots)})
    finally:rpc.http.close()
    print('capture done',len(blocks),'errors',len(errors),flush=True)

if __name__=='__main__':run()
