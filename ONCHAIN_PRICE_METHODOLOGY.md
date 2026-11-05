# On-chain price methodology — Phase 5

## Freshness audit

The earliest retained implementation found is `src/research/economic.py::economic_performance(max_price_age=60)` in Phase 3. Phase 4 inherited it in `historical_prices.select_asof` and froze it in `data/phase4/pricing_policy.json`. The inspected code, tests and reports contain no empirical derivation or source requiring a universal 60-second limit. There is no Git history here to recover additional author intent. It is a conservative local screening default, not demonstrated market accuracy. Pyth's separately documented maximum 60-second **request window** is an API pagination constraint, not justification for this valuation rule.

The Phase 4 policy and its 0/129 passing references are preserved. Phase 5 does not turn those failed references into verified prices. The on-chain selector still uses strictly prior slots and at most 60 seconds. Hourly USD marks are admitted only to a separately labeled approximate scenario, with measured past-data sensitivities.

## Quality tiers

| Tier | Evidence required | This run |
|---|---|---|
| Exact execution evidence | Successful canonical program instruction plus independently reconciled raw SPL transfers and historical reserve deltas; mint/decimal identity verified. | 203 observations of executed SOL/USDC legs. These are the actual trades' fee-inclusive effective prices, not the LP's USD execution proceeds. |
| High-confidence historical market estimate | Independent market/Oracle agreement, historical USD anchor, and empirically validated timing/error tolerance suitable for the exposure. | None asserted. No calibrated error distribution or sufficiently precise independent USD anchor exists. Merely meeting an age cutoff does not qualify. |
| Approximate historical estimate | Identifiable nonfuture historical source, measured disagreement/past range, explicit limitations. | 6 position mark-to-market scenarios. |
| Unavailable | Missing required observations, incomplete reconciliation, invalid source, or insufficient past observations to measure sensitivity. | 0 position scenarios; missing on-chain target coverage remains explicit, even where an hourly scenario is possible. |

## Frozen samples and decoding

`capture_plan.json` fixes 15 target slot/time pairs from 40 lifecycle transaction signatures. Four slots immediately preceding each target are requested, 60 blocks available. Target cash-flow range: **2026-08-30T11:43:12+00:00 through 2026-10-19T03:12:44+00:00**. This is a sparse event-centered sample, not continuous history or a representative LP cohort. The exact slot list is in the plan; all full RPC bodies and SHA256 metadata are retained.

The initial four-slot sample was insufficient. `pool_history_plan.json` explicitly adds three named SOL/USDC pools (the cohort's Meteora pool and two observed Raydium CLMM pools), at every target, up to 100 prior signatures and the nearest three successful prior-slot transactions within 60 seconds. Selection uses no trade price, size or LP return. It completed 45/45 pool-target pages, with 0 errors. Pages hitting 100 are bounded samples, not exhausted histories. Before cursors were tested against both the target pool and another venue. Results are filtered again by returned slot/time; cursor behavior alone never establishes chronology.

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

- [2D2kQrnKZkfsrtbNeY4zcz2pVEd8gWw962pQ83c6GeEj8YTrmqLjYWP93SaoZT5ajZNyXKh4jtJeFpMbK9g7RTXS](https://solscan.io/tx/2D2kQrnKZkfsrtbNeY4zcz2pVEd8gWw962pQ83c6GeEj8YTrmqLjYWP93SaoZT5ajZNyXKh4jtJeFpMbK9g7RTXS): slot 442870704, 2026-08-30T11:43:16+00:00, Raydium AMM v4, pool `58oQChx4yWmvKdwLLZzBi4ChoCc2fqCUWBkwMihLYQo2`; 2693784209 atomic SOL / 282524198 atomic USDC; 104.88004089 USDC/SOL, trade 282.52 USDC.
- [59R1Fm7hcXj9F4tnmQjUZ8nVqnU49r3YNRhcgLvBUHcCGAeunGLCjAXckSG6JMeK6orTYVRWuPJ13e256HNX9mYL](https://solscan.io/tx/59R1Fm7hcXj9F4tnmQjUZ8nVqnU49r3YNRhcgLvBUHcCGAeunGLCjAXckSG6JMeK6orTYVRWuPJ13e256HNX9mYL): slot 449130942, 2026-09-21T18:06:03+00:00, Meteora DLMM, pool `5rCf1DM8LjKTw4YqhnoLcngyZYeNnQqztScTogYHAS6`; 1999586929 atomic SOL / 234704504 atomic USDC; 117.37649441 USDC/SOL, trade 234.70 USDC.
- [2hPxL2Be3YkxrPn9TnPET2aFKN5GJp6JqNgjMSxsXcagTEe6Z69f81RFZv7FZtpMF59akiMTQ4mvraLvnK5SSQHs](https://solscan.io/tx/2hPxL2Be3YkxrPn9TnPET2aFKN5GJp6JqNgjMSxsXcagTEe6Z69f81RFZv7FZtpMF59akiMTQ4mvraLvnK5SSQHs): slot 449130942, 2026-09-21T18:06:03+00:00, Meteora DLMM, pool `5rCf1DM8LjKTw4YqhnoLcngyZYeNnQqztScTogYHAS6`; 1999327318 atomic SOL / 234674032 atomic USDC; 117.37649453 USDC/SOL, trade 234.67 USDC.

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
