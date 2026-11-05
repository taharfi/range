import json
from decimal import Decimal
from pathlib import Path

import pytest

from research.finance import deduplicate_events, reconstruct, token_units
from research.phase2 import correlation, series_quality
from research.rpc_discovery import PROGRAM, address_valid, b58encode, decode_events


def event(kind='add', amount='100.000000000000000001', signature='a', index=0):
    return {'signature':signature,'ixIndex':index,'positionAddress':'position','eventType':kind,'slot':1,'totalUsd':amount}


@pytest.mark.parametrize('atomic,decimals,expected', [('18446744073709551615',9,'18446744073.709551615'),('1234567',6,'1.234567'),('42',0,'42'),('1',18,'0.000000000000000001')])
def test_atomic_precision(atomic,decimals,expected):
    assert token_units(atomic,decimals)==Decimal(expected)


@pytest.mark.parametrize('atomic,decimals',[('1.5',6),('NaN',9),('1',-1),('1',256),('1',True),(1.0,6),('-1',9),('18446744073709551616',0)])
def test_invalid_amounts(atomic,decimals):
    with pytest.raises(ValueError): token_units(atomic,decimals)


def test_incomplete_history_suppresses_pnl():
    r=reconstruct([event(),event('remove','110','b')])
    assert not r['complete'] and r['realized_net_pnl_usd'] is None
    assert 'event_coverage_unverified' in r['missing']


def test_fees_are_not_profit_and_exact_cashflows():
    # Synthetic complete fixture, deliberately loses money despite collecting fees.
    r=reconstruct([event(),event('remove','80','b'),event('claim_fee','5','c')],creation_verified=True,closure_verified=True,coverage_complete=True,costs_usd='0.000000000000000001')
    assert r['realized_net_pnl_usd']=='-15.000000000000000002'


def test_event_dedup_uses_instruction_and_type():
    a=event(); b=event(index=1); c=event(kind='claim_fee')
    assert len(deduplicate_events([a,a,b,c]))==3
    with pytest.raises(ValueError): deduplicate_events([a,{**a,'totalUsd':'99'}])


def test_mixed_position_rejected():
    with pytest.raises(ValueError): reconstruct([event(),{**event(signature='b'),'positionAddress':'other'}])


def test_gap_and_flat_series():
    rows=[{'timestamp':0,'timestamp_str':'1970-01-01T00:00:00+00:00','open':1,'high':1,'low':1,'close':1,'volume':5}, {'timestamp':172800,'timestamp_str':'1970-01-03T00:00:00+00:00','open':1,'high':1,'low':1,'close':1,'volume':5}]
    q=series_quality(rows,0,259200,True)
    assert q['missing_daily_rows']==1 and 'flat_close_series' in q['issues']


def test_address_and_rank_correlation():
    assert address_valid(PROGRAM) and not address_valid('fake')
    assert correlation([{'x':1,'y':9},{'x':2,'y':8},{'x':2,'y':8}], 'x','y')['spearman']==pytest.approx(-1)


def test_idl_event_decoding_ignores_failed_transactions_and_wrong_program():
    idl=json.loads(Path('data/evidence/dlmm-idl.json').read_text())
    disc=next(e['discriminator'] for e in idl['events'] if e['name']=='PositionCreate')
    payload=bytes([228,69,165,46,81,203,154,29])+bytes(disc)+bytes([1])*32+bytes([2])*32+bytes([3])*32
    tx={'slot':1,'blockTime':2,'transaction':{'message':{'accountKeys':[PROGRAM]}},'meta':{'err':None,'innerInstructions':[{'index':0,'instructions':[{'programIdIndex':0,'data':b58encode(payload)}]}]}}
    events=decode_events(tx,idl)
    assert len(events)==1 and events[0]['owner']==b58encode(bytes([3])*32)
    tx['meta']['err']={'Custom':1}; assert decode_events(tx,idl)==[]
    tx['meta']['err']=None;tx['transaction']['message']['accountKeys']=['other'];assert decode_events(tx,idl)==[]
