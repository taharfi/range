"""Bounded address-index extension; no trade outcomes used in sample selection."""
import json
from pathlib import Path
from research.collector import atomic_json
from research.lifecycle import get_tx
from research.rpc_discovery import RPC

ROOT=Path('data/phase5')

def run():
    base=json.loads((ROOT/'capture_plan.json').read_text());targets={}
    for t in base['targets']:targets.setdefault(t['slot'],t)
    plan={'pools':['5rCf1DM8LjKTw4YqhnoLcngyZYeNnQqztScTogYHAS6','CYbD9RaToYMtWKA7QZyoLahnHdWq553Vm62Lh6qWtuxq','3ucNos4NbumPLZNWztqGHNFFgkHeRMBQAVemeeomsUxv'],
          'targets':list(targets.values()),'signature_page_limit':100,'successful_transactions_per_pool_target':3,
          'maximum_age_seconds':60,'selection':'Nearest successful strictly prior-slot signatures within 60 seconds; independent of size, price or LP returns.',
          'reason':'Address-index extension after four-slot sample showed insufficient multi-market coverage; thresholds unchanged.'}
    path=ROOT/'pool_history_plan.json'
    if path.exists() and json.loads(path.read_text())!=plan:raise ValueError('Frozen pool-history plan differs')
    atomic_json(path,plan);rpc=RPC(ROOT);rows=[];errors=[]
    try:
        for target in plan['targets']:
            for pool in plan['pools']:
                print('pool history',target['slot'],pool[:8],flush=True)
                try:
                    signatures=rpc.call('getSignaturesForAddress',[pool,{'before':target['signature'],'limit':100,'commitment':'finalized'}])
                    chosen=[s for s in signatures if s.get('err') is None and s['slot']<target['slot'] and s.get('blockTime') is not None and 0<=target['time']-s['blockTime']<=60][:3]
                    item={'target':target,'pool':pool,'page_count':len(signatures),'page_exhausted':len(signatures)<100,'chosen':chosen,'retrieved':[]}
                    for sig in chosen:
                        tx=get_tx(rpc,sig['signature']);item['retrieved'].append({'signature':sig['signature'],'available':tx is not None})
                    rows.append(item)
                except Exception as exc:errors.append({'target_slot':target['slot'],'pool':pool,'error':str(exc)})
                atomic_json(ROOT/'pool_history_summary.json',{'rows':rows,'errors':errors})
    finally:rpc.http.close()
    print('pool history done',len(rows),'errors',len(errors),flush=True)

if __name__=='__main__':run()
