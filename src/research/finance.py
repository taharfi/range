"""Conservative exact-amount accounting; never infer completeness from first add."""
from decimal import Decimal, localcontext


def token_units(atomic: str | int, decimals: int) -> Decimal:
    if not isinstance(atomic, (str, int)) or isinstance(atomic, bool):
        raise ValueError('Use integer or string atomic amounts, never floats')
    if not isinstance(decimals, int) or isinstance(decimals, bool) or not 0 <= decimals <= 255:
        raise ValueError('Invalid SPL decimal count')
    value = Decimal(str(atomic))
    if not value.is_finite() or value != value.to_integral_value():
        raise ValueError('Atomic amount must be a finite integer')
    if not 0 <= value <= 2**64-1:
        raise ValueError('SPL token amounts must fit unsigned u64')
    with localcontext() as ctx:
        ctx.prec = 100
        return value / Decimal(10) ** decimals


def deduplicate_events(events):
    result = {}
    for e in events:
        # API ixIndex and event type are needed: a signature can contain many events.
        key = (e['signature'], e['ixIndex'], e['positionAddress'], e['eventType'])
        if key in result and result[key] != e:
            raise ValueError('Conflicting duplicate event')
        result[key] = e
    return sorted(result.values(), key=lambda e: (e['slot'], e['signature'], e['ixIndex']))


def reconstruct(events, *, creation_verified=False, closure_verified=False,
                coverage_complete=False, costs_usd=None):
    with localcontext() as ctx:
        ctx.prec = 100
        return _reconstruct(events, creation_verified=creation_verified, closure_verified=closure_verified,
                            coverage_complete=coverage_complete, costs_usd=costs_usd)


def _reconstruct(events, *, creation_verified, closure_verified, coverage_complete, costs_usd):
    events = deduplicate_events(events)
    if len({e['positionAddress'] for e in events}) > 1:
        raise ValueError('Expected one position')
    if costs_usd is not None and (not Decimal(str(costs_usd)).is_finite() or Decimal(str(costs_usd)) < 0):
        raise ValueError('Costs must be finite and nonnegative')
    reasons = []
    if not creation_verified: reasons.append('creation_unverified')
    if not closure_verified: reasons.append('terminal_inventory_unverified')
    if not coverage_complete: reasons.append('event_coverage_unverified')
    if costs_usd is None: reasons.append('execution_costs_unknown')
    totals = {k: Decimal(0) for k in ('add', 'remove', 'claim_fee', 'claim_reward')}
    for e in events:
        if e['eventType'] not in totals:
            reasons.append('unsupported_event_type')
            continue
        amount = Decimal(e['totalUsd'])
        if not amount.is_finite() or amount < 0:
            raise ValueError('Invalid event USD valuation')
        totals[e['eventType']] += amount
    # These are source-valued cash flows, not chain-verified historical USD prices.
    gross = totals['remove'] + totals['claim_fee'] + totals['claim_reward'] - totals['add']
    complete = not reasons and bool(events) and totals['add'] > 0
    return {'event_count': len(events), 'source_valued_cash_flows_usd': {k: str(v) for k,v in totals.items()},
            'complete': complete, 'missing': sorted(set(reasons)),
            'realized_net_pnl_usd': str(gross - Decimal(str(costs_usd))) if complete else None,
            'unrealized_pnl_usd': None, 'hold_benchmark_usd': None}
