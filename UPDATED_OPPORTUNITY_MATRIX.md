# Updated opportunity matrix

Checked **2026-10-19 UTC**. This is an evidence update, not a product-selection decision. Findings are qualified by the private-beta access boundary and lack of a verified data API. See [API audit](POOLPARTY_API_AUDIT.md), [competitor analysis](POOLPARTY_COMPETITOR_ANALYSIS.md) and [leaderboard feasibility](LEADERBOARD_DATA_FEASIBILITY.md).

## Hypotheses remain open

| Hypothesis | Pool Party overlap | Current research constraint | Next discriminating experiment | Decision |
|---|---|---|---|---|
| LP Decision Engine | Substantial documented pool analytics and social context. [Pool guide](https://lppool.party/guide/pools). | Historical liquidity, price attribution and decision usefulness remain incomplete in our own research. | On a fixed pool cohort, test whether independently reconciled risks/hold-relative outcomes change an LP's stated choice beyond existing analytics. | Retain as a hypothesis; generic analytics differentiation weakened. |
| Smart LP Intelligence | Strong documented member-ranking/discovery overlap. [Leaderboard guide](https://lppool.party/guide/leaderboard). | No authorized leaderboard feed or identity linkage; outcome selection and mixed sync ages bias cohorts. | With consent and an authorized snapshot, freeze a cohort and test future persistence after exposure/capital controls. | Retain; no claim of a unique leaderboard opportunity. |
| Liquidity-to-Trade Automation | Current service is explicitly read-only. [Terms §3](https://lppool.party/terms). | Demand, safe execution, costs and advantage over existing workflows are unproven. | Research execution feasibility/costs using historical evidence and user interviews; no live trading implementation. | Do not infer attractiveness from a documented execution boundary. |
| LP Backtesting Lab | Historical reporting overlaps; counterfactual simulation not verified. [Profile guide](https://lppool.party/guide/profile). | Our six USD outcomes remain estimates; historical active depth and calibrated error remain gaps. | Reconcile a small owner-consented set against both providers and independent USD observations; test a capital-matched hold comparison. | Retain; accounting credibility must precede a product claim. |

## Provider comparison for this pipeline

| Source | Useful data / verification role | Access and cost evidence checked now | Limits relative to our needs |
|---|---|---|---|
| Pool Party | Potential member cohorts, reported performance, privacy-preserving social/pool context. | `/api` serves a private-beta gate. Read-only beta is free under current terms; API pricing, authorization, quotas and export rights unverified. [API URL](https://lppool.party/api), [terms](https://lppool.party/terms). | No sample, exact accounting joins or independent historical USD price lineage. Not demonstrated as a replacement for paid pricing/indexing. |
| Meteora official Data API | Known pools/positions, historical events and reported PnL; existing research integration. | Current [OpenAPI](https://dlmm.datapi.meteora.ag/api-docs/openapi.json) retrieved successfully: 20 paths, no top-level security requirement. Known-position history and pool/user PnL are documented. [Overview](https://raw.githubusercontent.com/MeteoraAg/docs/main/developer-guides/dlmm/api-reference/overview.mdx) specifies 30 RPS. | Reported prices/PnL are not automatically independently verified. Not a Pool Party social-profile/leaderboard API. |
| Helius | Raw archival transactions/blocks and indexed history for independent event, closure, transfer and cost checks. | [Method-specific billing](https://www.helius.dev/docs/billing/credits): Free 1M credits/month; ordinary historical getBlock/getTransaction/getSignatures calls are one credit each. Keys required; no new account or requests made here. | Does not itself supply an independently validated historical USD accounting policy or member identity. Exact archival coverage still requires a provider test. |
| Birdeye | Historical token-price/Unix-time data and OHLCV may supplement independent USD attribution. | [Official catalog](https://birdeye.so/data-api/types-of-data) and [pricing](https://birdeye.so/data-api/pricing) checked through web access; direct HTTP returned 403. Lite is advertised at $39/month, 2.5M CUs, 15 RPS. | Relevant endpoint entitlement/precision/earliest dates and CU cost remain unverified; no assumption that generic wallet PnL reconstructs Meteora LPs. No subscription recommended. |
| GeckoTerminal / CoinGecko Onchain | Pool market observations and OHLCV, not member identity or complete LP cash flows. | [Public API entry](https://www.geckoterminal.com/dex-api) and [OHLCV contract](https://docs.coingecko.com/reference/pool-ohlcv-contract-address) inspected. Authenticated CoinGecko route is distinct from public GeckoTerminal. | Per-plan historical coverage differs; the inspected paid contract lists before_timestamp pagination, maximum 1000 rows and pool-tracking dependence. Earlier pipeline public-access 403 remains a recorded limitation, not retested or bypassed here. |

## What can be verified on-chain?

For explicitly supplied position accounts/signatures, independently verify creation versus actual closure, pool/mint/decimal identity, deposits, withdrawals, fee/reward transfers, ownership changes, transaction fees and observable native payments. Historical USD valuation still needs an independent timestamped price policy; unrealized balances need a comparable snapshot slot. Privacy-protected member IDs, countries, following relationships, rank eligibility and proprietary win/price definitions are not blockchain facts.

Pool Party's [privacy policy](https://lppool.party/privacy) says stored closed histories omit wallet/position addresses. Consequently, even a future authorized aggregate export may require a separate owner-consented verification workflow. Rounded values and approximate times are inadequate for exact balance matching and should not be used to identify hidden wallets.

## Recommended role and cost conclusion

| Role | Recommendation | Evidence / prerequisite |
|---|---|---|
| Data provider | **Defer integration.** | No verified public data contract, sample or research license. Reassess after provider documentation and permitted exact-value export. |
| Competitor benchmark | **Use now at the documentation level.** | Material existing overlap is supported by current primary guides; member-only functionality remains untested. |
| Research/validation partner | **Pursue only through a separately authorized, consent-based collaboration.** | Potential methodology and managed-position comparisons; need pricing lineage, definitions and participant permissions. No outreach has been sent. |
| Avoid integration | **Avoid undocumented endpoints and identity inference; do not reject the product wholesale.** | Published membership/privacy boundaries matter; they do not erase competitor relevance or potential cooperation. |

**No demonstrated subscription savings can be booked.** Free membership is not a free API license, and upstream-derived PnL does not replace independent pricing. Keep the current $0 research approach and profitability pipeline intact. The next useful artifact is an authorized small export plus methodology and owner-consented accounting references—not a top-100 scraper or a purchase.
