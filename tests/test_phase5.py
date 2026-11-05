"""Execution evidence and estimate quality must remain separate."""
from decimal import Decimal as D
import json
from pathlib import Path
import pytest
from research.historical_prices import SOL,USDC
from research.onchain_prices import CLMM,extract,robust_reference,observation_quality
from research.phase5 import cash_coefficients,value_coefficients,estimate_quote,empirical_history
from research.rpc_discovery import b58encode
from research.exchange_validation import candle_quote

def candle(start=60,volume='100',close='100'):
    return {'start':start,'volume':volume,'close':close,'low':close,'high':close,'source':'fixture','source_url':'fixture','response_sha256':'fixture'}

def test_candles_never_use_an_unfinished_bar_even_if_it_contains_target():
    q=candle_quote([candle(60,close='100'),candle(120,close='1000')],150,120)
    assert q['price']=='100' and q['last_trade_age_upper_bound_seconds']==90
    assert q['actual_last_trade_timestamp'] is None

def test_zero_volume_and_thin_carried_forward_candles_are_unavailable():
    assert not candle_quote([candle(volume='0')],150,120)['available']
    assert not candle_quote([candle(volume='.01')],150,120)['available']

def test_completed_candle_does_not_invent_last_trade_freshness():
    assert not candle_quote([candle()],181,120)['available']

def test_rpc_cache_reads_utf8_transaction_memos_without_network(tmp_path):
    import hashlib
    from research.rpc_discovery import RPC
    request={'jsonrpc':'2.0','id':1,'method':'getBlock','params':[123]}
    digest=hashlib.sha256(json.dumps(request,sort_keys=True).encode()).hexdigest()
    path=tmp_path/'rpc'/f'{digest}.json';path.parent.mkdir()
    path.write_text(json.dumps({'result':{'memo':'Unicode memo: \u0410\U0001f680'}},ensure_ascii=False),encoding='utf-8')
    rpc=RPC(tmp_path)
    try:assert rpc.call('getBlock',[123])=={'memo':'Unicode memo: \u0410\U0001f680'}
    finally:rpc.http.close()

def observation(price='100',pool='a',signature='s',slot=10,time=100,venue='one'):
    return {'price_usdc_per_sol':price,'pool':pool,'signature':signature,'outer_index':0,'inner_index':-1,
            'slot':slot,'timestamp':time,'reference_eligible':True,'venue':venue}

def test_reference_excludes_future_time_and_same_slot_even_if_timestamp_matches():
    rows=[observation(slot=20),observation(slot=9,time=102),observation(slot=9,time=101)]
    q=robust_reference(rows,20,101)
    assert q['trade_count']==1 and q['max_age_seconds']==0

def test_reference_deduplicates_events_and_pool_votes():
    a=observation();rows=[a,a]+[observation('200','b',str(i)) for i in range(50)]
    q=robust_reference(rows,20,101)
    assert D(q['price_usdc_per_sol'])==150 and q['pool_count']==2 and q['trade_count']==51
    assert q['quality']=='approximate_historical_estimate'

def test_reference_rejects_cross_pool_outlier_without_weighting_volume():
    rows=[observation('100','a','1'),observation('100','b','2'),observation('1000','c','3')]
    q=robust_reference(rows,20,101)
    assert D(q['price_usdc_per_sol'])==100 and q['outlier_pools']==['c']

def test_two_raydium_markets_are_one_protocol_and_not_high_confidence():
    q=robust_reference([observation(pool='a',venue='Raydium AMM v4'),observation(pool='b',signature='other',venue='Raydium CLMM')],20,101)
    assert q['venue_count']==2 and q['protocol_count']==1
    assert q['quality']=='approximate_historical_estimate'

def test_reference_never_accepts_old_or_rejected_trade():
    a=observation();a['reference_eligible']=False
    assert not robust_reference([a,observation(time=0)],20,101)['available']

def test_trade_size_and_vault_filters_do_not_claim_active_depth():
    row={'trade_size_usdc':'1','historical_usdc_vault_balance':'99999','reserve_consumption_proxy':'.02','validation_issues':[]}
    assert len(observation_quality(row))==3

def clmm_tx():
    token='TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'
    keys=[CLMM,token,SOL,USDC,'pool','payer','config','userSOL','userUSDC','vaultSOL','vaultUSDC','oracle','tick']
    def balance(index,mint,amount,decimals):return {'accountIndex':index,'mint':mint,'uiTokenAmount':{'amount':str(amount),'decimals':decimals}}
    def transfer(source,dest,amount):return {'programIdIndex':1,'accounts':[source,dest,5],'data':b58encode(bytes([3])+amount.to_bytes(8,'little'))}
    ix={'programIdIndex':0,'accounts':[5,6,4,7,8,9,10,11,1,12],'data':b58encode(bytes([248,198,158,145,225,117,135,200])+bytes(33))}
    return {'slot':10,'blockTime':100,'transaction':{'signatures':['synthetic'],'message':{'accountKeys':keys,'instructions':[ix]}},
            'meta':{'err':None,'preTokenBalances':[balance(9,SOL,1000*10**9,9),balance(10,USDC,300000*10**6,6)],
                    'postTokenBalances':[balance(9,SOL,1002*10**9,9),balance(10,USDC,299800*10**6,6)],
                    'innerInstructions':[{'index':0,'instructions':[transfer(7,9,2*10**9),transfer(10,8,200*10**6)]}]}}

def test_official_clmm_instruction_layout_and_independent_raw_transfers():
    rows=extract(clmm_tx());assert len(rows)==1
    r=rows[0]
    assert r['reference_eligible'] and r['evidence_tier']=='exact_execution_evidence'
    assert r['sol_atomic']=='2000000000' and r['usdc_atomic']=='200000000'
    assert D(r['price_usdc_per_sol'])==100
    assert r['actual_price_impact'] is None and r['active_bin_liquidity'] is None

