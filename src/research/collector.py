import argparse
import hashlib
import json
import logging
import random
import time
from datetime import datetime, timezone
from email.utils import parsedate_to_datetime
from pathlib import Path
from uuid import uuid4

import duckdb
import httpx
from jsonschema import Draft202012Validator

BASE = "https://dlmm.datapi.meteora.ag"
log = logging.getLogger(__name__)


def atomic_json(path, value):
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary = path.with_name(f'{path.name}.{uuid4().hex}.tmp')
    temporary.write_text(json.dumps(value, indent=2), encoding='utf-8')
    try:
        for attempt in range(8):
            try:
                temporary.replace(path)
                break
            except PermissionError:
                if attempt == 7: raise
                time.sleep(.025 * (attempt + 1))
    finally:
        temporary.unlink(missing_ok=True)


class Client:
    def __init__(self, client=None, interval=1.1, sleep=time.sleep):
        self.http = client or httpx.Client(base_url=BASE, timeout=45, headers={'User-Agent': 'Mozilla/5.0 research-collector/0.1'})
        self.interval, self.sleep, self.last = interval, sleep, 0.0

    def get(self, path, params=None):
        for attempt in range(5):
            self.sleep(max(0, self.interval - (time.monotonic() - self.last)))
            self.last = time.monotonic()
            try:
                response = self.http.get(path, params=params)
                if response.status_code == 429 or response.status_code >= 500:
                    response.raise_for_status()
                response.raise_for_status()
                return response
            except (httpx.TransportError, httpx.HTTPStatusError) as exc:
                if isinstance(exc, httpx.HTTPStatusError) and exc.response.status_code != 429 and exc.response.status_code < 500:
                    raise
                if attempt == 4:
                    raise
                delay = 2 ** attempt + random.random()
                if isinstance(exc, httpx.HTTPStatusError):
                    retry = exc.response.headers.get('Retry-After')
                    if retry:
                        try:
                            delay = float(retry)
                        except ValueError:
                            delay = max(0, (parsedate_to_datetime(retry) - datetime.now(timezone.utc)).total_seconds())
                log.warning(json.dumps({'event': 'retry', 'path': path, 'attempt': attempt + 1, 'delay': delay}))
                self.sleep(delay)


def validator(spec):
    schema = spec['paths']['/pools']['get']['responses']['200']['content']['application/json']['schema']
    return Draft202012Validator({**schema, 'components': spec['components']})


DDL = '''CREATE TABLE IF NOT EXISTS pool_snapshots (
run_id VARCHAR, address VARCHAR, observed_at VARCHAR, name VARCHAR,
token_x VARCHAR, token_y VARCHAR, bin_step INTEGER, created_at_raw BIGINT,
tvl DOUBLE, volume_24h DOUBLE, fees_24h DOUBLE, current_price DOUBLE,
raw_path VARCHAR, raw_sha256 VARCHAR, PRIMARY KEY(run_id,address));'''


def collect(root=Path('data'), pages=2, page_size=25, resume=None, client=None):
    if pages < 1 or not 1 <= page_size <= 1000:
        raise ValueError('pages >= 1; page_size must be 1..1000')
    root = Path(root)
    run_id = resume or str(uuid4())
    checkpoint = root / 'checkpoints' / f'{run_id}.json'
    state = json.loads(checkpoint.read_text()) if checkpoint.exists() else {'run_id': run_id, 'next_page': 1, 'page_size': page_size, 'sort_by': 'tvl:desc'}
    if state['page_size'] != page_size:
        raise ValueError('Resume requires original page_size')
    spec = json.loads((root / 'evidence/meteora-openapi.json').read_text())
    validate = validator(spec)
    api = client or Client()
    db = duckdb.connect(str(root / 'research.duckdb'))
    db.execute(DDL)
    try:
        for page in range(state['next_page'], pages + 1):
            params = {'page': page, 'page_size': page_size, 'sort_by': state['sort_by']}
            response = api.get('/pools', params)
            observed = datetime.now(timezone.utc).isoformat()
            body = response.content
            digest = hashlib.sha256(body).hexdigest()
            raw = root / 'raw' / run_id / f'{page}-{digest}.json'
            raw.parent.mkdir(parents=True, exist_ok=True)
            raw.write_bytes(body)
            atomic_json(raw.with_suffix('.meta.json'), {'url': str(response.url), 'status': response.status_code, 'observed_at': observed, 'sha256': digest, 'schema_sha256': hashlib.sha256(json.dumps(spec, sort_keys=True).encode()).hexdigest(), 'headers': dict(response.headers)})
            payload = response.json()
            validate.validate(payload)
            if payload['current_page'] != page:
                raise ValueError('API returned wrong page')
            rows = [(run_id, p['address'], observed, p['name'], p['token_x']['address'], p['token_y']['address'], p['pool_config']['bin_step'], p['created_at'], p['tvl'], p['volume']['24h'], p['fees']['24h'], p['current_price'], str(raw), digest) for p in payload['data']]
            db.execute('BEGIN')
            try:
                if rows:
                    db.executemany('INSERT OR IGNORE INTO pool_snapshots VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)', rows)
                db.execute('COMMIT')
            except Exception:
                db.execute('ROLLBACK')
                raise
            state.update(next_page=page + 1, api_total=payload['total'], api_pages=payload['pages'])
            atomic_json(checkpoint, state)
            log.info(json.dumps({'event': 'page_saved', 'run_id': run_id, 'page': page, 'rows': len(rows)}))
            if not payload['data'] or page >= payload['pages']:
                break
        records = db.execute('SELECT * FROM pool_snapshots WHERE run_id=? ORDER BY address', [run_id]).to_arrow_table()
        import pyarrow.parquet as pq
        pq.write_table(records, root / f'{run_id}.parquet')
        summary = db.execute('SELECT count(*),sum(tvl),sum(volume_24h),sum(fees_24h),min(observed_at),max(observed_at) FROM pool_snapshots WHERE run_id=?', [run_id]).fetchone()
        report = {'run_id': run_id, 'unique_pools': summary[0], 'sample_tvl_api_units': summary[1], 'sample_volume_24h_api_units': summary[2], 'sample_fees_24h_api_units': summary[3], 'first_observed_at': summary[4], 'last_observed_at': summary[5], 'checkpoint': state, 'selection': 'First pages ordered by TVL descending; biased convenience sample, no blacklist filter', 'limitations': ['API aggregates, not independently reconciled on-chain', 'Live offset pagination is not a consistent snapshot; duplicates deduplicated, omissions possible', 'Fees are not LP net profit', 'No wallet, position or historical return evidence collected', 'created_at preserved in source units; observed values appear milliseconds']}
        atomic_json(root / f'{run_id}-report.json', report)
        return report
    finally:
        db.close()
        if client is None:
            api.http.close()


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--pages', type=int, default=2, help='Final page number (also on resume)')
    parser.add_argument('--page-size', type=int, default=25)
    parser.add_argument('--data-dir', type=Path, default=Path('data'))
    parser.add_argument('--resume', help='Run UUID to resume')
    args = parser.parse_args()
    logging.basicConfig(level=logging.INFO, format='%(message)s')
    logging.getLogger('httpx').setLevel(logging.WARNING)
    print(json.dumps(collect(args.data_dir, args.pages, args.page_size, args.resume), indent=2))


if __name__ == '__main__':
    main()
