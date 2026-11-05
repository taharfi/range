# Phase 2 findings — 2026-10-19

## Verified collection results

- **276 unique pools** from 330 requested stratum memberships (54 overlaps removed). Eleven frozen selection queries, 30 rows each; first observation wins for overlapping pools. This is a purposive cross-section, not a representative sample. Original 50-pool collection remains intact.
- **24 pools requested over 30 days**, 2026-09-19T00:00:00+00:00 inclusive through 2026-10-19T00:00:00+00:00 exclusive for analysis. API requests use inclusive end bounds; endpoint-day rows are retained raw and excluded from completed-day calculations.
- **744 volume/fee rows** and **426 OHLCV rows** retained, including boundary rows. Volume/fee grid covers all 720 requested pool-days, but row presence does not prove trading or source completeness. **310 missing OHLCV pool-days**; 8 pools have empty OHLCV, and 11 have all 30 completed-day candles.
- Historical TVL endpoint is absent from the inspected pool API. Sparse TVL panel contains **326 actual retrieval observations**, with **43 pools observed more than once**, from phase 1 and phase 2. No interpolated/backfilled daily TVL is generated.
- **20 unique LP wallets linked to finalized owner/position events**; 258 current accounts yielded 153 candidate owners. Queried 20 position histories with 53 API events. Explicit owner event matches: {'ClaimFee': 9, 'PositionCreate': 11}. Verifiable signatures are in `data/phase2/verified_wallet_links.csv`.
- **0 reconstructable complete net P&Ls**. All selected accounts are open; historical completeness, terminal inventory, rewards, transfer handling and execution costs are not established. `finance.py` computes exact source-valued cash-flow subtotals but suppresses P&L for these incomplete cases.

## Observed sample statistics (API valuation units)

| Statistic | Value | Definition / period |
|---|---:|---|
| TVL min / median / max | 0.00 / 2,480.19 / 37,619,921.99 | At per-pool retrieval |
| TVL p10 / p25 / p75 / p90 | 106.64 / 365.71 / 131,600.25 / 1,106,845.84 | Unweighted sample quantiles |
| Sample TVL | 161,782,790.39 | Sum across selected pools, not protocol TVL |
| Top-10 pool TVL share | 63.40% | Sample pool-level concentration, not within-bin concentration |
| Sample TVL HHI | 0.078547 | Sum of squared selected-pool TVL shares |
| Median volume / TVL | 0.010362 | Trailing-24h volume / current TVL; positive TVL only |
| Median fees / TVL | 0.00001610 (0.001610%) | Trailing-24h API fees / current TVL; neither APR nor LP profit |
| Age range | 0.082–1077.4 days | Millisecond interpretation, excluding 15 invalid zero dates |
| Bin steps | 19 values, 1–400 | Source pool configuration |

Token categories use mint allowlists, not potentially spoofed symbols: {'SOL_paired': 146, 'other_unclassified': 23, 'stable_paired': 106, 'two_allowlisted_stables': 1}. These are pair categories, not verified meme/LST/blue-chip classifications. SOL has nine decimals and other token decimals were checked independently on-chain.

| Relationship | Spearman rho | n |
|---|---:|---:|
| age_days_ms_interpretation__volume_24h_api | -0.4154 | 261 |
| age_days_ms_interpretation__fees_24h_api | -0.4937 | 261 |
| volume_24h_api__fees_24h_api | 0.9726 | 276 |
| tvl_api__fees_24h_api | 0.7164 | 276 |

Excluding blacklisted/zero-TVL pools leaves 251 pools; age correlations use 236 with valid creation timestamps: volume rho -0.4538, fees rho -0.5461. These are associations in deliberately age/volume-selected bands; **not causal age effects** or out-of-sample signals. Strong volume-fee correlation is mechanically plausible and says nothing about LP net returns.

Daily volatility is the sample standard deviation of log close-to-close changes, using only consecutive positive-price completed-day candles. CSV includes values for 14 pools, one flat and one valuation/age-flagged; the 12 without pool-level quality flags range from 0.002659 to 0.440511. These are source-series estimates, not independently verified realized market volatility. 1 series was flagged flat. A single candle is insufficient to assess flatness or volatility. Missing candles are never replaced with zero returns. Within-bin liquidity concentration was not collected.

## Estimates, hypotheses and missing evidence

Inventory valuation and pair-price checks support a USD-like interpretation of some source fields but do not establish reliable universal USD accounting. See DATA_QUALITY_REPORT.md: 82 pools differ by more than 5% on inventory valuation. Source-valued event USD amounts are estimates from Meteora, not observed on-chain dollars. No historical execution-cost model or historical swaps were inferred from live data.

Hypothesis: high activity and high fee generation may coexist with inventory losses. It remains untested here because no complete LP net return exists. No product idea is selected or ranked.

## Infrastructure and operational results

External service spend: **$0**. Used unauthenticated Meteora and public mainnet RPC plus local DuckDB/Parquet. Local storage, CPU and network were not metered. No paid service, new account, live trade or deployment was used. Provider comparison and indicative costs are in WALLET_DISCOVERY_COMPARISON.md; backfill operating cost remains unknown.

The original four tests are retained, with new precision, coverage, deduplication and saved-chain replay tests. Run `.venv/Scripts/python -m pytest -q` for final verification. The sparse transaction-wide scan encountered RPC version-1 responses; the collector now adapts only to that explicit server error. A transient Windows file replacement error interrupted the exploratory transaction scan after 58 lookups; atomic writes now use unique temporary files and bounded retries. The filtered-account proof completed with no recorded errors. Full historical scan/resume is still future work.

## Recommended next experiment

Freeze a short historical slot interval and enumerate **both position creation and closure**, independent of current account existence. Reconcile 10 closed positions end-to-end against token transfers, fee/reward alias handling, rebalances and historical valuation. In parallel, reconcile the 5%-plus valuation outliers and flat/missing candles against swaps/reserve balances. Only then estimate LP loss frequency or compare the four opportunities. Current evidence supports data-quality and coverage work, not a product decision.
