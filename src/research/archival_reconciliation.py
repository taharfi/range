"""Reconcile a bounded, independently enumerated DLMM account history in token units."""
from collections import Counter
from decimal import Decimal, localcontext
import hashlib
import json

from research.dlmm_schema import Codec, account_keys, decode_all
from research.lifecycle import canonical_events, transfers
from research.phase4 import ledger


def reconcile(checkpoint, verification, codec=None):
    codec = codec or Codec()
    position = checkpoint['scope']['address']
    issues = []
    if verification.get('position') != position:
        raise ValueError('Verification position mismatch')
    metadata = verification['metadata']
    pool = verification['pool']
    if metadata['address'] != pool:
        raise ValueError('Pool metadata identity mismatch')
    prefix = codec.pool_prefix(verification['poolAccount']['value'])
    for side in ('x', 'y'):
        if prefix[f'token_{side}_mint'] != metadata[f'token_{side}']['address'] or prefix[f'reserve_{side}'] != metadata[f'reserve_{side}']:
            raise ValueError('Pool mint/reserve mapping mismatch')
    txs = {}
    for tx in checkpoint['transactions']:
        signature = tx['transaction']['signatures'][0]
        if signature in txs and txs[signature] != tx:
            raise ValueError('Conflicting transaction identity')
        txs[signature] = tx
    signatures = verification['signatures']
    independent = {s['signature'] for s in signatures}
    signature_match = (len(signatures) < 100 and len(independent) == len(signatures) and independent == set(txs)
                       and all(s['slot'] == txs[s['signature']]['slot'] and s.get('err') == (txs[s['signature']].get('meta') or {}).get('err')
                               and s.get('blockTime') == txs[s['signature']].get('blockTime') and s.get('confirmationStatus') == 'finalized' for s in signatures))
    if not signature_match or not checkpoint['queryExhausted']:
        issues.append('position_signature_coverage_incomplete')
    raw_events = []
    unmatched = []
    for signature, tx in txs.items():
        if not tx.get('meta') or tx['meta'].get('err') is not None:
            issues.append('failed_or_missing_transaction_metadata')
            continue
        if tx.get('blockTime') is None or not checkpoint['scope']['from'] <= tx['blockTime'] < checkpoint['scope']['until']:
            issues.append('invalid_transaction_timestamp')
        decoded = decode_all(tx, codec)
        for event in decoded:
            event = {**event, 'transaction_index': tx.get('transactionIndex', 0)}
            if event.get('decode_error'):
                unmatched.append(event)
            elif event.get('fields', {}).get('position') == position:
                raw_events.append(event)
            elif event['event'] == 'CompositionFee':
                peers = [e for e in decoded if e['outer_index'] == event['outer_index'] and e['event'] in ('AddLiquidity', 'Rebalancing')]
                sender_matches = any(e.get('fields', {}).get('from', e.get('fields', {}).get('owner')) == event['fields'].get('from') for e in peers)
                if {e.get('fields', {}).get('position') for e in peers} == {position} and sender_matches:
                    raw_events.append({**event, 'attribution': 'unique_position_in_same_outer_instruction'})
                else:
                    unmatched.append(event)
            else:
                unmatched.append(event)
    raw_events.sort(key=lambda e: (e['slot'], e['transaction_index'], e['outer_index'], e['inner_index']))
    canonical, aliases = canonical_events(raw_events)
    creates = [e for e in canonical if e['event'] == 'PositionCreate']
    closes = [e for e in canonical if e['event'] == 'PositionClose']
    if len(creates) != 1 or len(closes) != 1:
        issues.append('creation_or_closure_not_unique')
    owner = creates[0]['fields']['owner'] if len(creates) == 1 else None
    if any(e.get('fields', {}).get('owner', owner) != owner for e in canonical):
        issues.append('ownership_change_requires_allocation')
    if any(e.get('fields', {}).get('lb_pair', pool) != pool for e in canonical):
        issues.append('event_pool_mismatch')
    allowed = {'PositionCreate', 'PositionClose', 'AddLiquidity', 'RemoveLiquidity', 'ClaimFee', 'ClaimFee2', 'Rebalancing', 'CompositionFee'}
    if any(e['event'] not in allowed for e in canonical):
        issues.append('unsupported_event_type')
    if any(any(e.get('fields', {}).get('rewards', [])) for e in canonical):
        issues.append('reward_mint_configuration_unresolved')
    if unmatched:
        issues.append('unmatched_events_retained')
    if canonical and any(b['block_time'] < a['block_time'] for a, b in zip(canonical, canonical[1:])):
        issues.append('inconsistent_timestamp_order')
    if creates and closes:
        order = lambda e: (e['slot'], e['transaction_index'], e['outer_index'], e['inner_index'])
        if order(creates[0]) >= order(closes[0]) or any(not order(creates[0]) <= order(e) <= order(closes[0]) for e in canonical):
            issues.append('events_outside_create_close_boundaries')
    closure_zero = False
    if len(closes) == 1:
        tx = txs[closes[0]['signature']]
        keys = account_keys(tx)
        if position in keys:
            closure_zero = tx['meta']['postBalances'][keys.index(position)] == 0
    if not closure_zero or verification['positionAccount']['value'] is not None:
        issues.append('closed_account_state_not_confirmed')
    # Existing accounting convention: Rebalancing is external token flows, while
    # CompositionFee stays embedded and compatibility claim events are paired.
    safe_events = [e for e in canonical if e['event'] in allowed]
    flows = ledger({'pool_metadata': metadata, 'events': safe_events})
    checks = []
    administrative_ops = Counter()
    observed_fees = 0
    for signature, tx in txs.items():
        if not tx.get('meta') or tx['meta'].get('err') is not None:
            continue
        keys = account_keys(tx)
        ts, other = transfers(tx)
        for instruction in other:
            administrative_ops[instruction['opcode']] += 1
            # Retained non-transfer SPL instructions. No cost allocation inferred.
            if instruction['opcode'] not in {9, 17, 18, 21, 22}:
                issues.append('unsupported_token_instruction')
        sides = []
        for side in ('x', 'y'):
            token = metadata[f'token_{side}']
            reserve = metadata[f'reserve_{side}']
            relevant = [f for f in flows if f['signature'] == signature and f['mint'] == token['address']]
            expected_in = sum(int(f['atomic']) for f in relevant if f['kind'] == 'deposit')
            expected_out = sum(int(f['atomic']) for f in relevant if f['kind'] in ('withdrawal', 'fee'))
            incoming = sum(t['amount'] for t in ts if t['destination'] == reserve)
            outgoing = sum(t['amount'] for t in ts if t['source'] == reserve)
            balances = tx['meta'].get('preTokenBalances', []) + tx['meta'].get('postTokenBalances', [])
            observed_decimals = {b['uiTokenAmount']['decimals'] for b in balances if b['mint'] == token['address']}
            if observed_decimals and observed_decimals != {token['decimals']}:
                issues.append('historical_token_decimals_mismatch')
            if relevant and not observed_decimals:
                issues.append('historical_token_decimals_missing')
            actual_delta = 0
            if reserve in keys:
                index = keys.index(reserve)
                pre = next((b for b in tx['meta'].get('preTokenBalances', []) if b['accountIndex'] == index and b['mint'] == token['address']), None)
                post = next((b for b in tx['meta'].get('postTokenBalances', []) if b['accountIndex'] == index and b['mint'] == token['address']), None)
                actual_delta = int(post['uiTokenAmount']['amount']) - int(pre['uiTokenAmount']['amount']) if pre and post else None
            matched = incoming == expected_in and outgoing == expected_out and actual_delta == expected_in - expected_out
            if not matched:
                issues.append('token_transfer_or_balance_mismatch')
            sides.append({'side': side, 'depositAtomic': str(expected_in), 'withdrawalAndFeeAtomic': str(expected_out), 'reserveInAtomic': str(incoming), 'reserveOutAtomic': str(outgoing), 'balanceDeltaAtomic': str(actual_delta) if actual_delta is not None else None, 'matches': matched})
        observed_fees += tx['meta']['fee']
        checks.append({'signature': signature, 'slot': tx['slot'], 'at': tx['blockTime'], 'feeLamports': str(tx['meta']['fee']), 'feePayer': keys[0], 'sides': sides})
    totals = {}
    with localcontext() as ctx:
        ctx.prec = 100
        for side in ('x', 'y'):
            token = metadata[f'token_{side}']
            values = {kind: sum(int(f['atomic']) for f in flows if f['mint'] == token['address'] and f['kind'] == kind) for kind in ('deposit', 'withdrawal', 'fee')}
            totals[side] = {**{kind + 'Atomic': str(value) for kind, value in values.items()}, **{kind: str(Decimal(value) / Decimal(10) ** token['decimals']) for kind, value in values.items()}}
    passed = not issues
    return {'version': 1, 'position': position, 'owner': owner, 'pool': pool, 'quality': 'token-flow-reconciled' if passed else 'unverified',
            'tokens': {s: {'mint': metadata[f'token_{s}']['address'], 'symbol': metadata[f'token_{s}']['symbol'], 'decimals': metadata[f'token_{s}']['decimals']} for s in ('x', 'y')},
            'verifiedAt': verification['capturedAt'], 'source': 'Helius finalized transactions + Meteora metadata + pinned DLMM IDL',
            'createdAt': creates[0]['block_time'] if len(creates) == 1 else None, 'closedAt': closes[0]['block_time'] if len(closes) == 1 else None,
            'closureConfirmed': closure_zero and len(closes) == 1 and verification['positionAccount']['value'] is None,
            'signatureSetMatched': signature_match, 'queryExhausted': checkpoint['queryExhausted'], 'issues': sorted(set(issues)),
            'transactionCount': len(txs), 'rawEventCount': len(raw_events), 'aliasPairsSuppressed': len(aliases), 'totals': totals,
            'events': [{'signature': e['signature'], 'slot': e['slot'], 'at': e['block_time'], 'type': e['event'], 'outerIndex': e['outer_index'], 'innerIndex': e['inner_index']} for e in canonical],
            'flows': flows, 'transactions': checks, 'unmatchedEvents': unmatched, 'retainedNonTransferInstructions': dict(administrative_ops),
            'observedTransactionFeesLamports': str(observed_fees), 'costAllocationComplete': False, 'historicalUsdPnl': None, 'holdBenchmarkUsd': None,
            'coverage': 'Provider-returned position signature set; not complete wallet history or independent provider agreement',
            'idlSha256': hashlib.sha256(json.dumps(codec.idl, sort_keys=True).encode()).hexdigest()}
