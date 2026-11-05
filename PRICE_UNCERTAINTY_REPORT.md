# Price uncertainty report — Phase 5

## Observed coverage and agreement

- 214 decoded SOL/USDC legs from 68,141 inspected transactions; 44 eligible reference observations.
- 13/15 target slot/times have screened prior-slot reference prices. 8 targets have at least two market types; **8** have both Meteora and Raydium protocols. Maximum retained reference age: 51 seconds.
- 13 comparisons against nonfuture hourly SOL/USD, after multiplying by historical USDC/USD: median absolute difference **22.1453 bps**, maximum **212.6360 bps**. This mixes source differences, swap fees/spread and time movement; it is not an absolute accuracy measurement. See `data/phase5/source_agreement.csv`.
- 29 unique token/time marks, 0 unavailable quote references after allowing explicitly approximate hourly scenarios. On-chain coverage and approximate USD coverage have different denominators. Historical price references previously failed at 60 seconds; none is relabeled verified.

## How sensitivity is measured

Only prior observations within six hours of each target are used; at least three samples are required. The largest absolute fractional deviation from the last available sample is measured. For on-chain SOL marks, combine the larger of that measured SOL range, on-chain/hourly disagreement and within-reference trade dispersion, then add the measured USDC range. A separate ±1% price stress is also reported.

This envelope is a **scenario sensitivity**, not a statistical confidence interval or a guaranteed bound. It cannot measure unobserved intrahour spikes, future changes, common oracle/source errors, peg jumps, stale exchange quotes or adversarial trades. A flat observed series does not prove zero risk. Longer timestamp tolerance is not empirically validated by these results. No high-confidence tier is awarded.

Cash flows with the same token/time share one price variable and are netted before sensitivity. For every price variable, signed exposure selects the adverse endpoint. Hold and LP share funding basis and exit marks, so excess-versus-hold uncertainty cancels identical exposures before evaluating its envelope. Bounds across different token/times assume simultaneous adverse endpoints and may be conservative. USDC/USD changes are not suppressed.

## Actual approximate results (USD)

All rows are **unverified approximate historical mark-to-market estimates**. The LP did not necessarily convert these receipts to USD. Fees are included once as claimed cash flows; costs include observed owner-paid network fees and independently reconciled external native payments. Recoverable rent is collateral. No rewards were observed in this cohort. No missing reward history is extrapolated.

| Position | Estimated net | Empirical stress range | Estimated hold | Estimated excess vs hold | On-chain SOL marks |
|---|---:|---:|---:|---:|---:|
| `Bp9jYmh9ZGw1TmrWjVG3yESv5J1gVkCu4kFmYizRtjMY` | 361.3470 | 346.3552 to 376.3388 | 291.0243 | 70.3227 | 3 |
| `BS4wiJJMnQ3XdWFafyFHsU1toK8dLALny99U2QSsZmR7` | -0.0168 | -0.0584 to 0.0249 | 0.0000 | -0.0168 | 2 |
| `BzLqj9bkPo11CkXrKySG1gsy9YEsrsPuhmpLh1RgdZiM` | -6.7071 | -18.3570 to 4.9427 | -5.5681 | -1.1390 | 2 |
| `4e5JccUZ8G6wGDhrhpJRSG6bmDvpjjfRRSkFr6ZE5rzg` | -0.5140 | -3.1723 to 2.1444 | 0.0150 | -0.5289 | 2 |
| `F5zdVjXCHrSruDk4MQnSn1N2vRJgbgcbJHSietnHUmy5` | 0.1815 | 0.1539 to 0.2090 | 0.0032 | 0.1782 | 2 |
| `FMznmFrgkCmGqraCt3BNMpnR82swGpGUx54HU4uWzxwm` | 1.4683 | 1.4296 to 1.5070 | 0.0281 | 1.4402 | 2 |

Deposits are negative cash flows, withdrawals/claims positive, observable costs negative at their event timestamps. Each deposit lot is held to closure for the benchmark; withdrawals/fees never create extra holding lots. LP receipts are marked to USD cash at receipt with zero reinvestment/interest, a convention rather than observed conversion. The hold alternative incurs no LP execution costs. P&L uses exact Decimal arithmetic, but CSV digits do not imply matching market-price accuracy.

## Remaining missing evidence

The reference series is sparse and the cohort is selected through current owners, not an unbiased performance sample. Active historical liquidity and impact are missing. Exact USD executions, calibrated timestamp error, independent target-time USDC/USD and a continuously sampled external validation series are missing. Approximate P&L availability does not resolve those verification gaps.

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
