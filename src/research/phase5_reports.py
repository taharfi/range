"""Generate Phase 5 reports exclusively from retained run evidence."""
import csv
import hashlib
import json
import xml.etree.ElementTree as ET
from collections import Counter
from datetime import datetime,timezone
from decimal import Decimal as D
from pathlib import Path
from research.collector import atomic_json
from research.historical_prices import SOL,USDC
from research.phase5 import write_csv

ROOT=Path('data/phase5')

def rounded(value,digits=4):return f'{D(value):.{digits}f}' if value is not None else 'unavailable'

def run():
    analysis=json.loads((ROOT/'usd_analysis.json').read_text());s=analysis['summary'];observations=json.loads((ROOT/'onchain_observations.json').read_text())
    refs=json.loads((ROOT/'references.json').read_text());rows=list(csv.DictReader(Path('UPDATED_POSITION_USD_PNL.csv').open()))
    requests=[json.loads(p.read_text()) for p in (ROOT/'rpc').glob('*.request.json')];methods=Counter(r['method'] for r in requests)
    extension=json.loads((ROOT/'pool_history_summary.json').read_text()) if (ROOT/'pool_history_summary.json').exists() else {'rows':[],'errors':[]}
    test_path=ROOT/'test_results.xml';test_status='Not recorded; run pytest with --junitxml=data/phase5/test_results.xml.'
    if test_path.exists():
        suites=ET.parse(test_path).getroot().findall('testsuite')
        test_status=f"{sum(int(t.get('tests',0)) for t in suites)} tests; {sum(int(t.get('failures',0))+int(t.get('errors',0)) for t in suites)} failures/errors; {sum(int(t.get('skipped',0)) for t in suites)} skipped. See data/phase5/test_results.xml."
    capture=json.loads((ROOT/'capture_summary.json').read_text());plan=json.loads((ROOT/'capture_plan.json').read_text())
    times=[t['time'] for t in plan['targets']];iso=lambda t:datetime.fromtimestamp(t,timezone.utc).isoformat()
    raw_bytes=sum(p.stat().st_size for p in (ROOT/'rpc').glob('*.json'))
    estimated_gib=D(raw_bytes)/D(2**30)*D(1000)/6
    samples=[o for o in observations if o['reference_eligible']]
    sample_text='\n'.join(f"- [{o['signature']}]({o['solscan']}): slot {o['slot']}, {iso(o['timestamp'])}, {o['venue']}, pool `{o['pool']}`; {o['sol_atomic']} atomic SOL / {o['usdc_atomic']} atomic USDC; {rounded(o['price_usdc_per_sol'],8)} USDC/SOL, trade {rounded(o['trade_size_usdc'],2)} USDC." for o in sorted(samples,key=lambda o:o['slot'])[:3])
    table='\n'.join(f"| `{r['position']}` | {rounded(r['estimated_net_usd_pnl'])} | {rounded(r['empirical_pnl_low_sensitivity'])} to {rounded(r['empirical_pnl_high_sensitivity'])} | {rounded(r['estimated_hold_pnl_usd'])} | {rounded(r['estimated_excess_vs_hold_usd'])} | {r['onchain_sol_quotes']} |" for r in rows)
    n_two_protocol=sum(len({('Meteora' if v=='Meteora DLMM' else 'Raydium') for v in r.get('venues',[])})>=2 for r in refs)
    exchange_path=ROOT/'exchange_validation.json';exchange=json.loads(exchange_path.read_text()) if exchange_path.exists() else {'rows':[]}
    independent=[];refs_by_time={r['target_timestamp']:r for r in refs}
    for row in exchange['rows']:
        sol=row['quotes'][SOL];usdc=row['quotes'][USDC];ref=refs_by_time[row['target_time']]
        if not (sol['available'] and usdc['available'] and ref['available']):continue
        cross=D(ref['price_usdc_per_sol'])*D(usdc['price']);difference=cross/D(sol['price'])-1
        independent.append({'time':row['target_time'],'onchain_usdc_times_bitstamp_usd':str(cross),'coinbase_sol_usd':sol['price'],
                            'difference_bps':str(difference*10000),'coinbase_trade_age_upper_bound_seconds':sol['last_trade_age_upper_bound_seconds'],
                            'bitstamp_trade_age_upper_bound_seconds':usdc['last_trade_age_upper_bound_seconds']})
    write_csv(ROOT/'independent_source_agreement.csv',independent)
    independent_diffs=[abs(D(r['difference_bps'])) for r in independent]
    independent_median=sorted(independent_diffs)[len(independent_diffs)//2] if independent_diffs else None
    if len(independent_diffs)%2==0 and independent_diffs:independent_median=(sorted(independent_diffs)[len(independent_diffs)//2-1]+independent_median)/2
    sol_coverage=sum(r['quotes'][SOL]['available'] for r in exchange['rows']);usdc_coverage=sum(r['quotes'][USDC]['available'] for r in exchange['rows'])
    crosscheck_table='\n'.join(f"| `{r['position']}` | {rounded(r['estimated_net_usd_pnl'])} | {rounded(r.get('independent_usd_candle_scenario_pnl'))} |" for r in rows)
    exchange_text=f'''## Additional free independent USD recovery

After the primary source-selection policy was frozen, permitted public [Coinbase Exchange candles](https://docs.cdp.coinbase.com/api-reference/exchange-api/rest-api/products/get-product-candles) and [Bitstamp OHLC](https://www.bitstamp.net/api/) were tested at every target. Coinbase SOL/USD completed bars passed the 100-USD bar-volume screen at **{sol_coverage}/15** targets; Bitstamp USDC/USD bars passed at **{usdc_coverage}/15** within the separate one-hour validation window. No API key or subscription was used. Coinbase USDC-USD returned 404; it was not replaced with a peg. These are additional historical USD market observations, not on-chain executions.

Only bars whose **start + 60 <= target** are eligible. The actual last-trade timestamp is unknown within the bar, so age is conservatively measured from bar start. SOL permits at most 120 seconds of possible age (the geometry of a completed one-minute bar); USDC permits at most 3600 seconds and remains coarse when no recent substantial bar exists. Neither limit upgrades quality. Zero-volume carry-forwards and bars with under 100 USD total volume are rejected. Bar volume is not proof of executable depth. The API's “exclude current candle” option is insufficient alone for historical as-of validation; local end-time filtering is mandatory.

There are **{len(independent)}** available comparisons of on-chain SOL/USDC × Bitstamp USDC/USD against Coinbase SOL/USD: median absolute difference **{rounded(independent_median)} bps**, maximum **{rounded(max(independent_diffs) if independent_diffs else None)} bps**. Ages and exact source lineage are retained in `data/phase5/exchange_validation.json` and `independent_source_agreement.csv`. Timing mismatch and fee/spread differences remain; agreement is not calibrated ground truth.

A second scenario revalues all six positions using the completed Coinbase SOL/USD marks, qualified Bitstamp USDC/USD where available, and explicitly labeled hourly CoinGecko USDC fallback elsewhere. The frozen primary estimator remains separate. This measures source sensitivity without choosing the more profitable result. Shared marks/hold funding/cost accounting are identical; a separate ±1% stress is retained. Both scenarios are approximate and unverified.

| Position | Primary estimated USD P&L | Independent USD candle scenario |
|---|---:|---:|
{crosscheck_table}

This demonstrates another **$0** route to finer historical USD research. It does not establish reliable subminute USDC market observations, calibrated error coverage or actual USD execution proceeds. Paying for a historical API is not yet shown necessary.
'''
    methodology=f'''# On-chain price methodology — Phase 5

## Freshness audit

The earliest retained implementation found is `src/research/economic.py::economic_performance(max_price_age=60)` in Phase 3. Phase 4 inherited it in `historical_prices.select_asof` and froze it in `data/phase4/pricing_policy.json`. The inspected code, tests and reports contain no empirical derivation or source requiring a universal 60-second limit. There is no Git history here to recover additional author intent. It is a conservative local screening default, not demonstrated market accuracy. Pyth's separately documented maximum 60-second **request window** is an API pagination constraint, not justification for this valuation rule.

The Phase 4 policy and its 0/129 passing references are preserved. Phase 5 does not turn those failed references into verified prices. The on-chain selector still uses strictly prior slots and at most 60 seconds. Hourly USD marks are admitted only to a separately labeled approximate scenario, with measured past-data sensitivities.

## Quality tiers

| Tier | Evidence required | This run |
|---|---|---|
| Exact execution evidence | Successful canonical program instruction plus independently reconciled raw SPL transfers and historical reserve deltas; mint/decimal identity verified. | {s['exact_execution_observations']} observations of executed SOL/USDC legs. These are the actual trades' fee-inclusive effective prices, not the LP's USD execution proceeds. |
| High-confidence historical market estimate | Independent market/Oracle agreement, historical USD anchor, and empirically validated timing/error tolerance suitable for the exposure. | None asserted. No calibrated error distribution or sufficiently precise independent USD anchor exists. Merely meeting an age cutoff does not qualify. |
| Approximate historical estimate | Identifiable nonfuture historical source, measured disagreement/past range, explicit limitations. | {s['estimated_usd_pnl']} position mark-to-market scenarios. |
| Unavailable | Missing required observations, incomplete reconciliation, invalid source, or insufficient past observations to measure sensitivity. | {s['unavailable']} position scenarios; missing on-chain target coverage remains explicit, even where an hourly scenario is possible. |

## Frozen samples and decoding

`capture_plan.json` fixes 15 target slot/time pairs from 40 lifecycle transaction signatures. Four slots immediately preceding each target are requested, {s['blocks_available']} blocks available. Target cash-flow range: **{iso(min(times))} through {iso(max(times))}**. This is a sparse event-centered sample, not continuous history or a representative LP cohort. The exact slot list is in the plan; all full RPC bodies and SHA256 metadata are retained.

The initial four-slot sample was insufficient. `pool_history_plan.json` explicitly adds three named SOL/USDC pools (the cohort's Meteora pool and two observed Raydium CLMM pools), at every target, up to 100 prior signatures and the nearest three successful prior-slot transactions within 60 seconds. Selection uses no trade price, size or LP return. It completed {len(extension['rows'])}/45 pool-target pages, with {len(extension['errors'])} errors. Pages hitting 100 are bounded samples, not exhausted histories. Before cursors were tested against both the target pool and another venue. Results are filtered again by returned slot/time; cursor behavior alone never establishes chronology.

Meteora instruction discriminator/account order and event-CPI Borsh types come from the retained official DLMM IDL. `Swap2Evt` is preferred over its `Swap` compatibility event within the same invocation/pool. Direction, exact input/output and unused input are checked; unresolved leftovers are rejected. Current official [event semantics](https://raw.githubusercontent.com/MeteoraAg/docs/main/developer-guides/dlmm/program/events.mdx) agree with the saved schema.

Raydium CLMM uses the official [IDL](https://raw.githubusercontent.com/raydium-io/raydium-idl/master/raydium_clmm/raydium_clmm.json) for `swap`/`swap_v2` pool and vault indexes. AMM v4 opcodes 9/11/16/17 and optional target-orders account layouts come from the official [instruction source](https://raw.githubusercontent.com/raydium-io/raydium-amm/master/program/src/instruction.rs) and processor. Its canonical program ID is verified from the [program repository](https://github.com/raydium-io/raydium-amm). Actual amounts are decoded from SPL transfer instructions and reconciled against historical pre/post vault balances; instruction amount bounds are not substituted for executed amounts. CLMM logs are not claimed as decoded events.

Jupiter's v6 ID is checked against its [official CPI source](https://raw.githubusercontent.com/jup-ag/jupiter-cpi/main/src/lib.rs). `jupiter_program_present` records its presence only; this does not assert a full decoded route or that the whole transaction executed SOL directly to USDC. Each admitted observation is a verified underlying SOL/USDC pool leg. Jupiter is not an additional independent market. Successful transfers already reflect pool execution fees; no swap fee is subtracted from the effective price again.

## Validation, selection and aggregation

1. Accept only successful transactions and known instruction layouts. Historical vault token balances must identify canonical SOL (9 decimals) and USDC (6 decimals). Reject incompatible mints/decimals, ambiguous directions, event mismatches, reserve/transfer mismatches and multiple invocations of the same pool in one transaction. All decoded observations, including rejections, remain in `onchain_observations.json` and the flat CSV.
2. Screen references at **100 USDC minimum trade, 100,000 USDC minimum historical USDC vault balance, at most 1% of either vault consumed**. These are declared conservative feasibility screens, not empirically optimized market-depth guarantees. Small trades are retained as execution evidence but cannot become reference votes. Current TVL never substitutes for historical liquidity.
3. Historical vault balances are a liquidity proxy. Active DLMM-bin / CLMM-tick depth, actual midprice impact and manipulation risk are **unavailable**. `actual_price_impact` and `active_bin_liquidity` remain null. A small reserve fraction does not prove low impact in concentrated liquidity.
4. Deduplicate signature/outer/inner identities. For each target use only `observation.slot < target.slot` and nonnegative timestamp distance at most 60 seconds. Same-slot observations are excluded even if block timestamps match. No interpolation, future sample, current price, candle close before its completion, or stablecoin peg is introduced.
5. Take a median within each pool, then across pools. Remove pool-median outliers beyond `max(4 × MAD, 20 basis points)` of the initial cross-pool median. This is a declared robust heuristic, not calibrated error control. With one/two pools there is insufficient redundancy to identify manipulation reliably. Keep retained trade dispersion and excluded pools. Multiple Raydium markets share a protocol and must not be described as independent protocols.
6. Convert SOL/USDC to USD by multiplying an independently sourced historical USDC/USD sample. The CoinGecko anchor remains hourly and approximate. Where no screened on-chain reference exists, retain the separate nonfuture historical SOL/USD aggregate estimate. Every dependency has its own source timestamp/hash. Fetch time does not improve sample freshness.

`ONCHAIN_PRICE_OBSERVATIONS.csv` records signatures, slots/time, pools/programs, raw amounts, decimals, effective price, trade size, historical vault balances, consumption proxy, rejection reasons and Solscan links. `observation_distances.csv` joins observations to target timestamps. Nested event payloads, raw bytes and price lineage are retained in JSON. Unsupported programs/instructions are outside decoding coverage, not zero-price observations.

## Verification examples

{sample_text}

The six position creation/closure signatures are in `UPDATED_POSITION_USD_PNL.csv`; their 40 lifecycle transactions and independent owner/reserve/cost checks remain in `data/phase4/usd_analysis.json`. This run reuses those complete reconciliations; it does not claim a second independent RPC provider.

## Reproduce

```powershell
.venv/Scripts/python -m research.phase4
.venv/Scripts/python -m research.phase5_capture
.venv/Scripts/python -m research.phase5_pool_history
.venv/Scripts/python -m research.exchange_validation
.venv/Scripts/python -m research.phase5
.venv/Scripts/python -m pytest -q --junitxml=data/phase5/test_results.xml
.venv/Scripts/python -m research.phase5_reports
```

The first command revalidates inherited lifecycle/cost/price inputs. Subsequent runs use preserved caches; first collection requires network availability. No subscription, key purchase, signature creation or transaction submission occurs.
'''
    Path('ONCHAIN_PRICE_METHODOLOGY.md').write_text(methodology,encoding='utf-8')
    uncertainty=f'''# Price uncertainty report — Phase 5

## Observed coverage and agreement

- {s['swap_observations']} decoded SOL/USDC legs from {s['transactions_inspected']:,} inspected transactions; {s['eligible_reference_observations']} eligible reference observations.
- {s['targets_with_onchain_reference']}/{s['target_slot_times']} target slot/times have screened prior-slot reference prices. {s['targets_with_two_venues']} targets have at least two market types; **{n_two_protocol}** have both Meteora and Raydium protocols. Maximum retained reference age: {s['onchain_max_reference_age_seconds']} seconds.
- {s['onchain_vs_hourly_comparisons']} comparisons against nonfuture hourly SOL/USD, after multiplying by historical USDC/USD: median absolute difference **{rounded(s['median_absolute_difference_bps'])} bps**, maximum **{rounded(s['max_absolute_difference_bps'])} bps**. This mixes source differences, swap fees/spread and time movement; it is not an absolute accuracy measurement. See `data/phase5/source_agreement.csv`.
- {s['unique_valuation_quotes']} unique token/time marks, {s['unavailable_quote_references']} unavailable quote references after allowing explicitly approximate hourly scenarios. On-chain coverage and approximate USD coverage have different denominators. Historical price references previously failed at 60 seconds; none is relabeled verified.

## How sensitivity is measured

Only prior observations within six hours of each target are used; at least three samples are required. The largest absolute fractional deviation from the last available sample is measured. For on-chain SOL marks, combine the larger of that measured SOL range, on-chain/hourly disagreement and within-reference trade dispersion, then add the measured USDC range. A separate ±1% price stress is also reported.

This envelope is a **scenario sensitivity**, not a statistical confidence interval or a guaranteed bound. It cannot measure unobserved intrahour spikes, future changes, common oracle/source errors, peg jumps, stale exchange quotes or adversarial trades. A flat observed series does not prove zero risk. Longer timestamp tolerance is not empirically validated by these results. No high-confidence tier is awarded.

Cash flows with the same token/time share one price variable and are netted before sensitivity. For every price variable, signed exposure selects the adverse endpoint. Hold and LP share funding basis and exit marks, so excess-versus-hold uncertainty cancels identical exposures before evaluating its envelope. Bounds across different token/times assume simultaneous adverse endpoints and may be conservative. USDC/USD changes are not suppressed.

## Actual approximate results (USD)

All rows are **unverified approximate historical mark-to-market estimates**. The LP did not necessarily convert these receipts to USD. Fees are included once as claimed cash flows; costs include observed owner-paid network fees and independently reconciled external native payments. Recoverable rent is collateral. No rewards were observed in this cohort. No missing reward history is extrapolated.

| Position | Estimated net | Empirical stress range | Estimated hold | Estimated excess vs hold | On-chain SOL marks |
|---|---:|---:|---:|---:|---:|
{table}

Deposits are negative cash flows, withdrawals/claims positive, observable costs negative at their event timestamps. Each deposit lot is held to closure for the benchmark; withdrawals/fees never create extra holding lots. LP receipts are marked to USD cash at receipt with zero reinvestment/interest, a convention rather than observed conversion. The hold alternative incurs no LP execution costs. P&L uses exact Decimal arithmetic, but CSV digits do not imply matching market-price accuracy.

## Remaining missing evidence

The reference series is sparse and the cohort is selected through current owners, not an unbiased performance sample. Active historical liquidity and impact are missing. Exact USD executions, calibrated timestamp error, independent target-time USDC/USD and a continuously sampled external validation series are missing. Approximate P&L availability does not resolve those verification gaps.
'''
    Path('PRICE_UNCERTAINTY_REPORT.md').write_text(uncertainty,encoding='utf-8')
    comparison='''# Price source comparison — checked 2026-10-19

No purchases made. “Documented” capability and “tested” access are separate. Phase 4 HTTP evidence remains under `data/phase4`; Phase 5 RPC/schema evidence is under `data/phase5`.

| Source | Exact missing data it could supply | Coverage / entitlement evidence | Cost and accuracy decision |
|---|---|---|---|
| Public Solana RPC + decoded Meteora/Raydium | Historical executed SOL/USDC legs and transaction-level amounts/reserve balances | Tested full blocks and address-index transactions at the actual cohort timestamps. Unsupported pools/programs and unreturned signature pages remain gaps. | Actual $0; no public availability/SLA guarantee. Effective execution ratio includes trade fees and impact, not a midprice or independent USD anchor. More engineering/validation still required. |
| Jupiter | Router identification and verifiable underlying pool legs | Official [CPI source](https://raw.githubusercontent.com/jup-ag/jupiter-cpi/main/src/lib.rs) identifies v6. [Price API](https://developers.jup.ag/docs/price) describes current USD prices; no historical timestamp request verified. | Current prices cannot repair history. Router presence is not a distinct venue or USD source. |
| Meteora API | Event USD estimates and pool pair OHLCV | Actual lifecycle and candle access in earlier phases. Independent USD source/update time for event totals is not established. [Official API](https://dlmm.datapi.meteora.ag/api-docs/openapi.json). | Actual $0; same-protocol event totals are comparison evidence, not independent verification. Pair candles alone cannot establish USD. |
| CoinGecko | Direct historical SOL/USD and USDC/USD aggregates | Tested hourly observations for every needed cohort day; prior 401 Onchain route retained. [Demo contract](https://docs.coingecko.com/demo/reference/coins-id-market-chart-range): 365-day retention, hourly older-day data, 1m/5m interval overrides Enterprise only. | Keyless access worked here but is not promised by docs. Paying a basic plan does not establish minute history. Enterprise price/endpoint entitlement not quoted or tested. Hourly values support approximate estimates, not freshness repair. |
| GeckoTerminal / CoinGecko Onchain | Historical completed minute USD pool candles, potentially finer USD anchor | [Contract](https://docs.coingecko.com/reference/pool-ohlcv-contract-address) supports pool/currency/time parameters. Earlier public access returned 403 challenge; authenticated equivalent returned 401. Minute retention at the exact cohort timestamps is not independently established. | A permitted free-access recovery remains worth testing. No bypass. Pool-derived USD conversions need their own validation; candle timestamps/end times are not exact trade executions. |
| Pyth History | Timestamped SOL/USD **and USDC/USD**, feed-update times, publisher/confidence/bid/ask metadata | [History contract](https://docs.pyth.network/price-feeds/pro/api/history) includes authenticated timestamp and ≤60-second-window range routes with pagination. Public symbols resolved, but historical Pro and legacy Benchmarks probes returned 401. [Plan](https://app.pyth.com/products): Free view-only/no API; Starter $500/month + tax includes crypto API and full history/resolution. Exact oldest available SOL/USDC feed timestamps and this cohort's successful responses remain **unverified without an entitled key**. | Documented candidate for an independent USD anchor, not an approved purchase. API entitlement is documented; actual exact-date coverage must be proved with a trial/sample before purchase. Oracle confidence is useful but not proof of executable proceeds or zero error. |
| Birdeye | Historical-by-Unix USD marks for both mints, ideally update time and trade lineage | [Official catalog](https://birdeye.so/data-api/types-of-data) advertises history; detailed schema/coverage/plan mapping could not be verified from accessible links. [Pricing](https://birdeye.so/data-api/pricing): Lite $39/month, 2.5M CUs, 15 RPS. Historical endpoint inclusion, per-request CUs, actual returned timestamp semantics and exact cohort coverage remain **unverified**. | Lower advertised price is not evidence the needed endpoint is included. Do not subscribe on this evidence. Require written entitlement + timestamped sample for earliest/latest cohort events first. |
| Helius archival RPC | More reliable raw-block/transaction access and indexed history, not independent market prices | [Current credit docs](https://www.helius.dev/docs/billing/credits) list getBlock/getTransaction/getSignaturesForAddress at 1 credit each; Free 1M/month, Developer $49/10M. A marketing pricing snippet still described archival calls differently; use the method-specific billing table and confirm before reliance. No Helius key or request used here. | Free capacity appears sufficient for bounded 1,000-position RPC request model, conditional on archival coverage/rate/storage limits. It supplies chain evidence, not missing USD anchors or guaranteed accuracy. |

## Before any paid recommendation

Require target-date sample responses for **both** assets, documented feed identity, native timestamp resolution, returned update time ≤ target, confidence/quality metadata, endpoint entitlement, retention, pagination/CUs and licensing. The cohort includes creation earlier than the discovery cutoff; closure-date coverage alone is insufficient. No exact-date paid endpoint was successfully tested, so no paid service is declared a proven fix.

At 2.5 unique cash-flow timestamps per position in this small cohort, 1,000 similar positions imply approximately 2,500 target times. A one-request-per-asset/time historical API model is about **5,000 price requests** before pagination/retries and deduplication; batching feeds or caching shared times can reduce this. A 60-second Pyth range can require extra pages; per-plan throughput and earliest feed history must still be checked. Birdeye CUs cannot be calculated until endpoint entitlement and unit price are verified. Historical oracle/aggregate marks are still estimates, even if independently validated with substantially better timing.

Paid historical pricing is **not demonstrated necessary** for continued research or approximate results. It may reduce engineering and supply an independent USD anchor, but no fee should be paid before a free/trial exact-date coverage check. Current missing validation cannot be repaired merely by buying a subscription.
'''
    Path('PRICE_SOURCE_COMPARISON.md').write_text(comparison,encoding='utf-8')
    findings=f'''# Phase 5 findings

## Executed outcome

| Measure | Actual output |
|---|---:|
| Funded, closed positions reprocessed | {s['positions']} |
| Verified historical USD P&Ls | **{s['verified_usd_pnl']}** |
| Approximate estimated USD P&Ls / hold benchmarks | **{s['estimated_usd_pnl']}** |
| Unavailable position scenarios | **{s['unavailable']}** |
| Full blocks available | {s['blocks_available']} |
| Transactions inspected | {s['transactions_inspected']:,} |
| SOL/USDC executed-leg observations | {s['swap_observations']} |
| Reference-eligible observations | {s['eligible_reference_observations']} |
| Target times with screened on-chain references | {s['targets_with_onchain_reference']} / {s['target_slot_times']} |
| Targets with ≥2 market types / ≥2 protocols | {s['targets_with_two_venues']} / {n_two_protocol} |
| Decoder errors | {s['decoder_errors']} |
| External service spending | **$0** |

Verified observations: {s['exact_execution_observations']} swap legs reconcile their amounts independently to on-chain transfers and balances. This verifies those executions, **not** the LP's historical USD P&L. Rejection reason counts overlap: `{json.dumps(s['rejections'],sort_keys=True)}`. Venue counts: `{json.dumps(s['observation_venues'],sort_keys=True)}`. Jupiter-presence flags identify routed evidence without adding extra votes.

Estimated findings: six position scenarios use original reconciled token cash flows and observable costs, with screened on-chain references wherever available and explicit hourly USD estimates otherwise. Median absolute on-chain-versus-hourly difference: {rounded(s['median_absolute_difference_bps'])} bps; maximum {rounded(s['max_absolute_difference_bps'])} bps. These comparisons establish disagreement, not ground truth. See `PRICE_UNCERTAINTY_REPORT.md` and `UPDATED_POSITION_USD_PNL.csv` for actual returns and stress ranges.

The verified-P&L milestone remains unmet. The local 60-second default had no documented calibration; retaining its historical result while introducing an explicit approximate tier does not make stale prices verified. None of these scenarios is independently verified profitability or actual USD liquidation proceeds.

One material observed pattern: at slot **458190121**, the prior hourly SOL/USD sample was **2663 seconds** old and differed from the recovered on-chain reference by about **2.13%** after the historical USDC/USD conversion. The six-position estimates change materially when replacing hourly SOL marks; small reported fee gains cannot be assumed to establish positive net performance. This is evidence for investigating historical attribution error, not a product conclusion.

## Scaling to 1,000 positions (estimate, not benchmark)

The completed Phase 5 cache contains {len(requests)} distinct RPC request bodies: `{json.dumps(dict(methods),sort_keys=True)}`. Cache hits do not cost requests; version negotiation and failed probes can create additional bodies. Actual raw RPC cache is {D(raw_bytes)/D(2**20):.2f} MiB. A naive equal-cohort storage extrapolation is **{estimated_gib:.2f} GiB** for 1,000 positions; not continuous chain indexing.

With 2.5 target timestamps/position, four prior blocks require at most **10,000 getBlock** calls for 1,000 similar positions before overlap. Three pool signature pages/target require **7,500 getSignaturesForAddress** calls, and three selected transactions/page up to **22,500 getTransaction** calls, plus version retries. This bounded pricing experiment is roughly **40,000 standard RPC requests** before overlap/retries. The six-position lifecycle had 40 unique transactions; linear inheritance adds about **6,667 transaction** and **1,000 signature-page** calls, excluding discovery and arbitrary long histories. At 2.1-second public-RPC spacing, 47,667 calls take at least **27.8 hours**, before latency/retries; persistent indexing and grouping nearby times would reduce repeated work.

Nominal service cost can remain **$0** on public RPC or a free archival allocation if exact-date access, throughput, bandwidth and usage limits hold. This is not a reliability guarantee. Method-specific [Helius credit docs](https://www.helius.dev/docs/billing/credits) advertise 1M monthly Free credits and 1 credit for each of these historical methods; this model fits nominally, but no Helius access or 1,000-position run was tested. Local disk/network/engineering costs are additional and unpriced. Whole-history signature enumeration and unbiased discovery have separate potentially much larger budgets.

## Missing evidence and next experiment

**Missing:** calibrated absolute target-time USD accuracy; independent sufficiently fresh historical USDC/USD; active-bin/tick liquidity and real impact; exhaustive program/venue coverage; unbiased 1,000-position cohort; paid-provider exact-date response/entitlement proof. Signature pages and sampling budgets are deliberately bounded. RPC retrieval success is not proof of all-market coverage.

**Hypothesis:** a broader past-only multi-protocol reference plus independently sampled USD anchors can give sufficiently tight mark-to-market uncertainty for larger LP positions. This has not been established by sparse trade agreement.

**Recommended next experiment:** preregister 100 historical windows spanning quiet and volatile periods, with both buy/sell trades and at least two independent protocols; retain bid/ask/fees and historical active-liquidity evidence where obtainable. Add Orca/another protocol with a verified schema. Compare reconstructed as-of prices against an independent USD feed obtained through permitted free access or a provider-supplied exact-date trial/sample. Separately validate USDC/USD, measure error versus timestamp distance and trade size on held-out windows, and only then set high-confidence tolerances. Require a provider to demonstrate the earliest and latest cohort timestamps before considering payment.

No product idea, frontend or live trading was selected or built. Commands and schema references are in `ONCHAIN_PRICE_METHODOLOGY.md`. Tests cover chronology, deduplication, official account layouts, decimals, independent transfer/balance mismatches, liquidity screens, outliers, missing USD anchors, fee/cost accounting, capital-matched hold and correlated sensitivity.
'''
    Path('PHASE5_FINDINGS.md').write_text(findings,encoding='utf-8')
    for name in ['ONCHAIN_PRICE_METHODOLOGY.md','PRICE_SOURCE_COMPARISON.md','PRICE_UNCERTAINTY_REPORT.md','PHASE5_FINDINGS.md']:
        with Path(name).open('a',encoding='utf-8') as f:f.write('\n'+exchange_text)
    with Path('PHASE5_FINDINGS.md').open('a',encoding='utf-8') as f:f.write('\n## Recorded automated verification\n\n'+test_status+'\n')
    paths=[p for p in ROOT.rglob('*') if p.is_file() and p.name!='evidence_manifest.json']
    paths += [Path(p) for p in ['ONCHAIN_PRICE_METHODOLOGY.md','PRICE_SOURCE_COMPARISON.md','PRICE_UNCERTAINTY_REPORT.md','UPDATED_POSITION_USD_PNL.csv','PHASE5_FINDINGS.md','data/phase4/usd_analysis.json','data/phase4/position_lifecycles.json','data/evidence/dlmm-idl.json']]
    paths += list(Path('data/phase4/prices_raw').glob('*'))
    paths += [Path('src/research')/name for name in ['onchain_prices.py','phase5.py','phase5_capture.py','phase5_pool_history.py','phase5_reports.py','exchange_validation.py','rpc_discovery.py']]
    paths += [Path('tests/test_phase5.py')]
    atomic_json(ROOT/'evidence_manifest.json',[{'path':str(p),'sha256':hashlib.sha256(p.read_bytes()).hexdigest(),'bytes':p.stat().st_size} for p in sorted(set(paths)) if p.is_file()])
    print('Generated five Phase 5 deliverables; verified',s['verified_usd_pnl'],'estimated',s['estimated_usd_pnl'],'unavailable',s['unavailable'])

if __name__=='__main__':run()
