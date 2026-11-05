"""Generate the phase 2 reports from persisted observations, without network calls."""
import csv
import hashlib
import json
import math
import statistics
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path

import duckdb
import pyarrow as pa
import pyarrow.parquet as pq

from research.collector import atomic_json


def generate(root=Path('data/phase2')):
    root=Path(root)
    load=lambda name:json.loads((root/name).read_text(encoding='utf-8'))
    summary=load('statistics_summary.json'); coverage=load('coverage.json'); quality=load('quality_issues.json'); accounts=load('onchain_validation.json'); discovery=load('account_discovery.json'); cohort=load('cohort.json'); histories=load('histories.json')
    rows=list(csv.DictReader(Path('POOL_STATISTICS.csv').open(encoding='utf-8')))
    counts=Counter(flag for p in quality for flag in p['flags'])
    linked=discovery['linked_wallets']; positions=discovery['positions']
    events=sum(p['api_events'] for p in positions); complete=sum(p['reconstruction']['complete'] for p in positions)
    candle=[r for r in coverage if r['kind']=='ohlcv']; volume=[r for r in coverage if r['kind']=='volume']
    issue_counts=Counter(issue for r in coverage for issue in r['issues'])
    # Existing snapshots provide sparse historical TVL, never interpolate them.
    with duckdb.connect('data/research.duckdb',read_only=True) as db:
        initial=db.execute('SELECT address,observed_at,tvl FROM pool_snapshots').fetchall()
    panel=[{'address':a,'observed_at':t,'tvl_api':v,'source':'phase1_snapshot'} for a,t,v in initial]
    panel += [{'address':r['address'],'observed_at':r['observed_at'],'tvl_api':float(r['tvl_api']),'source':'phase2_snapshot'} for r in rows]
    pq.write_table(pa.Table.from_pylist(panel),root/'tvl_observations.parquet')
    seen=Counter(r['address'] for r in panel)
    stable_prices=[float(r['daily_log_return_std_api']) for r in rows if r['daily_log_return_std_api'] and not r['quality_flags']]
    flat=[r for r in coverage if 'flat_close_series' in r['issues']]
    precreation=0; precreation_nonzero=0
    for item in cohort['pools']:
        p=item['pool']; created=p['created_at']/1000
        if created>0:
            before=[r for r in histories.get(p['address'],{}).get('volume',[]) if r['timestamp']+86400<=created]
            precreation+=len(before)
            precreation_nonzero+=sum(r['volume']!=0 or r['fees']!=0 for r in before)
    manifest=[]
    for p in sorted((root/'api').glob('*.meta.json')):
        meta=json.loads(p.read_text()); body=p.with_name(p.name.replace('.meta.json','.json'))
        if hashlib.sha256(body.read_bytes()).hexdigest()!=meta['sha256']: raise ValueError(f'Hash mismatch {body}')
        manifest.append({'path':str(body),'sha256':meta['sha256'],'url':meta['url'],'observed_at':meta['observed_at']})
    rpc_manifest=[]
    for p in sorted((root/'rpc').glob('*.meta.json')):
        meta=json.loads(p.read_text()); body=p.with_name(p.name.replace('.meta.json','.json'))
        if hashlib.sha256(body.read_bytes()).hexdigest()!=meta['sha256']: raise ValueError(f'Hash mismatch {body}')
        rpc_manifest.append({'path':str(body),'sha256':meta['sha256'],'status':meta['status']})
    atomic_json(root/'audit_manifest.json',{'api_responses':manifest,'rpc_responses':rpc_manifest,'idl_sha256':hashlib.sha256(Path('data/evidence/dlmm-idl.json').read_bytes()).hexdigest(),'generated_at':datetime.now(timezone.utc).isoformat()})
    with (root/'verified_wallet_links.csv').open('w',newline='',encoding='utf-8') as f:
        writer=csv.DictWriter(f,fieldnames=['wallet','position','pool','signature','slot','event_types','explorer']);writer.writeheader()
        for p in positions:
            link=p['verified_link']
            if link:
                writer.writerow({'wallet':p['current_owner'],'position':p['position'],'pool':p['pool'],'signature':link['signature'],'slot':link['decoded_owner_events'][0]['slot'],'event_types':'|'.join(e['event'] for e in link['decoded_owner_events']),'explorer':link['explorer']})
    start=datetime.fromtimestamp(cohort['plan']['start'],timezone.utc).isoformat();end=datetime.fromtimestamp(cohort['plan']['end'],timezone.utc).isoformat()
    statistics_text=f'''# Phase 2 findings — 2026-10-19

## Verified collection results

- **{summary['pools']} unique pools** from 330 requested stratum memberships (54 overlaps removed). Eleven frozen selection queries, 30 rows each; first observation wins for overlapping pools. This is a purposive cross-section, not a representative sample. Original 50-pool collection remains intact.
- **24 pools requested over 30 days**, {start} inclusive through {end} exclusive for analysis. API requests use inclusive end bounds; endpoint-day rows are retained raw and excluded from completed-day calculations.
- **{sum(x['rows'] for x in volume)} volume/fee rows** and **{sum(x['rows'] for x in candle)} OHLCV rows** retained, including boundary rows. Volume/fee grid covers all 720 requested pool-days, but row presence does not prove trading or source completeness. **{sum(x['missing_daily_rows'] for x in candle)} missing OHLCV pool-days**; {sum(x['rows']==0 for x in candle)} pools have empty OHLCV, and {sum(x['missing_daily_rows']==0 for x in candle)} have all 30 completed-day candles.
- Historical TVL endpoint is absent from the inspected pool API. Sparse TVL panel contains **{len(panel)} actual retrieval observations**, with **{sum(v>1 for v in seen.values())} pools observed more than once**, from phase 1 and phase 2. No interpolated/backfilled daily TVL is generated.
- **{len(linked)} unique LP wallets linked to finalized owner/position events**; {len(discovery['accounts'])} current accounts yielded {len({p['current_owner'] for p in discovery['accounts']})} candidate owners. Queried {len(positions)} position histories with {events} API events. Explicit owner event matches: {dict(Counter(e['event'] for p in positions for e in (p['verified_link'] or {}).get('decoded_owner_events',[])))}. Verifiable signatures are in `data/phase2/verified_wallet_links.csv`.
- **{complete} reconstructable complete net P&Ls**. All selected accounts are open; historical completeness, terminal inventory, rewards, transfer handling and execution costs are not established. `finance.py` computes exact source-valued cash-flow subtotals but suppresses P&L for these incomplete cases.

## Observed sample statistics (API valuation units)

| Statistic | Value | Definition / period |
|---|---:|---|
| TVL min / median / max | {summary['tvl_min']:,.2f} / {summary['tvl_median']:,.2f} / {summary['tvl_max']:,.2f} | At per-pool retrieval |
| TVL p10 / p25 / p75 / p90 | {' / '.join(f"{v:,.2f}" for v in summary['tvl_quantiles'].values())} | Unweighted sample quantiles |
| Sample TVL | {summary['sample_tvl']:,.2f} | Sum across selected pools, not protocol TVL |
| Top-10 pool TVL share | {summary['top_10_pool_tvl_share']:.2%} | Sample pool-level concentration, not within-bin concentration |
| Sample TVL HHI | {summary['sample_pool_tvl_hhi']:.6f} | Sum of squared selected-pool TVL shares |
| Median volume / TVL | {summary['median_volume_tvl_24h']:.6f} | Trailing-24h volume / current TVL; positive TVL only |
| Median fees / TVL | {summary['median_fees_tvl_24h']:.8f} ({summary['median_fees_tvl_24h']*100:.6f}%) | Trailing-24h API fees / current TVL; neither APR nor LP profit |
| Age range | {summary['age_range_days'][0]:.3f}–{summary['age_range_days'][1]:.1f} days | Millisecond interpretation, excluding 15 invalid zero dates |
| Bin steps | {len(summary['bin_steps'])} values, {min(summary['bin_steps'])}–{max(summary['bin_steps'])} | Source pool configuration |

Token categories use mint allowlists, not potentially spoofed symbols: {summary['categories']}. These are pair categories, not verified meme/LST/blue-chip classifications. SOL has nine decimals and other token decimals were checked independently on-chain.

| Relationship | Spearman rho | n |
|---|---:|---:|
'''
    for name,r in summary['correlations'].items(): statistics_text+=f"| {name} | {r['spearman']:.4f} | {r['n']} |\n"
    statistics_text+=f'''
Excluding blacklisted/zero-TVL pools leaves {summary['positive_tvl_nonblacklisted_pools']} pools; age correlations use 236 with valid creation timestamps: volume rho {summary['clean_subset_correlations']['age_days_ms_interpretation__volume_24h_api']['spearman']:.4f}, fees rho {summary['clean_subset_correlations']['age_days_ms_interpretation__fees_24h_api']['spearman']:.4f}. These are associations in deliberately age/volume-selected bands; **not causal age effects** or out-of-sample signals. Strong volume-fee correlation is mechanically plausible and says nothing about LP net returns.

Daily volatility is the sample standard deviation of log close-to-close changes, using only consecutive positive-price completed-day candles. CSV includes values for 14 pools, one flat and one valuation/age-flagged; the 12 without pool-level quality flags range from {min(stable_prices):.6f} to {max(stable_prices):.6f}. These are source-series estimates, not independently verified realized market volatility. {len(flat)} series was flagged flat. A single candle is insufficient to assess flatness or volatility. Missing candles are never replaced with zero returns. Within-bin liquidity concentration was not collected.

## Estimates, hypotheses and missing evidence

Inventory valuation and pair-price checks support a USD-like interpretation of some source fields but do not establish reliable universal USD accounting. See DATA_QUALITY_REPORT.md: {counts['inventory_valuation_diff_gt_5pct']} pools differ by more than 5% on inventory valuation. Source-valued event USD amounts are estimates from Meteora, not observed on-chain dollars. No historical execution-cost model or historical swaps were inferred from live data.

Hypothesis: high activity and high fee generation may coexist with inventory losses. It remains untested here because no complete LP net return exists. No product idea is selected or ranked.

## Infrastructure and operational results

External service spend: **$0**. Used unauthenticated Meteora and public mainnet RPC plus local DuckDB/Parquet. Local storage, CPU and network were not metered. No paid service, new account, live trade or deployment was used. Provider comparison and indicative costs are in WALLET_DISCOVERY_COMPARISON.md; backfill operating cost remains unknown.

The original four tests are retained, with new precision, coverage, deduplication and saved-chain replay tests. Run `.venv/Scripts/python -m pytest -q` for final verification. The sparse transaction-wide scan encountered RPC version-1 responses; the collector now adapts only to that explicit server error. A transient Windows file replacement error interrupted the exploratory transaction scan after 58 lookups; atomic writes now use unique temporary files and bounded retries. The filtered-account proof completed with no recorded errors. Full historical scan/resume is still future work.

## Recommended next experiment

Freeze a short historical slot interval and enumerate **both position creation and closure**, independent of current account existence. Reconcile 10 closed positions end-to-end against token transfers, fee/reward alias handling, rebalances and historical valuation. In parallel, reconcile the 5%-plus valuation outliers and flat/missing candles against swaps/reserve balances. Only then estimate LP loss frequency or compare the four opportunities. Current evidence supports data-quality and coverage work, not a product decision.
'''
    Path('PHASE2_FINDINGS.md').write_text(statistics_text,encoding='utf-8')
    quality_text=f'''# Data quality report — 2026-10-19

## Validation results

| Check | Actual result | Interpretation |
|---|---|---|
| Official pool and historical response schemas | All 59 initial pool/history responses valid; 20 position histories also validated | Shape validation only |
| Unique cohort addresses | {len(rows)}; 54 repeated stratum memberships merged | Live queries are not slot-consistent |
| Base58 addresses | No invalid pool or mint address flagged | 32-byte encoding check, not account existence |
| Pool accounts | {sum(x['program_owner_matches'] for x in accounts['pool_accounts'])}/{len(accounts['pool_accounts'])} owned by official DLMM program | Independently queried at finalized slots |
| Unique mint decimal checks | {sum(x['matches'] for x in accounts['mint_accounts'])}/{len(accounts['mint_accounts'])} match API | On-chain jsonParsed mint data, source decimals retained |
| Creation timestamps | {counts['implausible_created_at_ms']} invalid zero values | Millisecond interpretation gives plausible dates for 261 pools; invalid ages null/excluded |
| Inventory × API token-price versus API TVL | {counts['inventory_valuation_diff_gt_5pct']} of 251 positive-TVL pools differ >5% | Price freshness, unit semantics or reserve valuation unresolved; do not reconcile by force |
| Pool-level quality flags | {len(quality)} of {len(rows)} | Overlapping concerns; flagged observations are not automatically discarded |
| Historical candles | {sum(x['rows'] for x in candle)} raw rows, {sum(x['missing_daily_rows'] for x in candle)} missing completed pool-days | Empty/partial coverage explicitly recorded |
| Historical volume/fees | {sum(x['rows'] for x in volume)} raw rows; no missing grid timestamps | Some rows may be zero-padding; presence is not proof of source coverage |
| Daily timestamp ordering/duplicates/OHLC constraints | {dict(issue_counts)} | Flat flags are quality concerns, not necessarily API errors |
| Volume rows entirely before valid pool creation date | {precreation}; {precreation_nonzero} nonzero | These are zero-padded grid rows, not observed trading days |
| History/API errors | {len(summary['errors'])} in historical run | No evidence of universal retention guarantees |
| Complete LP net P&L | {complete}/{len(positions)} | Incomplete lifetime/inventory/cost data suppresses profit estimates |

## Financial unit interpretation

Verified chain units: SPL amounts are atomic u64 integers, scaled by on-chain mint decimals. `finance.token_units` uses Decimal, rejects floats, nonintegral/negative/out-of-range amounts and invalid decimals. Event decoder retains raw integer amounts as strings. Exact Decimal source-USD cash-flow accounting is tested; financial calculations do not use binary floats. Pool aggregates and descriptive statistics remain API floating-point observations.

The pool OpenAPI describes TVL, pair price and metric windows but does not specify every currency/price orientation in its types. Source token prices around one for known stable mints, inventory checks and pair-price/token-price-ratio comparisons are evidence for USD-like valuation, not proof of consistency. CSV includes both relative-error diagnostics. Trading volume and fees are reported in **API valuation units** pending reconciliation. Current-price orientation is a hypothesis checked against X/Y source token-price ratios, not silently inverted. Fees are never treated as net profit.

`created_at` is preserved raw; 261 nonzero pool timestamps are plausible after /1000, while seconds interpretation is implausible. Historical query bounds and series timestamps use seconds; timestamp_str is checked against timestamp. `observed_at` is retrieval time, not block time. A 30-day requested horizon is not a claim of maximum API retention.

## Missing data and bias

- Historical TVL: no documented pool-series endpoint; only real phase-1/phase-2 snapshot observations exported. No volume-based TVL proxy.
- Price coverage: gaps, empty series and flat prices; no forward fill, interpolation or zero-return substitution. Source freshness needs swap-level validation.
- Historical liquidity per bin, range occupancy, complete ownership changes and all closed positions remain unavailable in this cohort.
- Current PositionV2 scans exclude already closed accounts and non-PositionV2 formats; high-TVL pool and lexicographic owner selection further bias this proof.
- ClaimFee/ClaimFee2 and ClaimReward/ClaimReward2 compatibility events remain distinct in raw decoding. Do not sum both. The prototype uses the API's event list rather than summing raw aliases; full event-semantic reconciliation is not implemented.
- Account states, pool snapshots and histories are observed at different slots/times; discrepancies can reflect asynchronous updates.
- No P&L, volatility-alpha or copytrading profitability claims are justified by this dataset.

## Audit and reproducibility

API request parameters, retrieval times, status, response SHA256 and schema SHA256 accompany raw bodies under `data/phase2/api`. RPC request bodies, statuses, timestamps, body hashes and raw responses are under `data/phase2/rpc`. `audit_manifest.json` verifies API body hashes. Published IDL is saved at `data/evidence/dlmm-idl.json`; the exact snapshot, not a moving remote file, drives decoding.

`plan.json` freezes selection and historical dates before outcomes are calculated. Re-running revalidates cached bodies and reproduces outputs without silently refreshing market observations. Use a new output directory for a fresh study. A cache is not a fresh API observation. The original stage-1 database and collector are preserved.
'''
    Path('DATA_QUALITY_REPORT.md').write_text(quality_text,encoding='utf-8')
    print(f'Reports generated: {len(rows)} pools, {len(linked)} verified owners, {complete} complete P&Ls')


if __name__=='__main__':
    import argparse
    parser=argparse.ArgumentParser();parser.add_argument('--output',type=Path,default=Path('data/phase2'));args=parser.parse_args();generate(args.output)
