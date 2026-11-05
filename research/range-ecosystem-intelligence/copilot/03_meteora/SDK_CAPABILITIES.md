# Meteora SDK and Program Capability Notes

**Reviewed:** 2026-10-21  
**Primary sources:** [DLMM guide](https://docs.meteora.ag/developer-guides/dlmm), [TypeScript SDK guide](https://docs.meteora.ag/developer-guides/dlmm/typescript-sdk/getting-started), [instructions](https://docs.meteora.ag/developer-guides/dlmm/program/instructions), [accounts](https://docs.meteora.ag/developer-guides/dlmm/program/accounts), [events](https://docs.meteora.ag/developer-guides/dlmm/program/events)

## Capability map

| Capability | Official surface | Read-only possible | Transaction required | RANGE assessment |
|---|---|---:|---:|---|
| Pool discovery and current state | Data API; SDK pool client | Yes | No | Reusable |
| Position and bin inspection | Data API; accounts; SDK | Yes | No | Reusable with validation |
| Historical position events | Data API historical endpoint; program events | Yes | No | Useful, but reconcile aliases and completeness |
| Pool OHLCV and volume | Data API | Yes | No | Context only; not automatically LP return |
| Add/remove liquidity | SDK/instructions | Buildable | Yes | Defer until authority and cost model are ready |
| Rebalance | `rebalance_liquidity`; SDK | Buildable | Yes | High value, high operational/security burden |
| Fee and reward claims | SDK/instructions/Data API claims | Buildable | Yes for claims | Keep separate from principal accounting |
| Swaps | SDK/instructions; Jupiter can complement routing | Quote or build | Yes to execute | Read-only quote is current MVP boundary |
| Limit orders | SDK/instructions/Data API | Inspect | Yes to place/cancel | Strategy opportunity, needs lifecycle monitoring |
| Dynamic positions | `PositionV2`, resize instructions | Inspect/build | Yes to resize | Verify per-position compatibility |
| Token-2022 support | v2 instruction families and SDK helpers | Yes | Depends | Validate each mint/account |
| Rust CPI | commons library and CPI guide | No action by itself | Yes when composed | Useful for custom program integrations |

## What the SDK does not solve by itself

The SDK provides construction and protocol interaction primitives. It does not establish:

- a complete historical price feed;
- user-level net P&L with all cash flows and costs;
- an authority policy for RANGE;
- transaction landing or confirmation guarantees;
- product-level risk disclosures;
- a durable wallet/indexing service;
- cross-protocol normalization.

Those remain product and infrastructure responsibilities.
