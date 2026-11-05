"""Offline integration replay of actual collected evidence; no network calls."""
import hashlib
import json
from pathlib import Path

import duckdb
import pytest

from research.rpc_discovery import decode_events

ROOT=Path('data/phase2')
pytestmark=pytest.mark.skipif(not (ROOT/'account_discovery.json').exists(),reason='Run phase 2 collection first; real evidence unavailable')


def test_real_wallet_event_provenance():
    evidence=json.loads((ROOT/'account_discovery.json').read_text())
    idl=json.loads(Path('data/evidence/dlmm-idl.json').read_text())
    assert len(set(evidence['linked_wallets']))>=20
    for position in evidence['positions']:
        link=position['verified_link']
        if not link: continue
        found=False
        for version in (0,1):
            request={'jsonrpc':'2.0','id':1,'method':'getTransaction','params':[link['signature'],{'encoding':'json','maxSupportedTransactionVersion':version,'commitment':'finalized'}]}
            digest=hashlib.sha256(json.dumps(request,sort_keys=True).encode()).hexdigest()
            path=ROOT/'rpc'/f'{digest}.json'
            if not path.exists(): continue
            payload=json.loads(path.read_text())
            if not payload.get('result'): continue
            events=decode_events(payload['result'],idl)
            found=any(e.get('owner')==position['current_owner'] and e.get('position')==position['position'] for e in events)
            if found: break
        assert found, f"Missing finalized ownership event for {position['position']}"
        assert position['reconstruction']['realized_net_pnl_usd'] is None


def test_real_persistence_and_no_fabricated_tvl():
    with duckdb.connect(str(ROOT/'research.duckdb'),read_only=True) as db:
        assert db.execute('SELECT count(*), count(distinct address) FROM pool_statistics').fetchone()==(276,276)
        assert db.execute('SELECT count(*) FROM historical_series').fetchone()[0]==1170
        assert db.execute('SELECT count(*) FROM pool_statistics WHERE tvl_api=0 AND volume_tvl_24h IS NOT NULL').fetchone()[0]==0
    manifest=json.loads((ROOT/'audit_manifest.json').read_text())
    for row in manifest['api_responses']+manifest['rpc_responses']:
        assert hashlib.sha256(Path(row['path']).read_bytes()).hexdigest()==row['sha256']
