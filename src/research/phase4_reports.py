"""Produce phase-4 reports from actual archived observations and explicit gates."""
import csv
import hashlib
import json
from collections import Counter
from datetime import datetime,timezone
from pathlib import Path

from research.collector import atomic_json
from research.historical_prices import select_asof


def utc(value):return datetime.fromtimestamp(value,timezone.utc).isoformat() if value is not None else 'unavailable'


def generate(root=Path('data/phase4')):
    root=Path(root);data=json.loads((root/'usd_analysis.json').read_text());positions=data['positions'];policy=data['policy'];observations=[]
    for r in positions:
        for q in r['strict']['quotes']:
            p=q['price_observation'];observations.append({'position':r['position'],'purpose':q['kind'],'mint':q['mint'],'event_time_utc':utc(q['time']),'signature':q['signature'],'price':p.get('price'),'source':p.get('source'),'sample_time_utc':utc(p.get('timestamp')),'age_seconds':p.get('age_seconds'),'quality':p['quality'],'usable_strict':p['usable'],'source_url':p.get('source_url'),'response_sha256':p.get('response_sha256')})
        for mint in sorted({f['mint'] for f in r['flows'] if f['kind']=='deposit'}):
            p=select_asof(r['price_series'].get(mint,[]),r['closure_time'],policy['strict_max_age_seconds'])
            observations.append({'position':r['position'],'purpose':'hold_terminal_mark','mint':mint,'event_time_utc':utc(r['closure_time']),'signature':r['closure_signature'],'price':p.get('price'),'source':p.get('source'),'sample_time_utc':utc(p.get('timestamp')),'age_seconds':p.get('age_seconds'),'quality':p['quality'],'usable_strict':p['usable'],'source_url':p.get('source_url'),'response_sha256':p.get('response_sha256')})
    with (root/'price_observations.csv').open('w',encoding='utf-8',newline='') as f:
        writer=csv.DictWriter(f,fieldnames=list(observations[0]));writer.writeheader();writer.writerows(observations)
    verified=sum(r['verified'] for r in positions);chain=sum(r['chain_history_complete'] for r in positions);costs=sum(r['independent_verification']['complete'] for r in positions)
    quality=Counter(o['quality'] for o in observations);txs={t['signature'] for r in positions for t in r['independent_verification']['transactions']};day_keys={(mint,int(p['timestamp'])//86400) for r in positions for mint,points in r['price_series'].items() for p in points}
    ages=[o['age_seconds'] for o in observations if o['age_seconds'] is not None]
    manifest=[];method_counts=Counter();body_bytes=0;price_requests=0
    for meta_path in root.rglob('*.meta.json'):
        body=meta_path.with_name(meta_path.name.replace('.meta.json','.json'))
        if not body.exists():continue
        meta=json.loads(meta_path.read_text());digest=hashlib.sha256(body.read_bytes()).hexdigest()
        if meta.get('sha256')!=digest:raise ValueError(f'Hash mismatch: {body}')
        manifest.append({'path':str(body),'sha256':digest,'status':meta.get('status')});body_bytes+=body.stat().st_size
        request=body.with_suffix('.request.json')
        if request.exists():method_counts[json.loads(request.read_text())['method']]+=1
        if 'prices_raw' in body.parts:price_requests+=1
    atomic_json(root/'audit_manifest.json',{'responses':manifest,'body_bytes':body_bytes,'rpc_methods':dict(method_counts)})
    summary={'funded_sol_usdc_positions':sum(r['funded'] for r in positions),'closed_chain_reconciliations':chain,'independent_cost_and_balance_reconciliations':costs,'verified_usd_pnls':verified,'verified_hold_benchmarks':verified,'coarse_unverified_sensitivities':sum(r['coarse_sensitivity']['available'] for r in positions),'cashflow_and_cost_price_references':sum(len(r['strict']['quotes']) for r in positions),'all_references_including_hold_marks':len(observations),'strict_usable_references':sum(o['usable_strict'] for o in observations),'price_quality_counts':dict(quality),'price_age_min_seconds':min(ages) if ages else None,'price_age_max_seconds':max(ages) if ages else None,'unique_lifecycle_transactions':len(txs),'price_cache_requests':price_requests,'rpc_methods':dict(method_counts),'external_spend_usd':0,'final_price_errors':data['errors']}
    atomic_json(root/'phase4_summary.json',summary)
    coverage=f'''# Historical price coverage — 2026-10-19

## Actual coverage gates

| Measure | Result |
|---|---:|
| Funded, genuinely closed SOL/USDC positions | {len(positions)} |
| Creation/closure and token-flow reconciliation | {chain} |
| Independent owner balances / observed costs reconciled | {costs} |
| Cash-flow and cost price references | {summary['cashflow_and_cost_price_references']} |
| Total references including hold terminal marks | {len(observations)} |
| References passing nonfuture <=60-second policy | {summary['strict_usable_references']} |
| Verified USD P&L / hold benchmarks | {verified} / {verified} |
| Unverified <=3600-second sensitivities available | {summary['coarse_unverified_sensitivities']} |

Quality counts: {dict(quality)}. Observed sample ages range {summary['price_age_min_seconds']}–{summary['price_age_max_seconds']} seconds. These are source sample ages relative to events, not retrieval lag. `data/phase4/price_observations.csv` lists **every** selected cash-flow, cost and terminal benchmark mark with source, timestamp, age, quality and response hash.

## Position-level coverage

| Position | Lifetime UTC | Strict price gaps | Cost/balance verification | USD status |
|---|---|---:|---|---|
'''
    for r in positions:coverage+=f"| [{r['position']}](https://solscan.io/account/{r['position']}) | {utc(r['creation_time'])} to {utc(r['closure_time'])} | {len(r['strict']['missing'])} | {r['independent_verification']['complete']}: {', '.join(r['independent_verification']['issues']) or 'passed'} | {r['status']} |\n"
    coverage+='''
## Interpretation and missing data

CoinGecko historical observations were actually fetched for both SOL/USD and USDC/USD. Older daily windows returned hourly observations. The initial current-day probe returned a five-minute grid. Neither supports arbitrary second-level prices. Two transient 429 responses were retained and retried at a lower request rate; final request errors are recorded in the summary. A successful grid response is not a promise of fine-grained coverage.

The estimator selects only an actual observation at or before the event. It never interpolates, backfills a missing sample from the future, assumes USDC=$1, or uses current prices. Empty `net_usd_pnl` and verified hold fields in the CSVs mean **unavailable**, not zero. Hourly sensitivity columns are explicitly unverified and do not meet the mission's profitability gate.

Pyth historical range returned 401; GeckoTerminal public OHLCV returned 403; the CoinGecko Onchain minute endpoint returned 401. Birdeye's catalog confirms a historical-by-Unix product, but its linked detailed schema was inaccessible without account access. Therefore no fabricated Birdeye request or timestamp was used.

For future minute OHLCV ingestion, a bar's close is known only at the end of its interval; treating its opening timestamp as the close's observation time would introduce look-ahead. The current implemented adapters use provider sample/update times directly.
'''
    Path('PRICE_COVERAGE_REPORT.md').write_text(coverage,encoding='utf-8')
    findings=f'''# Phase 4 findings — 2026-10-19

**The target of three verified USD P&Ls is not achieved.** Implemented and executed historical-price ingestion, SOL/USDC closed-position discovery, independent balance/cost checks, exact USD cash-flow accounting and a capital-matched hold benchmark. Outputs preserve all failed verification gates.

## Actual results

- **{len(positions)} funded SOL/USDC positions** verified closed and reconstructed. The original phase-3 cohort contains no funded SOL/USDC position, so this is an additional cohort.
- **{chain}** pass creation-to-closure and event/SPL-flow reconciliation; **{costs}** also pass independent reserve pre/post balance, owner USDC balance, owner native+wrapped-SOL wealth and observable-cost checks.
- **{verified} verified historical USD P&Ls and {verified} verified hold benchmarks.** Historical price samples fail the frozen 60-second freshness policy. Residual cost gaps independently prevent verification where present.
- **{summary['coarse_unverified_sensitivities']} unverified hourly-price sensitivities** are calculated from real historical observations. They are not final profitability findings.
- **$0 external service spend**. No subscription, key purchase, custody, live trading, frontend or product selection.

## Cohort and integrity

Initial known phase-3 owners had no SOL/USDC portfolio matches. A current-position scan of the highest phase-2-TVL SOL/USDC pool supplied a sorted owner list; known-owner closed-position API results supplied candidates. Creation and closure were then verified independently through successful finalized transactions and zero post-closure position lamports. First all-date candidates included 2025 closures; those exploratory artifacts remain as `lifecycles_all_dates.json` and `solusdc_discovery_all_dates.json`. A frozen last-30-day **closure** cutoff then enrolled the current six, without using their P&L or price-coverage outcomes. Creation can precede the closure window. This is a convenience sample with current-owner survivorship bias, not a representative LP cohort.

## Exact accounting and comparable hold policy

Deposits, withdrawals, canonical fee claims and rebalances are separate token cash flows, scaled by observed mint decimals. Compatibility fee aliases are not doubled; embedded composition fees are not charged again as separate transfers. Rewards require historical mint attribution; none are invented. Every cash flow retains its transaction signature and timestamp.

Independent verification reads actual transaction pre/post reserve balances rather than merely trusting event values or Meteora P&L. It also checks the owner's USDC inventory change. Native SOL wealth combines owner native balance, controlled wrapped-SOL accounts (including their recoverable rent), other controlled token-account rent, and position rent; wrapped SOL is not counted a second time. `meta.fee` is an observed network cost. Explicit external System Program transfers from the owner that exactly explain a native residual are recorded as **observed external native transaction payments**, without guessing that they are tips. Unexplained residuals and third-party fee payers block verification. Failed transactions in the retrieved lifecycle slot span are included when present. External hedges, payments outside this position history and off-chain charges are not assumed covered.

The hold counterfactual keeps each actual externally funded token lot until position closure. Additional deposits add exactly their original token quantities at their actual funding times. Withdrawals and fees never create benchmark inventory. LP distributions are valued at receipt and carried as a zero-interest USD accounting cash balance; this is a **mark-to-market convention**, not evidence an actual USD swap occurred. Hold incurs no LP network fees because it never enters LP. Recoverable rent is collateral, not an operating expense. The comparison excludes interest, execution slippage on hypothetical USD conversion, external hedges and opportunity cost of locked rent; it is not total-wallet NAV or an executable liquidation strategy.

All arithmetic after price parsing uses Decimal; original response bytes preserve price evidence. `net_usd_pnl` and hold benchmark columns are populated only if history, costs and all strict price gates pass. A separate one-hour sensitivity remains labeled unverified even when its arithmetic is complete.

## Real hourly sensitivity outputs — not verified profitability

| Position | LP P&L sensitivity USD | Hold P&L sensitivity USD | Excess vs hold USD | Status |
|---|---:|---:|---:|---|
'''
    for r in positions:
        c=r['coarse_sensitivity'];findings+=f"| [{r['position']}](https://solscan.io/tx/{r['closure_signature']}) | {c['net_usd_pnl'] if c['available'] else 'unavailable'} | {c['hold_pnl_usd'] if c['available'] else 'unavailable'} | {c['excess_vs_hold_usd'] if c['available'] else 'unavailable'} | unverified: coarse prices and any unresolved cost residuals |\n"
    findings+=f'''
## Precisely what blocks three verified results

1. **Price freshness:** actual historical SOL/USD and USDC/USD samples are too old for the frozen 60-second policy; {summary['strict_usable_references']}/{len(observations)} references pass. Current prices and USDC pegs cannot repair this.
2. **Access:** Pyth historical API requires a key (401); GeckoTerminal returned an access challenge (403); CoinGecko's minute Onchain route requires authentication (401). The public CoinGecko historical endpoint works but its hourly samples do not solve the freshness gap.
3. **Costs:** {len(positions)-costs} positions retain unresolved native-SOL residuals; these must be explained from transaction instructions/account control, not classified as fees by assumption.

Cheapest potential fix is **$0**: restore ordinary permitted GeckoTerminal public API access and verify completed minute USD bars for both mints. This is not established to work from the current environment. The lowest reviewed listed paid candidate is **Birdeye Lite at $39/month**, subject to confirming that historical-by-Unix access and actual price timestamps are included; a purchase would be premature without that confirmation. CoinGecko Basic at $35/month extends retention but does not establish minute history. Pyth currently lists API-access Starter at $500/month. See HISTORICAL_PRICE_SOURCES.md for current primary sources and entitlement caveats. No money was spent.

## Can this scale to 1,000 positions?

Not as verified profitability yet: reliable timestamped prices and cost attribution are unresolved. The sample has **{len(txs)} unique lifecycle transactions**, approximately **{len(txs)/max(1,len(positions)):.2f} per position**. A workload with the same transaction density would need roughly **{round(len(txs)/max(1,len(positions))*1000):,} transaction bodies plus about 1,000 signature-history requests**, before discovery, retries and long-lived outliers. This is a directional extrapolation, not a provider quote or throughput benchmark.

Price ingestion can be shared across positions: SOL and USDC over 30 daily windows require about **60 day-range requests** for coarse CoinGecko history, independent of position count. Fine-grained data has different pagination/retention/entitlement costs; those are unverified. Deduplicate prices by asset/time and transactions by signature; use bounded retries, durable per-provider checkpoints, source licensing checks and explicit failure budgets. Current code is a local single-writer research pipeline, not a production 1,000-position service. Current-owner discovery is also unsuitable for an unbiased 1,000-position performance study; move back to fixed-slot creation/closure enumeration.

## Reproduction and evidence

`POSITION_USD_PNL.csv` and `HOLD_BENCHMARKS.csv` contain six real rows with blank verified outputs where unavailable. Full quotes, source URLs/hashes, policy, costs, signatures and independent checks are in `data/phase4/usd_analysis.json`; per-reference coverage is in `data/phase4/price_observations.csv`. `audit_manifest.json` verifies archived response bytes. Source current/older probe outcomes and historical API failures are retained. Run the commands in README.md and pytest. Synthetic edge-case tests are labeled separately from real-data replay.
'''
    Path('PHASE4_FINDINGS.md').write_text(findings,encoding='utf-8')
    print(json.dumps(summary,indent=2))


if __name__=='__main__':generate()
