# Solana LP ecosystem map

Evidence checked **2026-10-21**. This is a product and dependency inventory, not a ranking of 35 active businesses. [COMPETITORS.csv](COMPETITORS.csv) contains **35 named products/providers**: 16 native, direct, community or adjacent LP products and 19 infrastructure/data candidates. GeekLad's two tools share an operator; GeckoTerminal and CoinGecko share a group. Step's dashboard is historical, Flipside's current blockchain service is unresolved, and SQD documentation was inaccessible. No transactions, account creation, paid services or private endpoints were used.

## Where products compete

| Layer | Products | Implication for RANGE |
|---|---|---|
| Native pool discovery and position execution | Meteora Dynamic Terminal; Orca; Raydium | Native interfaces already own range selection and liquidity actions. Integrating Jupiter is useful functionality, not differentiation by itself. [Meteora guide](https://github.com/MeteoraAg/docs/blob/main/user-guides/how-to-use-dlmm/dynamic-terminal.mdx), [Orca](https://www.orca.so/), [Raydium SDK](https://github.com/raydium-io/raydium-sdk-V2) |
| Meteora LP analytics and social discovery | Pool Party; LP Agent; Tidepool; GeekLad Profit Analysis | Profiles, wallet lookup and rankings are established offerings. Public rankings do not demonstrate comparable accounting or persistent strategy skill. [LP Agent](https://docs.lpagent.io/introduction), [Tidepool](https://tidepool.ag/docs), [GeekLad](https://geeklad.github.io/meteora-profit-analysis/); Pool Party fresh access remains constrained |
| Active management and automation | HawkFi; LP Agent; Tidepool; DeFiTuna | Rebalance, delegated execution, copy trading and automated exits have competitors; reliability and authorization models need separate scrutiny. Tidepool's FAQ explicitly says standing-permission exits are paused despite broader descriptions. [HawkFi](https://hawkfi.gitbook.io/whitepaper), [Tidepool](https://tidepool.ag/docs), [DeFiTuna](https://docs.defituna.com/) |
| Managed vaults and institutional liquidity | Kamino Liquidity; Gamma; Arrakis Pro | Outsourcing liquidity management is an alternative to another dashboard. These are different buyers and custody/permission boundaries. [Kamino](https://kamino.com/docs/products/liquidity), [Gamma](https://docs.gamma.xyz/gamma), [Arrakis](https://docs.arrakis.finance/) |
| Adjacent accounting and workflow benchmarks | Revert; Krystal; GeekLad Simulator | Hold benchmarks, cash-flow accounting, simulation and automation already exist somewhere in the sector. A claim of sector-wide absence is contradicted. [Revert](https://docs.revert.finance/revert), [Krystal](https://krystal.app/), [Simulator](https://dlmmsim.xyz/) |
| Historical portfolio precedent | Step Finance | Official operator announced dashboard/API/mobile wind-down on 2025-11-04, citing monetization and maintenance burden. This is a caution against infrastructure breadth, not proof that no narrow LP business can work. [Operator announcement](https://stepfinance.medium.com/step-group-changes-342ce7d210b0) |

## Dependency map

| Job | Relevant providers | Boundary |
|---|---|---|
| Swap routing and indicative execution | Jupiter | A quote does not include the complete LP withdrawal/redeposit workflow. [Developer platform](https://developers.jup.ag/) |
| Current accounts, transactions and streams | Helius; Triton; Shyft; Quicknode; Alchemy; SQD candidate | RPC/history and parsed-event coverage differ. Archive claims do not establish decoded DLMM lifecycle completeness. [Helius](https://www.helius.dev/docs), [Triton](https://docs.triton.one/), [Shyft](https://docs.shyft.to/), [Quicknode](https://www.quicknode.com/docs/solana), [Alchemy](https://www.alchemy.com/docs/reference/solana-api-quickstart) |
| Market and wallet observations | Birdeye; GeckoTerminal/CoinGecko; Pyth; Vybe; DEX Screener | Token/trader P&L is not automatically LP cash-flow P&L. Exact execution prices differ from market estimates. [Birdeye](https://data.birdeye.so/docs/getting-started), [CoinGecko](https://docs.coingecko.com/), [Pyth](https://docs.pyth.network/), [Vybe](https://docs.vybenetwork.com/), [DEX Screener](https://docs.dexscreener.com/) |
| Protocol/cohort research | Dune; DefiLlama; historical Flipside | Warehouse queries require schema/completeness checks. TVL and DEX volume are not tool adoption. Flipside's former docs redirect to Edisyl today; do not assume continuity. [Dune](https://docs.dune.com/), [DefiLlama methodology](https://docs.llama.fi/), [redirect entry](https://docs.flipsidecrypto.xyz/) |
| Independent transaction inspection | Solscan | Explorer evidence helps verify signatures; no assurance that a vendor's mark, attribution or P&L matches it. [Documentation](https://docs.solscan.io/) |
| Signing and transaction landing | Turnkey; Jito | Useful for execution products, unnecessary for RANGE's current read-only pilot. [Turnkey](https://docs.turnkey.com/welcome), [Jito](https://docs.jito.wtf/) |

## Status verification and limits

“Public source reachable” means a public document or interface responded. It does **not** mean a funded action succeeded, accounts are unrestricted, security was audited, or a product has paying users. Raw unauthenticated HTTP captures, response hashes and failures are in [manifest.json](evidence/landscape/manifest.json); the web reader additionally inspected sources whose direct HTTP requests failed. Differences between fetch paths are retained rather than bypassing TLS or access restrictions.

The Grid public product query is preserved in [grid-discovery.json](evidence/landscape/grid-discovery.json). Its status labels aid discovery; primary sources control present-day consequential claims. No Colosseum account connection or paid research was required. Social identities are not guessed from names; unidentified accounts remain unknown in the CSV.

**Confirmed:** native management, managed vaults, LP automation and adjacent accounting are populated categories. **Inference:** RANGE competes for a specific decision workflow rather than an empty feature category. **Hypothesis:** independent, uncertainty-aware decision evidence could still matter to a narrow cohort. **Missing:** independent paid usage, retention, comparative accounting accuracy and willingness to pay.