def test_decimals_mismatch_blocks_reference_instead_of_normalizing_silently():
    tx=clmm_tx();tx['meta']['preTokenBalances'][0]['uiTokenAmount']['decimals']=6
    r=extract(tx)[0]
    assert not r['reference_eligible'] and 'mint_or_decimals_mismatch' in r['reference_rejections']

def test_reserve_balance_mismatch_is_retained_and_rejected():
    tx=clmm_tx();tx['meta']['postTokenBalances'][0]['uiTokenAmount']['amount']='1002000000001'
    r=extract(tx)[0]
    assert 'reserve_delta_transfer_mismatch' in r['reference_rejections']

def test_multiple_same_pool_invocations_not_silently_merged():
    tx=clmm_tx();tx['transaction']['message']['instructions']*=2
    tx['meta']['innerInstructions'].append({'index':1,'instructions':tx['meta']['innerInstructions'][0]['instructions']})
    rows=extract(tx)
    assert len(rows)==2 and all(not r['reference_eligible'] for r in rows)

def points(price):
    return [{'price':str(price),'timestamp':time,'source':'fixture','quote':'USD','aggregation':True} for time in [0,3600,7200]]

def test_usdc_usd_is_multiplied_and_never_pegged_or_promoted_to_verified():
    ref={'available':True,'price_usdc_per_sol':'100','observed_max_deviation_fraction':'.001'}
    q=estimate_quote(SOL,7201,20,{SOL:points(99),USDC:points('.98')},ref)
    assert D(q['price'])==98 and q['quality']=='approximate_historical_estimate' and not q['verified']
    assert q['components']['usdc_usd']['asof']['timestamp']==7200

def test_missing_usdc_anchor_blocks_onchain_usd_conversion():
    q=estimate_quote(SOL,7201,20,{SOL:points(99)}, {'available':True,'price_usdc_per_sol':'100'})
    assert not q['available']

def test_empirical_uncertainty_never_uses_future_observations():
    series=points(100)+[{'price':'1000000','timestamp':7202}]
    assert empirical_history(series,7201)['observed_range_fraction']=='0'
    assert empirical_history(series,20000) is None

def flow(kind,amount,time):return {'kind':kind,'atomic':str(amount),'decimals':9,'mint':SOL,'time':time}

def test_fee_and_hold_capital_matching_and_costs_once():
    c=cash_coefficients([flow('deposit',10**9,100),flow('withdrawal',10**9,200),flow('fee',10**8,200)], [flow('cost',10**7,200)],200)
    quotes={(SOL,t):{'available':True,'price':str(p),'price_low_sensitivity':str(p),'price_high_sensitivity':str(p)} for t,p in [(100,100),(200,110)]}
    assert D(value_coefficients(c['net'],quotes)['central'])==D('19.9')
    assert D(value_coefficients(c['hold'],quotes)['central'])==10
    assert D(value_coefficients(c['excess'],quotes)['central'])==D('9.9')
    assert (SOL,100) in c['excess'] and c['excess'][(SOL,100)]==0

def test_correlated_same_mark_cashflows_cancel_before_uncertainty():
    c=cash_coefficients([flow('deposit',10**9,100),flow('withdrawal',10**9,100)],[],100)
    assert value_coefficients(c['net'],{})=={'central':'0','low_sensitivity':'0','high_sensitivity':'0'}

def test_signed_cashflow_stress_and_missing_price():
    coefficients={(SOL,100):D('-1'),(SOL,200):D('2')}
    quotes={(SOL,t):{'available':True,'price':'100','price_low_sensitivity':'90','price_high_sensitivity':'110'} for t in [100,200]}
    assert value_coefficients(coefficients,quotes)=={'central':'100','low_sensitivity':'70','high_sensitivity':'130'}
    quotes[(SOL,100)]['available']=False
    assert value_coefficients(coefficients,quotes) is None

@pytest.mark.skipif(not Path('data/phase5/usd_analysis.json').exists(),reason='Run phase5 first')
def test_actual_run_never_promotes_approximate_prices_and_never_looks_ahead():
    report=json.loads(Path('data/phase5/usd_analysis.json').read_text())
    assert len(report['positions'])==6
    for p in report['positions']:
        assert p['summary']['verified_usd_pnl'] is None
        for q in p['quotes']:
            if q.get('method')=='prior_swap_reference_times_historical_usdc_usd':
                for observation in q['components']['onchain']['observations']:
                    assert observation['slot']<q['target_slot'] and observation['distance_seconds']>=0
                assert q['components']['usdc_usd']['asof']['timestamp']<=q['target_timestamp']

@pytest.mark.skipif(not Path('data/phase5/onchain_observations.json').exists(),reason='Collect actual swaps first')
def test_real_execution_ratios_and_reference_screens_preserve_evidence():
    observations=json.loads(Path('data/phase5/onchain_observations.json').read_text())
    assert len(observations)>=138
    for o in observations:
        expected=D(o['usdc_atomic'])/D(10**o['usdc_decimals'])/(D(o['sol_atomic'])/D(10**o['sol_decimals']))
        assert abs(D(o['price_usdc_per_sol'])/expected-1)<D('1e-25')
        assert o['reference_eligible']==(not o['reference_rejections'])
        if o['reference_eligible']:
            assert D(o['trade_size_usdc'])>=100 and D(o['historical_usdc_vault_balance'])>=100000
            assert D(o['reserve_consumption_proxy'])<=D('.01')
            assert not o['validation_issues']
