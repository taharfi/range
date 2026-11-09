"""Operator-only offline reconciliation; writes a compact private cache for RANGE."""
import argparse
import hashlib
import json
from pathlib import Path
import sys
sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'src'))
from research.archival_reconciliation import reconcile
from research.dlmm_schema import Codec

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('checkpoint', type=Path)
parser.add_argument('verification', type=Path)
parser.add_argument('--output', required=True, type=Path)
args = parser.parse_args()
result = reconcile(json.loads(args.checkpoint.read_text(encoding='utf-8-sig')), json.loads(args.verification.read_text(encoding='utf-8-sig')), Codec())
args.output.mkdir(parents=True, exist_ok=True)
filename = hashlib.sha256(result['position'].encode()).hexdigest() + '.json'
path = args.output / filename
temporary = path.with_suffix('.tmp')
temporary.write_text(json.dumps(result, indent=2), encoding='utf-8')
temporary.replace(path)
if result['owner']:
    manifest = args.output / ('wallet-' + hashlib.sha256(result['owner'].encode()).hexdigest() + '.json')
    previous = json.loads(manifest.read_text()) if manifest.exists() else {'owner': result['owner'], 'positions': []}
    if previous['owner'] != result['owner']:
        raise ValueError('Wallet evidence manifest mismatch')
    positions = sorted(set(previous['positions'] + [result['position']]))
    if len(positions) > 5:
        raise ValueError('Five-position pilot evidence budget reached; manifest not advanced')
    temp = manifest.with_suffix('.tmp')
    temp.write_text(json.dumps({'owner': result['owner'], 'positions': positions}), encoding='utf-8')
    temp.replace(manifest)
print(json.dumps({k: result[k] for k in ('position', 'quality', 'closureConfirmed', 'signatureSetMatched', 'transactionCount', 'aliasPairsSuppressed', 'totals', 'observedTransactionFeesLamports', 'issues')}, indent=2))
