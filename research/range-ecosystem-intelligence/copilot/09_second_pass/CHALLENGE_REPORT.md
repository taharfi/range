# RANGE Second Pass: Challenge Report

**Review date:** 2026-10-21  
**Scope:** public, read-only evidence; no product or application changes

## Executive conclusion

The original LP Decision Intelligence recommendation remains the best *first validation wedge*, but the first sprint understated two adjacent opportunities: (1) implementation-quality strategy discovery and simulation, and (2) observability for execution and accounting failures. The evidence does **not** justify jumping directly to custody, autonomous rebalancing or an all-in-one operating platform. It does justify repositioning the wedge as a measurable LP research and reliability layer that can later feed automation.

## 1. What the first sprint missed

### LP Army coverage

The live [LP Army Strategy Library](https://www.lparmy.com/strategies) currently advertises **374 strategies**, **114 contributors**, and named creator counts. The rendered page exposes only a limited current card set and the page JavaScript initializes an `initialItems` set, displays 24 items initially and adds 12 when an intersection observer fires. In this session, only eight cards had usable titles and descriptions; 24 X-linked source IDs were visible in the rendered page, but most article bodies were not accessible. Therefore:

- Library count discovered: 374 (site headline; not independently enumerated).
- Distinct source links observed in current render: 23 after de-duplication (15 were new relative to the eight baseline records).
- Strategies successfully analyzed: 8 baseline cards.
- Additional source links inventoried but not analyzed: 12.
- Inaccessible or not exposed from the archive: at least 351 by comparison with the 374 headline, but the exact inaccessible count cannot be proven without an export/API.

The first sprint reported eight as if they were the practical corpus. The better conclusion is that LP Army has a much larger strategy publishing surface, but its accessible evidence is highly compressed into titles, summaries and links. The expanded inventory is in `04_strategies/LP_ARMY_STRATEGIES_SECOND_PASS.csv`.

### User evidence

The first sprint had 43 public records, heavily concentrated in Meteora governance and existing issue data. This pass adds 25 independent dated public GitHub reports. They are valuable first-hand evidence of implementation and operational pain, but they are **not equivalent to 25 retail LP interviews**. The new corpus is therefore evidence for reliability, accounting, range construction, SDK ergonomics and execution friction—not willingness to pay.

### Competitor traction

Public product surfaces are plentiful, but product-specific usage remains difficult to verify. The first sprint correctly avoided protocol TVL and followers; this pass confirms that most competitors still have unknown adoption when the standard is managed wallets, product-tagged transactions, disclosed revenue or independently verifiable users.

## 2. New evidence

### Strategy evidence

The accessible cards reinforce several recurring decision classes:

1. **Regime protection:** bear-market survival and capital preservation.
2. **Directional positioning:** spot or pump-and-dump setups.
3. **Microstructure:** bid-ask bounce and token-sided flow.
4. **Indicator-based range selection:** Fibonacci plus trend/volatility indicators.
5. **Tool-first workflows:** users assemble multiple tools before entering a pool.
6. **Protocol-native shortcuts:** Ape In reduces setup friction but does not define a complete risk policy.

Most cards do not expose machine-testable entry, exit, range or rebalance rules. That is itself a product signal: strategy *discovery* exists, while strategy *formalization and simulation* remains weak.

### New dated user/developer evidence

The 25 new reports include:

- event/indexing failures and missing emitted events;
- stale IDL/account deserialization problems;
- fee double-counting;
- invalid position widths and imbalanced-position behavior;
- insufficient bin-array liquidity and slippage failures;
- wrong quote values;
- remove-liquidity and bitmap-account errors;
- SDK import, Python client and documentation friction;
- a public sampled failure study reporting exceeded-slippage failures and a repair workflow.

The complete provenance-preserving dataset is `05_users/USER_EVIDENCE_SECOND_PASS.csv`. These reports make accounting correctness and execution observability stronger opportunities than the first sprint showed.

## 3. Evidence that contradicts the original recommendation

### Contradiction 1: Strategy discovery may be a larger top-of-funnel

LP Army’s stated 374-strategy library and 114 contributors indicate sustained content supply. The accessible cards show users expressing concrete heuristics, not merely asking for dashboards. A product that converts these heuristics into comparable, testable templates could attract users before they have enough history for personalized decision intelligence.

**Limit:** publishing volume is not user demand, usage or profitability. The archive’s inaccessible content prevents measuring quality, readership or repeat use.

### Contradiction 2: Execution and accounting reliability is a sharper unmet need

The new issue corpus contains repeated reports around incorrect quotes, duplicated fees, account-layout drift, invalid ranges, missing events and slippage. A decision score that is not backed by reliable lifecycle accounting can create false confidence. This suggests an initial product may need a “why this result is trustworthy” and “what failed” layer, not only a recommendation.

### Contradiction 3: Automation demand is real but risk-heavy

Prior governance evidence requested out-of-range swaps, stop loss and unattended management. New technical reports show why automatic execution is difficult: stale state, slippage, account prerequisites, range validity and missing events. Demand supports automation, but the evidence contradicts a conclusion that automation is a low-risk first product.

### Contradiction 4: Copytrading has distribution appeal but weak trust evidence

LP Agent, MetEngine and Tidepool publicly advertise wallet intelligence/copy workflows. However, no comparable verified managed-wallet, retention or revenue evidence was established. Copying another wallet also inherits unknown external transfers, opening prices and risk policy. This supports wallet intelligence as a discovery input, not an immediate custody product.

## 4. Independent product-direction comparison

Scores below are analyst judgments using the same six dimensions as the first scorecard: verified demand 25%, differentiation 20%, feasibility 15%, ecosystem value 20%, distribution 10%, monetization/defensibility 10%. They are independent second-pass judgments, not measured probabilities.

| Direction | Score | Strongest supporting evidence | Strongest contradicting evidence |
|---|---:|---|---|
| A. Decision intelligence | 69 | Repeated range, timing, monitoring and accounting pain; existing Meteora/Jupiter data boundary is feasible | Recommendations are only as reliable as historical accounting and price normalization |
| B. Strategy discovery and simulation | 72 | 374-library headline, diverse heuristics, weak formalization and demand for backtesting/strategy discovery | Most published rules are inaccessible or non-machine-testable; backtests can mislead |
| C. LP automation | 64 | Direct requests for stop loss, out-of-range swap and unattended management | Slippage, stale state, account errors and signing liability make failure costly |
| D. Wallet intelligence and copytrading | 57 | Public competitors advertise smart-LP scores and copy flows | Adoption is unverified; wallet PnL is confounded by transfers and external swaps |
| E. Unified LP portfolio management | 67 | Users need lifecycle accounting, claims, positions and cost visibility | Integrations and normalization expand quickly; many surfaces are already advertised |
| F. All-in-one LP operating platform | 55 | Could unify discovery, decisions and actions | Broad scope, custody/security burden, incumbent protocol surfaces and unknown willingness to pay |

**Ranking change:** B moves narrowly ahead of A for a from-scratch product thesis, while A remains the safer first experiment because its data path and success criteria are more bounded. E is a credible second wedge. C should be gated by evidence; D and F should not lead.

## 5. Top three opportunities

### 1. Strategy-to-simulation research layer

Convert published or user-authored heuristics into explicit parameters: token universe, regime, range width, distribution, rebalance trigger, exit and cost assumptions. Compare realized lifecycle outcomes with clear “unverified” labels. This is differentiated from a generic pool screener because it makes strategy rules inspectable and falsifiable.

### 2. LP reliability and accounting observability

Explain missing events, duplicate aliases, stale IDLs, invalid ranges, quote/fee inconsistencies and transaction failures. Produce a confidence grade and an actionable data-quality trace alongside every PnL or decision result. This directly addresses the new technical evidence and improves trust in any later automation.

### 3. Guardrailed portfolio decision workspace

Unify positions, range state, fee claims, cost estimates, alerts and recommended actions without signing or custody. Add an explicit “prepare but do not execute” transaction boundary. This retains the low-risk wedge while creating a path to partner or user-controlled execution.

## 6. Three practical validation experiments

1. **Strategy replay cohort:** recruit 10–15 LPs or strategy authors and encode 10 published strategies. Success: at least 6 rulesets become explicit enough to replay, and at least 5 participants return to compare outcomes twice in two weeks.
2. **Reliability audit:** run 50–100 historical or live-read-only position cases through lifecycle reconciliation. Success: identify at least 10 previously unexplained data-quality or accounting discrepancies and obtain agreement from three users that the trace changes trust or action.
3. **Guardrailed alert concierge:** deliver out-of-range, fee-rate, slippage and rebalance alerts for 10 wallets without signing. Success: at least 5 users act on two or more alerts, and no alert causes a user to claim it was materially misleading.

## 7. Competitor traction review

The ten most relevant products remain **unknown** for independently verified active users, managed TVL, product-specific transaction counts or revenue unless explicitly disclosed:

| Product | Public capability evidence | Product-specific adoption evidence | Status |
|---|---|---|---|
| LP Agent | Smart-LP scoring, copy LP, automation, API, fees | Public docs and pricing only | Unknown |
| MetEngine | Terminal, extension, bot, wallet analytics, copy and PnL claims | Public product surfaces; no verified usage count | Unknown |
| Meridian | Public autonomous-agent repository and site | Developer artifact, no production adoption proof | Unknown |
| HawkFi | Directory listing and public product claim | Homepage rate-limited during first pass; no verified metric | Unknown |
| Tidepool | Discovery, wallet watching, zaps, rebalance and bot API claims | Public docs/action fees; no verified users | Unknown |
| Meteora Dynamic Terminal | Official pool/position management and monitoring | Protocol product, but terminal-specific adoption not isolated | Unknown |
| Pool Party | Community directory/product presence | No product-specific metric established | Unknown |
| Liquid Nova | Automated Meteora position-management claims | No independently verified managed capital or users | Unknown |
| Kamino | Automated liquidity vaults and kTokens | Vault-level protocol data exists, but comparable product-user attribution was not collected | Unknown for this comparison |
| Revert | Strong public accounting methodology and product history | EVM product evidence, not comparable Solana adoption | Unknown for Solana |

No product-specific on-chain program or tagged managed-wallet set was verified for a defensible ranking. The appropriate conclusion is unknown, not zero.

## 8. Five technically achievable differentiators

| Capability | User value | 2–4 week test | Why not commoditized |
|---|---|---|---|
| Strategy rule compiler | Turns prose heuristics into replayable parameters | Encode 10 public strategies and measure replay completeness | Existing directories publish content; they do not normalize rules |
| Lifecycle accounting confidence trace | Shows why PnL is trusted or incomplete | Reconcile 50 positions with event aliases, claims and prices | Generic dashboards hide provenance and ambiguity |
| Failure-aware range validator | Prevents invalid widths, missing accounts and stale state before action | Read-only validation across 100 pool/range candidates | Pool screens rarely explain protocol-specific failure causes |
| Cost-aware rebalance simulator | Compares hold, move and exit including slippage/rent/claims assumptions | Replay 20 historical range transitions with explicit costs | APR screens usually omit personalized action costs |
| Wallet thesis diff | Compares a watched wallet’s position changes with the follower’s constraints, without copy execution | Read-only alerts for 10 wallets and 20 events | Copy products emphasize action; a transparent thesis/risk diff is safer and more inspectable |

All five remain read-only or prepare-only. They use public Meteora account/Data API surfaces, RPC, SDK conventions and Jupiter quote/price inputs, while clearly separating current quotes from historical fills.

## 9. Remaining unknowns

- The actual 374-card LP Army archive cannot be independently enumerated from the public rendered page in this session.
- The 25 new reports are developer/technical evidence, not retail willingness-to-pay evidence.
- Competitor active users, managed capital, retention and revenue remain mostly unknown.
- Historical price, fee, rent and transfer reconstruction still limits simulation validity.
- It is unknown whether users prefer a paid research tool, alerts, API access or execution fees.
- It is unknown whether strategy authors will license or expose enough rules for formal simulation.

## Sources

- [LP Army Strategy Library](https://www.lparmy.com/strategies)
- [Meteora DLMM SDK issues](https://github.com/MeteoraAg/dlmm-sdk/issues)
- [Meteora Invent issue 83](https://github.com/MeteoraAg/meteora-invent/issues/83)
- Existing Sprint 1 sources and evidence files under `01_ecosystem/` through `08_final/`
