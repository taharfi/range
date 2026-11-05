# Jupiter and Meteora Alignment

**Reviewed:** 2026-10-21

## Meteora value

RANGE can help LPs understand positions, ranges, fees and trade-offs using Meteora's Data API, SDK references and current protocol state. Potential ecosystem value is better onboarding, clearer risk communication and more informed position management. These are hypotheses; no retention or liquidity improvement is proven.

## Jupiter value

Jupiter supplies current amount-specific swap quotes, route/build surfaces and current token prices. RANGE can use quotes to expose conversion cost and execution constraints in an exit/rebalance brief. The read-only MVP generates zero executed swaps, so no incremental Jupiter volume should be claimed.

## Alignment matrix

| Opportunity | Meteora role | Jupiter role | Evidence state | Recommendation |
|---|---|---|---|---|
| Decision brief | Position/range/fee context | Current conversion quote | Technically feasible; demand unproven | BUILD read-only |
| Quote-aware handoff | SDK/instructions | `/order` or `/build` | Requires signing and failure handling | DEFER execution |
| Alerts | Position/range state | Price/quote age context | Feasible, reliability untested | EXPERIMENT |
| Historical PnL | Events/API | Current price only, not historical ledger | Incomplete | Do not overclaim |
| Zap/rebalance | Official SDK or Invent | Swap/composition | High security/operational complexity | DEFER |

## Critical boundaries

- Jupiter Price API is current, block-identified reference data; it is not historical LP valuation.
- Jupiter quotes are current and amount-specific; they are not evidence of past fills.
- Meteora protocol primitives do not supply a complete independent historical net-return ledger.
- Execution needs signer authority, simulation, slippage, account/rent handling, landing and recovery.
