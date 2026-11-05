# Phase 5 findings

## Executed outcome

| Measure | Actual output |
|---|---:|
| Funded, closed positions reprocessed | 6 |
| Verified historical USD P&Ls | **0** |
| Approximate estimated USD P&Ls / hold benchmarks | **6** |
| Unavailable position scenarios | **0** |
| Full blocks available | 60 |
| Transactions inspected | 68,141 |
| SOL/USDC executed-leg observations | 214 |
| Reference-eligible observations | 44 |
| Target times with screened on-chain references | 13 / 15 |
| Targets with ≥2 market types / ≥2 protocols | 8 / 8 |
| Decoder errors | 0 |
| External service spending | **$0** |

Verified observations: 203 swap legs reconcile their amounts independently to on-chain transfers and balances. This verifies those executions, **not** the LP's historical USD P&L. Rejection reason counts overlap: `{"ambiguous_or_missing_transfer_direction": 11, "reserve_consumption_above_1pct": 3, "tiny_trade_below_100_usdc": 161, "unused_input_requires_extra_attribution": 3, "usdc_vault_below_100k": 62}`. Venue counts: `{"Meteora DLMM": 63, "Raydium AMM v4": 58, "Raydium CLMM": 93}`. Jupiter-presence flags identify routed evidence without adding extra votes.

Estimated findings: six position scenarios use original reconciled token cash flows and observable costs, with screened on-chain references wherever available and explicit hourly USD estimates otherwise. Median absolute on-chain-versus-hourly difference: 22.1453 bps; maximum 212.6360 bps. These comparisons establish disagreement, not ground truth. See `PRICE_UNCERTAINTY_REPORT.md` and `UPDATED_POSITION_USD_PNL.csv` for actual returns and stress ranges.

The verified-P&L milestone remains unmet. The local 60-second default had no documented calibration; retaining its historical result while introducing an explicit approximate tier does not make stale prices verified. None of these scenarios is independently verified profitability or actual USD liquidation proceeds.

One material observed pattern: at slot **458190121**, the prior hourly SOL/USD sample was **2663 seconds** old and differed from the recovered on-chain reference by about **2.13%** after the historical USDC/USD conversion. The six-position estimates change materially when replacing hourly SOL marks; small reported fee gains cannot be assumed to establish positive net performance. This is evidence for investigating historical attribution error, not a product conclusion.

## Scaling to 1,000 positions (estimate, not benchmark)

The completed Phase 5 cache contains 287 distinct RPC request bodies: `{"getBlock": 60, "getSignaturesForAddress": 47, "getTransaction": 180}`. Cache hits do not cost requests; version negotiation and failed probes can create additional bodies. Actual raw RPC cache is 253.29 MiB. A naive equal-cohort storage extrapolation is **41.23 GiB** for 1,000 positions; not continuous chain indexing.

With 2.5 target timestamps/position, four prior blocks require at most **10,000 getBlock** calls for 1,000 similar positions before overlap. Three pool signature pages/target require **7,500 getSignaturesForAddress** calls, and three selected transactions/page up to **22,500 getTransaction** calls, plus version retries. This bounded pricing experiment is roughly **40,000 standard RPC requests** before overlap/retries. The six-position lifecycle had 40 unique transactions; linear inheritance adds about **6,667 transaction** and **1,000 signature-page** calls, excluding discovery and arbitrary long histories. At 2.1-second public-RPC spacing, 47,667 calls take at least **27.8 hours**, before latency/retries; persistent indexing and grouping nearby times would reduce repeated work.

