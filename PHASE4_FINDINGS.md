# Phase 4 findings — 2026-10-19

**The target of three verified USD P&Ls is not achieved.** Implemented and executed historical-price ingestion, SOL/USDC closed-position discovery, independent balance/cost checks, exact USD cash-flow accounting and a capital-matched hold benchmark. Outputs preserve all failed verification gates.

## Actual results

- **6 funded SOL/USDC positions** verified closed and reconstructed. The original phase-3 cohort contains no funded SOL/USDC position, so this is an additional cohort.
- **6** pass creation-to-closure and event/SPL-flow reconciliation; **6** also pass independent reserve pre/post balance, owner USDC balance, owner native+wrapped-SOL wealth and observable-cost checks.
- **0 verified historical USD P&Ls and 0 verified hold benchmarks.** Historical price samples fail the frozen 60-second freshness policy. Residual cost gaps independently prevent verification where present.
- **6 unverified hourly-price sensitivities** are calculated from real historical observations. They are not final profitability findings.
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
| [Bp9jYmh9ZGw1TmrWjVG3yESv5J1gVkCu4kFmYizRtjMY](https://solscan.io/tx/5pNLbdUqxW55MVxrPHoJu6SPzn7wjJY1gsmNGYaHK9FZ5Ts8YYZoHXLrFgCFbZrPA3a8FdjGj53Qr1VwLaNdkwtF) | 360.7088853802966178177977 | 284.1822965524901763760982 | 76.5265888278064414416995 | unverified: coarse prices and any unresolved cost residuals |
| [BS4wiJJMnQ3XdWFafyFHsU1toK8dLALny99U2QSsZmR7](https://solscan.io/tx/3W1WRV2DDGhd9yDjEhXm8EY6cm7gY46E1tvvPRdK9bSnNnWsFJccnnJtQy5dSoundcPSN3un4zFnapx2JtvE4B9a) | -0.0182453203249052370852 | 0E-21 | -0.0182453203249052370852 | unverified: coarse prices and any unresolved cost residuals |
| [BzLqj9bkPo11CkXrKySG1gsy9YEsrsPuhmpLh1RgdZiM](https://solscan.io/tx/2urYUtq4yQpzWsrbHFypA8aqnCWaGZVEmNigfdpEbu75jUXjwtvTkFsKoezsWYffW4xQdxR5zQimJPCb6RQox7XF) | -1.65921780258615383908894 | -2.64006593332569677562489 | 0.98084813073954293653595 | unverified: coarse prices and any unresolved cost residuals |
| [4e5JccUZ8G6wGDhrhpJRSG6bmDvpjjfRRSkFr6ZE5rzg](https://solscan.io/tx/2jj8bHUKwKeriaiH2hDuP2oEtEx1p6cALT6UBoPhSFAMC8GGgm4UTpVu41LGMFA77b6d2Fp8W4LHECU1pWH8op1F) | 2.17915468002292651027749 | 0.0149755732665971078712 | 2.16417910675632940240629 | unverified: coarse prices and any unresolved cost residuals |
| [F5zdVjXCHrSruDk4MQnSn1N2vRJgbgcbJHSietnHUmy5](https://solscan.io/tx/3sLs35WzLHveAkQLbGHeVtQYbXEXHa8ATJRsyHHJzkRZRLegP76r3Zew2Hx9ZwMM2bfhg1WRxbossDf6kHVNSw6V) | 0.18014451815048901865656 | 0.0032238525095116094898 | 0.17692066564097740916676 | unverified: coarse prices and any unresolved cost residuals |
| [FMznmFrgkCmGqraCt3BNMpnR82swGpGUx54HU4uWzxwm](https://solscan.io/tx/2GCMkKYAyNxKEnYx1NijpmfMkfLAhDx5VMCFMakjYMM3gWuWftjvbJokDzUgZRSJxZ4t9Rgh8eRDA7fecHn6QoEL) | 1.46861763131941777186404 | 0.0280875764405827519488 | 1.44053005487883501991524 | unverified: coarse prices and any unresolved cost residuals |

## Precisely what blocks three verified results

1. **Price freshness:** actual historical SOL/USD and USDC/USD samples are too old for the frozen 60-second policy; 0/129 references pass. Current prices and USDC pegs cannot repair this.
2. **Access:** Pyth historical API requires a key (401); GeckoTerminal returned an access challenge (403); CoinGecko's minute Onchain route requires authentication (401). The public CoinGecko historical endpoint works but its hourly samples do not solve the freshness gap.
3. **Costs:** 0 positions retain unresolved native-SOL residuals; these must be explained from transaction instructions/account control, not classified as fees by assumption.

Cheapest potential fix is **$0**: restore ordinary permitted GeckoTerminal public API access and verify completed minute USD bars for both mints. This is not established to work from the current environment. The lowest reviewed listed paid candidate is **Birdeye Lite at $39/month**, subject to confirming that historical-by-Unix access and actual price timestamps are included; a purchase would be premature without that confirmation. CoinGecko Basic at $35/month extends retention but does not establish minute history. Pyth currently lists API-access Starter at $500/month. See HISTORICAL_PRICE_SOURCES.md for current primary sources and entitlement caveats. No money was spent.

## Can this scale to 1,000 positions?

Not as verified profitability yet: reliable timestamped prices and cost attribution are unresolved. The sample has **40 unique lifecycle transactions**, approximately **6.67 per position**. A workload with the same transaction density would need roughly **6,667 transaction bodies plus about 1,000 signature-history requests**, before discovery, retries and long-lived outliers. This is a directional extrapolation, not a provider quote or throughput benchmark.

Price ingestion can be shared across positions: SOL and USDC over 30 daily windows require about **60 day-range requests** for coarse CoinGecko history, independent of position count. Fine-grained data has different pagination/retention/entitlement costs; those are unverified. Deduplicate prices by asset/time and transactions by signature; use bounded retries, durable per-provider checkpoints, source licensing checks and explicit failure budgets. Current code is a local single-writer research pipeline, not a production 1,000-position service. Current-owner discovery is also unsuitable for an unbiased 1,000-position performance study; move back to fixed-slot creation/closure enumeration.

## Reproduction and evidence

`POSITION_USD_PNL.csv` and `HOLD_BENCHMARKS.csv` contain six real rows with blank verified outputs where unavailable. Full quotes, source URLs/hashes, policy, costs, signatures and independent checks are in `data/phase4/usd_analysis.json`; per-reference coverage is in `data/phase4/price_observations.csv`. `audit_manifest.json` verifies archived response bytes. Source current/older probe outcomes and historical API failures are retained. Run the commands in README.md and pytest. Synthetic edge-case tests are labeled separately from real-data replay.
