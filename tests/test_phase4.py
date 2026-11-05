"""Synthetic valuation fixtures and strict verification gates; no live price calls."""
from decimal import Decimal
import json
from pathlib import Path
import pytest

from research.historical_prices import SOL,USDC,select_asof
from research.phase4 import initialized_owner_token_accounts,value_flows
from research.rpc_discovery import b58decode,b58encode


def price(value,time):
    return {'price':str(value),'timestamp':time,'source':'synthetic-fixture','quote':'USD','aggregation':True}


def flow(kind,amount,time,mint=SOL,signature='sig'):
    return {'kind':kind,'atomic':str(amount),'decimals':9 if mint==SOL else 6,'time':time,'mint':mint,'signature':signature}


def test_historical_asof_ignores_future_even_if_closer():
    q=select_asof([price(1,100),price(999,111)],110,60)
    assert q['price']=='1' and q['timestamp']==100 and q['usable']


def test_stale_point_never_promoted_by_retrieval_time():
    q=select_asof([{**price(10,100),'retrieved_at':99999}],161,60)
    assert not q['usable'] and q['quality']=='stale_for_policy'


def test_future_only_missing_and_zero_invalid():
    assert not select_asof([price(1,101)],100)['usable']
    assert select_asof([price(0,100)],100)['quality']=='invalid_price'


def test_conflicting_price_samples_block_selection():
    q=select_asof([price(1,100),price(2,100)],100)
    assert not q['usable'] and q['quality']=='conflicting_source_prices'


def test_hold_does_not_reinvest_withdrawals_or_double_count_fees():
    flows=[flow('deposit',1_000_000_000,100),flow('withdrawal',1_100_000_000,200),flow('fee',100_000_000,200)]
    prices={SOL:[price(10,100),price(12,200)]}
    r=value_flows(flows,[],prices,200,60)
    assert Decimal(r['net_usd_pnl'])==Decimal('4.4')
    assert Decimal(r['hold_pnl_usd'])==Decimal('2')
    assert Decimal(r['hold_terminal_usd'])==Decimal('12')
    assert Decimal(r['excess_vs_hold_usd'])==Decimal('2.4')


def test_multiple_deposit_lots_and_partial_withdrawal_are_capital_matched():
    flows=[flow('deposit',1_000_000_000,100),flow('deposit',2_000_000_000,150),flow('withdrawal',1_000_000_000,170),flow('withdrawal',2_100_000_000,200)]
    prices={SOL:[price(10,100),price(11,150),price(11,170),price(12,200)]}
    r=value_flows(flows,[],prices,200,60)
    assert Decimal(r['hold_terminal_usd'])==36
    assert Decimal(r['hold_pnl_usd'])==4
    assert Decimal(r['net_usd_pnl'])==Decimal('4.2')


def test_usdc_price_never_assumed_one_and_network_cost_only_once():
    flows=[flow('deposit',1_000_000,100,USDC),flow('withdrawal',1_100_000,200,USDC)]
    costs=[flow('cost',5_000,200)]
    prices={USDC:[price('.98',100),price('.99',200)],SOL:[price(100,200)]}
    r=value_flows(flows,costs,prices,200,60)
    assert Decimal(r['net_usd_pnl'])==Decimal('.1085')


def test_missing_cost_price_blocks_pnl_and_hold_comparison():
    flows=[flow('deposit',1_000_000,100,USDC),flow('withdrawal',1_000_000,200,USDC)]
    r=value_flows(flows,[flow('cost',5000,100)],{USDC:[price(1,100),price(1,200)]},200,60)
    assert not r['available'] and r['net_usd_pnl'] is None


def test_hourly_sensitivity_cannot_masquerade_as_strict_result():
    flows=[flow('deposit',1_000_000_000,1500),flow('withdrawal',1_100_000_000,2000)]
    prices={SOL:[price(100,1000)]}
    assert not value_flows(flows,[],prices,2000,60)['available']
    assert value_flows(flows,[],prices,2000,3600)['available']


def test_temporary_wrapped_account_identified_without_balance_metadata():
    owner='11111111111111111111111111111111'
    program='TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'
    tx={'transaction':{'message':{'accountKeys':[program,'temporary',SOL,owner],'instructions':[]}},'meta':{'innerInstructions':[{'index':0,'instructions':[{'programIdIndex':0,'accounts':[1,2],'data':b58encode(bytes([18])+b58decode(owner))}]}]}}
    assert initialized_owner_token_accounts(tx,owner)=={1}


@pytest.mark.skipif(not Path('data/phase4/usd_analysis.json').exists(),reason='Collect the real phase4 cohort first')
def test_real_phase4_results_cannot_promote_coarse_prices_to_verified_pnl():
    report=json.loads(Path('data/phase4/usd_analysis.json').read_text())
    assert len(report['positions'])==6
    for row in report['positions']:
        assert row['funded'] and row['chain_history_complete']
        assert row['independent_verification']['complete']
        assert not row['verified'] and row['strict']['net_usd_pnl'] is None
        assert row['coarse_sensitivity']['available']
        for flow in row['strict']['quotes']:
            price=flow['price_observation']
            assert price['timestamp']<=flow['time']
            assert price['quality']=='stale_for_policy'
