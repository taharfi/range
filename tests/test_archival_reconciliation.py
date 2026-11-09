import copy
import json
from pathlib import Path
import pytest

from research.archival_reconciliation import reconcile


@pytest.fixture
def evidence():
    return (json.loads(Path('pilot/evidence/helius-history-2026-11-05/checkpoint.json').read_text()),
            json.loads(Path('data/evidence/closed-pool-verification.json').read_text()))


def test_actual_position_reconciles_transfers_balances_and_aliases_without_usd_claim(evidence):
    result = reconcile(*evidence)
    assert result['quality'] == 'token-flow-reconciled'
    assert result['transactionCount'] == 13
    assert result['aliasPairsSuppressed'] == 3
    assert result['totals']['x']['feeAtomic'] == '55590854'
    assert result['totals']['y']['feeAtomic'] == '12046774'
    assert all(s['matches'] for tx in result['transactions'] for s in tx['sides'])
    assert result['observedTransactionFeesLamports'] == '1339067'
    assert result['closureConfirmed'] and result['signatureSetMatched']
    assert result['historicalUsdPnl'] is None and result['holdBenchmarkUsd'] is None
    assert result['costAllocationComplete'] is False


@pytest.mark.parametrize('change', ['missing', 'open', 'time', 'slot', 'decimals', 'balance', 'unknown'])
def test_incomplete_or_inconsistent_evidence_never_becomes_reconciled(evidence, change):
    checkpoint, verification = copy.deepcopy(evidence)
    if change == 'missing': checkpoint['transactions'].pop(2)
    elif change == 'open': verification['positionAccount']['value'] = {'owner': 'not-closed'}
    elif change == 'time': checkpoint['transactions'][0]['blockTime'] += 100000
    elif change == 'slot': verification['signatures'][0]['slot'] += 1
    elif change == 'decimals': verification['metadata']['token_x']['decimals'] += 1
    elif change == 'balance':
        b = checkpoint['transactions'][1]['meta']['postTokenBalances'][0]
        b['uiTokenAmount']['amount'] = str(int(b['uiTokenAmount']['amount']) + 1)
    elif change == 'unknown': checkpoint['queryExhausted'] = False
    result = reconcile(checkpoint, verification)
    assert result['quality'] == 'unverified'
    assert result['issues']
    assert result['historicalUsdPnl'] is None


def test_duplicate_identical_transactions_do_not_double_count_and_conflicts_fail(evidence):
    checkpoint, verification = copy.deepcopy(evidence)
    baseline = reconcile(checkpoint, verification)
    checkpoint['transactions'].append(copy.deepcopy(checkpoint['transactions'][0]))
    assert reconcile(checkpoint, verification)['totals'] == baseline['totals']
    checkpoint['transactions'][-1]['slot'] += 1
    with pytest.raises(ValueError, match='Conflicting'):
        reconcile(checkpoint, verification)


def test_wrong_pool_reserve_mapping_fails(evidence):
    checkpoint, verification = copy.deepcopy(evidence)
    verification['metadata']['reserve_x'] = verification['metadata']['reserve_y']
    with pytest.raises(ValueError, match='mapping'):
        reconcile(checkpoint, verification)
