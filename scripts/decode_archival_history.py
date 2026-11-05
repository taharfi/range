"""Inspect a bounded Helius checkpoint with RANGE's existing pinned DLMM decoder.

This produces observations, never a completeness or profitability certification.
"""
import argparse
from collections import Counter
from hashlib import sha256
import json
from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'src'))
from research.dlmm_schema import Codec, decode_all


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('checkpoint', type=Path)
    parser.add_argument('output', type=Path)
    args = parser.parse_args()
    root = Path(__file__).resolve().parents[1]
    idl_file = root / 'data/evidence/dlmm-idl.json'
    checkpoint = json.loads(args.checkpoint.read_text(encoding='utf-8-sig'))
    codec = Codec(json.loads(idl_file.read_text()))
    events = [event for tx in checkpoint['transactions'] for event in decode_all(tx, codec)]
    target = checkpoint['scope']['address']
    boundaries = [e for e in events if e.get('fields', {}).get('position') == target
                  and e['event'] in ('PositionCreate', 'PositionClose') and 'decode_error' not in e]
    report = {
        'scope': checkpoint['scope'], 'transactions': len(checkpoint['transactions']),
        'query_exhausted': checkpoint['queryExhausted'], 'events': events,
        'event_counts': dict(Counter(e['event'] for e in events)),
        'decode_errors': sum('decode_error' in e for e in events),
        'observed_boundaries': boundaries,
        'idl_sha256': sha256(idl_file.read_bytes()).hexdigest(),
        'classification': 'Pinned-IDL event observations; not a reconciled lifecycle or P&L',
        'limitations': [
            'All decoded events retained, including other positions and unknown events.',
            'A query boundary is not proof of exhaustive lifetime history or no account reuse.',
            'Failed transactions and missing metadata remain in the checkpoint but produce no successful DLMM events.',
            'Transaction fees are not allocated between positions or wallet actions.',
            'RPC JSON numeric balance fields have not been certified lossless; use raw instruction/event integers for accounting.',
            'Historical USD prices and return-versus-hold are not calculated.'
        ]
    }
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(report, indent=2), encoding='utf-8')
    print(json.dumps({k: v for k, v in report.items() if k not in ('events', 'observed_boundaries', 'limitations')}, indent=2))


if __name__ == '__main__':
    main()
