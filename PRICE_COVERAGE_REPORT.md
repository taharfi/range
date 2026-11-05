# Historical price coverage — 2026-10-19

## Actual coverage gates

| Measure | Result |
|---|---:|
| Funded, genuinely closed SOL/USDC positions | 6 |
| Creation/closure and token-flow reconciliation | 6 |
| Independent owner balances / observed costs reconciled | 6 |
| Cash-flow and cost price references | 121 |
| Total references including hold terminal marks | 129 |
| References passing nonfuture <=60-second policy | 0 |
| Verified USD P&L / hold benchmarks | 0 / 0 |
| Unverified <=3600-second sensitivities available | 6 |

Quality counts: {'stale_for_policy': 129}. Observed sample ages range 164.0–2868.0 seconds. These are source sample ages relative to events, not retrieval lag. `data/phase4/price_observations.csv` lists **every** selected cash-flow, cost and terminal benchmark mark with source, timestamp, age, quality and response hash.

## Position-level coverage

| Position | Lifetime UTC | Strict price gaps | Cost/balance verification | USD status |
|---|---|---:|---|---|
| [Bp9jYmh9ZGw1TmrWjVG3yESv5J1gVkCu4kFmYizRtjMY](https://solscan.io/account/Bp9jYmh9ZGw1TmrWjVG3yESv5J1gVkCu4kFmYizRtjMY) | 2026-08-30T11:43:12+00:00 to 2026-09-21T18:06:13+00:00 | 39 | True: passed | unverified |
| [BS4wiJJMnQ3XdWFafyFHsU1toK8dLALny99U2QSsZmR7](https://solscan.io/account/BS4wiJJMnQ3XdWFafyFHsU1toK8dLALny99U2QSsZmR7) | 2026-10-07T11:14:08+00:00 to 2026-10-07T11:14:32+00:00 | 5 | True: passed | unverified |
| [BzLqj9bkPo11CkXrKySG1gsy9YEsrsPuhmpLh1RgdZiM](https://solscan.io/account/BzLqj9bkPo11CkXrKySG1gsy9YEsrsPuhmpLh1RgdZiM) | 2026-10-15T16:03:42+00:00 to 2026-10-17T21:43:58+00:00 | 9 | True: passed | unverified |
| [4e5JccUZ8G6wGDhrhpJRSG6bmDvpjjfRRSkFr6ZE5rzg](https://solscan.io/account/4e5JccUZ8G6wGDhrhpJRSG6bmDvpjjfRRSkFr6ZE5rzg) | 2026-10-15T16:05:45+00:00 to 2026-10-17T21:44:23+00:00 | 10 | True: passed | unverified |
| [F5zdVjXCHrSruDk4MQnSn1N2vRJgbgcbJHSietnHUmy5](https://solscan.io/account/F5zdVjXCHrSruDk4MQnSn1N2vRJgbgcbJHSietnHUmy5) | 2026-10-17T21:47:48+00:00 to 2026-10-18T22:24:00+00:00 | 10 | True: passed | unverified |
| [FMznmFrgkCmGqraCt3BNMpnR82swGpGUx54HU4uWzxwm](https://solscan.io/account/FMznmFrgkCmGqraCt3BNMpnR82swGpGUx54HU4uWzxwm) | 2026-10-17T16:07:44+00:00 to 2026-10-19T03:12:44+00:00 | 5 | True: passed | unverified |

## Interpretation and missing data

CoinGecko historical observations were actually fetched for both SOL/USD and USDC/USD. Older daily windows returned hourly observations. The initial current-day probe returned a five-minute grid. Neither supports arbitrary second-level prices. Two transient 429 responses were retained and retried at a lower request rate; final request errors are recorded in the summary. A successful grid response is not a promise of fine-grained coverage.

The estimator selects only an actual observation at or before the event. It never interpolates, backfills a missing sample from the future, assumes USDC=$1, or uses current prices. Empty `net_usd_pnl` and verified hold fields in the CSVs mean **unavailable**, not zero. Hourly sensitivity columns are explicitly unverified and do not meet the mission's profitability gate.

Pyth historical range returned 401; GeckoTerminal public OHLCV returned 403; the CoinGecko Onchain minute endpoint returned 401. Birdeye's catalog confirms a historical-by-Unix product, but its linked detailed schema was inaccessible without account access. Therefore no fabricated Birdeye request or timestamp was used.

For future minute OHLCV ingestion, a bar's close is known only at the end of its interval; treating its opening timestamp as the close's observation time would introduce look-ahead. The current implemented adapters use provider sample/update times directly.