Nominal service cost can remain **$0** on public RPC or a free archival allocation if exact-date access, throughput, bandwidth and usage limits hold. This is not a reliability guarantee. Method-specific [Helius credit docs](https://www.helius.dev/docs/billing/credits) advertise 1M monthly Free credits and 1 credit for each of these historical methods; this model fits nominally, but no Helius access or 1,000-position run was tested. Local disk/network/engineering costs are additional and unpriced. Whole-history signature enumeration and unbiased discovery have separate potentially much larger budgets.

## Missing evidence and next experiment

**Missing:** calibrated absolute target-time USD accuracy; independent sufficiently fresh historical USDC/USD; active-bin/tick liquidity and real impact; exhaustive program/venue coverage; unbiased 1,000-position cohort; paid-provider exact-date response/entitlement proof. Signature pages and sampling budgets are deliberately bounded. RPC retrieval success is not proof of all-market coverage.

**Hypothesis:** a broader past-only multi-protocol reference plus independently sampled USD anchors can give sufficiently tight mark-to-market uncertainty for larger LP positions. This has not been established by sparse trade agreement.

**Recommended next experiment:** preregister 100 historical windows spanning quiet and volatile periods, with both buy/sell trades and at least two independent protocols; retain bid/ask/fees and historical active-liquidity evidence where obtainable. Add Orca/another protocol with a verified schema. Compare reconstructed as-of prices against an independent USD feed obtained through permitted free access or a provider-supplied exact-date trial/sample. Separately validate USDC/USD, measure error versus timestamp distance and trade size on held-out windows, and only then set high-confidence tolerances. Require a provider to demonstrate the earliest and latest cohort timestamps before considering payment.

No product idea, frontend or live trading was selected or built. Commands and schema references are in `ONCHAIN_PRICE_METHODOLOGY.md`. Tests cover chronology, deduplication, official account layouts, decimals, independent transfer/balance mismatches, liquidity screens, outliers, missing USD anchors, fee/cost accounting, capital-matched hold and correlated sensitivity.

## Additional free independent USD recovery

After the primary source-selection policy was frozen, permitted public [Coinbase Exchange candles](https://docs.cdp.coinbase.com/api-reference/exchange-api/rest-api/products/get-product-candles) and [Bitstamp OHLC](https://www.bitstamp.net/api/) were tested at every target. Coinbase SOL/USD completed bars passed the 100-USD bar-volume screen at **15/15** targets; Bitstamp USDC/USD bars passed at **12/15** within the separate one-hour validation window. No API key or subscription was used. Coinbase USDC-USD returned 404; it was not replaced with a peg. These are additional historical USD market observations, not on-chain executions.

Only bars whose **start + 60 <= target** are eligible. The actual last-trade timestamp is unknown within the bar, so age is conservatively measured from bar start. SOL permits at most 120 seconds of possible age (the geometry of a completed one-minute bar); USDC permits at most 3600 seconds and remains coarse when no recent substantial bar exists. Neither limit upgrades quality. Zero-volume carry-forwards and bars with under 100 USD total volume are rejected. Bar volume is not proof of executable depth. The API's “exclude current candle” option is insufficient alone for historical as-of validation; local end-time filtering is mandatory.

There are **10** available comparisons of on-chain SOL/USDC × Bitstamp USDC/USD against Coinbase SOL/USD: median absolute difference **4.4659 bps**, maximum **24.1752 bps**. Ages and exact source lineage are retained in `data/phase5/exchange_validation.json` and `independent_source_agreement.csv`. Timing mismatch and fee/spread differences remain; agreement is not calibrated ground truth.

A second scenario revalues all six positions using the completed Coinbase SOL/USD marks, qualified Bitstamp USDC/USD where available, and explicitly labeled hourly CoinGecko USDC fallback elsewhere. The frozen primary estimator remains separate. This measures source sensitivity without choosing the more profitable result. Shared marks/hold funding/cost accounting are identical; a separate ±1% stress is retained. Both scenarios are approximate and unverified.

| Position | Primary estimated USD P&L | Independent USD candle scenario |
|---|---:|---:|
| `Bp9jYmh9ZGw1TmrWjVG3yESv5J1gVkCu4kFmYizRtjMY` | 361.3470 | 359.5059 |
| `BS4wiJJMnQ3XdWFafyFHsU1toK8dLALny99U2QSsZmR7` | -0.0168 | -0.0173 |
| `BzLqj9bkPo11CkXrKySG1gsy9YEsrsPuhmpLh1RgdZiM` | -6.7071 | -6.3176 |
| `4e5JccUZ8G6wGDhrhpJRSG6bmDvpjjfRRSkFr6ZE5rzg` | -0.5140 | -0.5005 |
| `F5zdVjXCHrSruDk4MQnSn1N2vRJgbgcbJHSietnHUmy5` | 0.1815 | 0.1918 |
| `FMznmFrgkCmGqraCt3BNMpnR82swGpGUx54HU4uWzxwm` | 1.4683 | 1.4446 |

This demonstrates another **$0** route to finer historical USD research. It does not establish reliable subminute USDC market observations, calibrated error coverage or actual USD execution proceeds. Paying for a historical API is not yet shown necessary.

## Recorded automated verification

72 tests; 0 failures/errors; 0 skipped. See data/phase5/test_results.xml.
