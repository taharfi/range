import json
from pathlib import Path

import duckdb
import httpx
import pytest
from jsonschema import ValidationError

from research.collector import Client, collect, validator

SPEC = json.loads(Path('data/evidence/meteora-openapi.json').read_text())
SAMPLE = json.loads(Path('data/evidence/pools-probe.json').read_text())


def test_official_schema_and_drift():
    validator(SPEC).validate(SAMPLE)
    broken = json.loads(json.dumps(SAMPLE))
    del broken['data'][0]['token_x']
    with pytest.raises(ValidationError):
        validator(SPEC).validate(broken)


def test_retry_and_permanent_failure():
    statuses = iter([429, 503, 200])
    delays = []
    api = Client(httpx.Client(base_url='https://test', transport=httpx.MockTransport(lambda r: httpx.Response(next(statuses), json={}, headers={'Retry-After': '0'}))), interval=0, sleep=delays.append)
    assert api.get('/pools').status_code == 200
    calls = []
    def forbidden(request):
        calls.append(request)
        return httpx.Response(403)
    api = Client(httpx.Client(base_url='https://test', transport=httpx.MockTransport(forbidden)), interval=0, sleep=lambda _: None)
    with pytest.raises(httpx.HTTPStatusError):
        api.get('/pools')
    assert len(calls) == 1


def test_ingestion_resume_dedup_and_raw(tmp_path):
    (tmp_path / 'evidence').mkdir()
    (tmp_path / 'evidence/meteora-openapi.json').write_text(json.dumps(SPEC))
    def respond(request):
        page = int(request.url.params['page'])
        return httpx.Response(200, json={**SAMPLE, 'current_page': page, 'pages': 2})
    api = Client(httpx.Client(base_url='https://test', transport=httpx.MockTransport(respond)), interval=0, sleep=lambda _: None)
    report = collect(tmp_path, 1, 5, client=api)
    resumed = collect(tmp_path, 2, 5, report['run_id'], api)
    assert resumed['unique_pools'] == 5
    assert resumed['checkpoint']['next_page'] == 3
    assert len(list((tmp_path / 'raw').rglob('*.meta.json'))) == 2
    assert (tmp_path / f"{report['run_id']}.parquet").exists()
    with duckdb.connect(str(tmp_path / 'research.duckdb')) as db:
        assert db.execute('select count(*) from pool_snapshots').fetchone()[0] == 5


def test_schema_failure_keeps_raw_without_checkpoint(tmp_path):
    (tmp_path / 'evidence').mkdir()
    (tmp_path / 'evidence/meteora-openapi.json').write_text(json.dumps(SPEC))
    api = Client(httpx.Client(base_url='https://test', transport=httpx.MockTransport(lambda r: httpx.Response(200, json={}))), interval=0, sleep=lambda _: None)
    with pytest.raises(ValidationError):
        collect(tmp_path, 1, 5, client=api)
    assert list((tmp_path / 'raw').rglob('*.json'))
    assert not list((tmp_path / 'checkpoints').glob('*.json'))
