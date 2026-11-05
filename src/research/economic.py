"""Exact timestamp-aligned USD accounting; missing prices disable financial outputs."""
from decimal import Decimal, localcontext

from research.finance import token_units


def economic_performance(flows, prices, costs, *, complete, max_price_age=60):
    """Flows: mint/time/atomic/decimals/kind; costs in the same units with kind=cost.

    Prices are a provenance-bearing (mint,time) mapping. Only nonfuture USD
    observations within max_price_age seconds qualify. Synthetic tests do not
    imply a real dataset has these prices.
    """
    with localcontext() as ctx:
        ctx.prec=100
        reasons=[]
        if not complete:reasons.append('incomplete_lifecycle_or_reconciliation')
        if costs is None:reasons.append('costs_unavailable')
        def value(flow):
            p=(prices or {}).get((flow['mint'],flow['time']))
            if not p or p.get('quote')!='USD' or not p.get('source'):
                reasons.append('missing_timestamp_aligned_usd_price');return None
            age=flow['time']-p['timestamp']
            if not 0<=age<=max_price_age:
                reasons.append('stale_or_future_price');return None
            price=Decimal(str(p['price']))
            if not price.is_finite() or price<=0:
                reasons.append('invalid_price');return None
            return token_units(flow['atomic'],flow['decimals'])*price
        totals={k:Decimal(0) for k in ['deposit','withdrawal','fee','reward','cost']}
        for flow in flows+(costs or []):
            if flow['kind'] not in totals:
                reasons.append('unsupported_cash_flow');continue
            result=value(flow)
            if result is not None:totals[flow['kind']]+=result
        pnl=None if reasons else totals['withdrawal']+totals['fee']+totals['reward']-totals['deposit']-totals['cost']
        # Hold benchmark requires a funding-timing convention for multiple deposits.
        return {'net_usd_pnl':str(pnl) if pnl is not None else None,'hold_benchmark_usd':None,'missing':sorted(set(reasons)),'observed_or_estimated_costs':costs}
