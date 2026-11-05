# Ecosystem integration map

As of **2026-10-20**. This is an implementation feasibility assessment, not a shipped integration or usage forecast.

## Current Jupiter components

| Component | Real functionality | Boundary relevant to this project |
|---|---|---|
| [Swap API V2](https://developers.jup.ag/docs/swap) `/order` + `/execute` | Amount-specific route/transaction and managed execution; quote-only request omits taker. | An assembled order transaction cannot be modified to insert LP instructions. Returned quotes are current, not historical evidence. |
| [Swap `/build`](https://developers.jup.ag/docs/swap/build) | Raw Metis routing instructions for custom composition with LP withdrawal/deposit instructions. | Own simulation, signing, landing and account/compute limits; excludes RFQ routing available to `/order`. Atomic completion depends on the transaction fitting and succeeding. |
| [Price V3](https://developers.jup.ag/docs/price) | Current USD reference with block identifier and decimals; unpriceable mints may be omitted. | Not an executable quote, historical feed or safety guarantee. Never substitute it into past P&L. |
| [Tokens V2](https://developers.jup.ag/docs/tokens/token-information) | Mint metadata, search and trading/quality context for selecting supported assets. | Organic/suspicion signals are inputs, not proof of safety. Verify account decimals/mints on-chain for financial calculations. |
| [Trigger V2](https://developers.jup.ag/docs/trigger) | USD-conditional swaps, OCO/OTOCO and recurring orders after token deposit. | Custodial Privy-managed vault and API key/JWT flow; not a controller for tokens still inside a DLMM position. Requires separate LP withdrawal orchestration. No integrator fees currently documented. |

The current swap documentation describes free-key access at 1 request/second and keyless testing at 0.5 requests/second. Infrastructure, landing, pool and swap charges must be read from the chosen flow/quote; do not hardcode a universal fee or assume free API means free execution. Legacy Ultra/Swap V1/Recurring examples are not the recommended starting point. [Swap docs](https://developers.jup.ag/docs/swap), [Trigger migration/status](https://developers.jup.ag/docs/trigger).

## Hypothesis-specific fit

| Opportunity | Meaningful Jupiter use | Required Meteora functionality | Expected ecosystem benefit; confidence | Superficial integration to avoid |
|---|---|---|---|---|
| LP Decision Engine | Compare current inventory mark with amount-specific liquidation quotes; disclose slippage, route/landing costs and quote age. Optional user-approved execution later. | Read position ranges, bins, balances and fee claims via verified SDK/schema; native pool discovery context. | More informed LP entry/exit decisions; measurable quote-to-action conversion only in a later pilot. Medium confidence in utility, low in adoption. | Logo plus live prices while recommendations ignore executable size/cost. |
| Smart LP Intelligence / persistence | Quote the cost of implementing a selected strategy today; optional swap handoff. | Complete lifecycle/owner/operator histories, comparable cohorts and consent-aware strategy attribution. | Could reduce inappropriate strategy copying; Jupiter execution benefit indirect. Low confidence without demand or prospective persistence results. | Claiming Jupiter supplies historical wallet P&L or strategy persistence scores. It does not through these endpoints. |
| Liquidity execution automation | `/build` composes token conversion with permitted DLMM actions; `/order` can support standalone legs when atomic composition is unnecessary. | Explicit position operator authority, withdraw/rebalance/add/claim, account creation/rent and failure recovery. | Strongest direct swap activity potential; possibly lower manual friction. High architectural fit, unproven cost/reliability improvement. | Treating Trigger swap orders as permission to withdraw a user's LP or promising zero failures. |
| DLMM backtesting | Current quote used only for a clearly separate live deployment preview; optional later execution handoff. | Historical bins/liquidity/fees, dynamic fees, events, valuation and execution assumptions. | Research may improve LP selection, but direct swap effect weak until deployment. Low confidence. | Using today's routes/prices to simulate past fills; Jupiter cannot fill the historical data gaps this way. |

Use the [official DLMM SDK](https://github.com/MeteoraAg/dlmm-sdk) and [native terminal guide](https://github.com/MeteoraAg/docs/blob/main/user-guides/how-to-use-dlmm/dynamic-terminal.mdx). Current documentation describes dynamic positions up to 1,400 bins; never assume the old 69-bin UI default is a universal position limit. Existing [position reconstruction](POSITION_RECONCILIATION.md) demonstrates why event aliases, partial withdrawals and costs require care.

## Swap activity: transparent scenario only

An illustrative monthly model is `active users × actions per user × swaps per action × average swap notional`.

With **assumed** 100 users, four rebalance actions, one swap/action and $500 swap notional, gross routed volume would be **$200,000/month**. This is not revenue, incremental ecosystem volume or a forecast. At zero to two swaps/action it ranges from $0 to $400,000; swapless rebalances contribute no Jupiter swaps. Migrating existing Tidepool/HawkFi activity may only redistribute existing volume. Repeated conversions can worsen user outcomes.

The proposed read-only demand MVP generates **zero executed swaps by design**. Later measure executed notional attributable to the product, total fees/failed costs, completion rate and improvement versus an existing workflow, with user approval. Do not optimize a grant narrative around unnecessary turnover.
