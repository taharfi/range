# Data quality report — 2026-10-19

## Validation results

| Check | Actual result | Interpretation |
|---|---|---|
| Official pool and historical response schemas | All 59 initial pool/history responses valid; 20 position histories also validated | Shape validation only |
| Unique cohort addresses | 276; 54 repeated stratum memberships merged | Live queries are not slot-consistent |
| Base58 addresses | No invalid pool or mint address flagged | 32-byte encoding check, not account existence |
| Pool accounts | 276/276 owned by official DLMM program | Independently queried at finalized slots |
| Unique mint decimal checks | 225/225 match API | On-chain jsonParsed mint data, source decimals retained |
| Creation timestamps | 15 invalid zero values | Millisecond interpretation gives plausible dates for 261 pools; invalid ages null/excluded |
| Inventory × API token-price versus API TVL | 82 of 251 positive-TVL pools differ >5% | Price freshness, unit semantics or reserve valuation unresolved; do not reconcile by force |
| Pool-level quality flags | 90 of 276 | Overlapping concerns; flagged observations are not automatically discarded |
| Historical candles | 426 raw rows, 310 missing completed pool-days | Empty/partial coverage explicitly recorded |
| Historical volume/fees | 744 raw rows; no missing grid timestamps | Some rows may be zero-padding; presence is not proof of source coverage |
| Daily timestamp ordering/duplicates/OHLC constraints | {'flat_close_series': 1} | Flat flags are quality concerns, not necessarily API errors |
| Volume rows entirely before valid pool creation date | 59; 0 nonzero | These are zero-padded grid rows, not observed trading days |
| History/API errors | 0 in historical run | No evidence of universal retention guarantees |
| Complete LP net P&L | 0/20 | Incomplete lifetime/inventory/cost data suppresses profit estimates |

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
