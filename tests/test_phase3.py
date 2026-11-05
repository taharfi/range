"""Synthetic accounting edge cases and replay of the actual closed-position sample."""
import copy
import json
from decimal import Decimal
from pathlib import Path

import pytest

from research.dlmm_schema import Codec
from research.economic import economic_performance
from research.lifecycle import canonical_events, dedup_chain, evaluate, timestamp_errors
from research.finance import token_units


def evt(name, fields=None, sig='one',inner=0,slot=10,ts=100):
    return {'signature':sig,'outer_index':0,'inner_index':inner,'slot':slot,'block_time':ts,'event':name,'fields':fields or {'position':'p','owner':'o'}}


def test_compatibility_fee_pair_counted_once_but_other_claim_kept():
    a=evt('ClaimFee',{'position':'p','owner':'o','fee_x':9,'fee_y':2})
    b=evt('ClaimFee2',{**a['fields'],'active_bin_id':1},inner=1)
    c=evt('ClaimFee',a['fields'],sig='another')
    result,pairs=canonical_events([a,a,b,c])
    assert len(result)==2 and len(pairs)==1
    assert sum(e['fields']['fee_x'] for e in result)==18


def test_conflicting_same_event_not_silently_deduplicated():
    a=evt('AddLiquidity',{'amounts':[1,2]})
    with pytest.raises(ValueError):dedup_chain([a,{**a,'fields':{'amounts':[9,2]}}])


def test_liquidity_removal_does_not_prove_closure():
    r=evaluate([evt('PositionCreate'),evt('RemoveLiquidity',inner=1)],True,True)
    assert not r['event_history_complete']
    assert 'closure_count_not_one' in r['chain_issues']


def test_truncated_signature_history_not_complete():
    r=evaluate([evt('PositionCreate'),evt('PositionClose',inner=1)],False,True)
    assert not r['event_history_complete'] and r['usd_pnl'] is None


def test_timestamp_consistency_and_no_unreported_millisecond_conversion():
    a=evt('PositionCreate');b=evt('PositionClose',slot=11,ts=99)
    assert 'timestamp_reverses_slot_order' in timestamp_errors([a,b])
    assert 'milliseconds_in_seconds_field' in timestamp_errors([evt('PositionCreate',ts=1792421711000)])


def test_multiple_deposits_and_partial_withdrawals_usd_cashflow():
    flows=[{'kind':'deposit','mint':'m','atomic':str(10_000_000),'decimals':6,'time':100},
           {'kind':'deposit','mint':'m','atomic':str(5_000_000),'decimals':6,'time':110},
           {'kind':'withdrawal','mint':'m','atomic':str(3_000_000),'decimals':6,'time':120},
           {'kind':'withdrawal','mint':'m','atomic':str(10_000_000),'decimals':6,'time':130},
           {'kind':'fee','mint':'m','atomic':str(1_000_000),'decimals':6,'time':130}]
    prices={('m',t):{'price':'1.25','quote':'USD','timestamp':t,'source':'synthetic-test'} for t in [100,110,120,130]}
    result=economic_performance(flows,prices,[],complete=True)
    assert Decimal(result['net_usd_pnl'])==Decimal('-1.25')
    assert result['hold_benchmark_usd'] is None  # Multiple funding times need a declared benchmark convention.


@pytest.mark.parametrize('price',[None,{'price':'0','quote':'USD','timestamp':100,'source':'fixture'}, {'price':'1','quote':'USD','timestamp':101,'source':'fixture'}, {'price':'1','quote':'USD','timestamp':1,'source':'fixture'}])
def test_missing_zero_future_or_stale_price_suppresses_pnl(price):
    flow={'kind':'deposit','mint':'m','atomic':'1','decimals':9,'time':100}
    result=economic_performance([flow],{('m',100):price},[],complete=True)
    assert result['net_usd_pnl'] is None and result['missing']


def test_observed_cost_not_equal_to_unknown_cost():
    assert economic_performance([],{},None,complete=True)['net_usd_pnl'] is None
    assert token_units('18446744073709551615',9)==Decimal('18446744073.709551615')


def test_owner_change_and_unknown_events_block_accounting():
    es=[evt('PositionCreate'),evt('PositionClose',{'position':'p','owner':'other'},inner=1),evt('UNKNOWN_EVENT',inner=2)]
    r=evaluate(es,True,True)
    assert 'ownership_change_unallocated' in r['chain_issues']
    assert 'unsupported_lifecycle_event' in r['chain_issues']


@pytest.mark.skipif(not Path('data/phase3/position_lifecycles.json').exists(),reason='Real phase3 sample not collected')
def test_real_closed_sample_and_reserve_cashflow_reconciliation():
    records=json.loads(Path('data/phase3/position_lifecycles.json').read_text())
    assert len(records)==10 and len({r['position'] for r in records})==10
    for r in records:
        assert r['closure_lamports_zero']
        assert any(e['event']=='PositionClose' for e in r['events'])
        assert r['assessment']['usd_pnl'] is None
        assert r['creation_time']<=r['closure_time']
        if r['assessment']['chain_history_complete']:
            assert all(s['matches'] for tx in r['transfer_reconciliation'] for s in tx['sides'])
    assert all(r['assessment']['event_history_complete'] for r in records)


@pytest.mark.skipif(not Path('data/phase3/valuation_audit.json').exists(),reason='Real audit unavailable')
def test_real_audit_covers_every_original_outlier_and_preserves_uncertainty():
    records=json.loads(Path('data/phase3/valuation_audit.json').read_text())['outliers']
    assert len(records)==82
    assert all(not r['correction_applied'] for r in records)
    assert all(t['decimals_match'] and t['mint_matches_pool'] and t['reserve_mint_matches'] for r in records for t in r['tokens'])
    assert all(r['price_source_timestamp'] is None for r in records)
