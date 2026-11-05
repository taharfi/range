# Meteora Developer Resources

**Reviewed:** 2026-10-21  
**Sources:** [DLMM developer guide](https://docs.meteora.ag/developer-guides/dlmm), [DLMM API overview](https://docs.meteora.ag/developer-guides/dlmm/api-reference/overview), [DLMM TypeScript SDK getting started](https://docs.meteora.ag/developer-guides/dlmm/typescript-sdk/getting-started), [program instructions](https://docs.meteora.ag/developer-guides/dlmm/program/instructions), [program events](https://docs.meteora.ag/developer-guides/dlmm/program/events)

## What is officially available

Meteora documents DLMM integration through four complementary surfaces:

1. **Official TypeScript SDK** — pool clients, swaps, liquidity, rewards, limit orders and Token-2022 helpers.
2. **Rust integration resources** — CPI and commons-library integration.
3. **Published program references** — accounts, instructions, events, errors and the deployed `lb_clmm` IDL.
4. **DLMM Data API** — indexed read-only pools, portfolios, positions, historical events, PnL, OHLCV, historical volume, stats, limit orders and wallet claims.

The DLMM guide states that the `lb_clmm` program source is not open source. Integrators should use the published IDL, official SDK, on-chain account data and Data API. This matters for RANGE: public integration is feasible, but program-level behavior should not be inferred from unavailable source.

## Implications for RANGE

- Current position intelligence can continue using the Data API, with RPC/account validation where the financial meaning requires it.
- A future execution module can use the SDK or compose CPI-compatible instructions, but signing and transaction submission remain separate responsibilities.
- Event references are useful for an indexer, but event coverage does not by itself solve historical valuation: inventory, cash flows, claims, token prices, costs and timing still need reconciliation.
- The Data API exposes historical position events and PnL routes, which should be compared against RANGE's existing lifecycle work rather than assumed to be a complete accounting ledger.
- `initialize_position2`, dynamic-position sizing, permissionless operation bits and `rebalance_liquidity` are especially relevant to future position-management research.

## Official limits and cautions

- The API documentation states a 30 requests/second limit for DLMM APIs.
- API pagination and query semantics must be preserved in any collection job.
- The SDK guide recommends devnet scripts and transaction simulation for public integration testing; some end-to-end tests depend on fixtures or builds not included in the public program source.
- Token-2022 support exists in current instruction families, but each future RANGE flow must verify mint/account compatibility rather than generalize from SPL-token-only examples.

## Reuse recommendation

**Use:** official SDK and Data API for read-only position and pool workflows; official IDL/account references for validation; event references for targeted indexing.  
**Do not assume:** public program source, complete historical PnL, execution reliability, or universal cost coverage.  
**Research priority:** reconcile the documented historical endpoints against RANGE's known event aliases, partial withdrawals and price uncertainty before adding any financial claim.
