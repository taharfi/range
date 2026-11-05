# LP Workflow Friction

**Reviewed:** 2026-10-21

## Evidence-backed friction

1. **Manual out-of-range response:** public requests describe closing, swapping and reopening after price moves; current automation products address this but add custody and failure risk.
2. **Range and chart interpretation:** earlier public requests sought charts and range controls together; native products now cover much of the basic need.
3. **Metric interpretation:** users request historical context for fee, TVL and volume metrics; current ratios can be misleading without time-weighted denominators and inventory entitlement.
4. **Fragmented tools:** LP Army strategy cards explicitly describe tool sequences before opening a position, indicating switching costs.
5. **Accounting uncertainty:** RANGE and competitor documentation both acknowledge different boundaries for PnL; current position performance is not automatically all-in realized return.
6. **Copying risk:** public records include objections to unauthorized copying, so “smart wallet” discovery needs consent, attribution and uncertainty controls.

## Workflow map

| Step | Existing surfaces | Friction | RANGE opportunity |
|---|---|---|---|
| Discover token/pool | Native terminal, community tools, indexers | Many metrics and unknown freshness | Explain ranking inputs and source age |
| Select strategy | LP Army guides, native presets, custom tools | Rules are incomplete or hard to compare | Normalize assumptions and risk |
| Choose range | Charts, indicators, DLMM presets | No universal best range; regime changes | Show inventory/range scenarios |
| Enter | Native UI, zaps, automation tools | Signing, slippage, rent and account costs | Keep quote-aware planning read-only first |
| Monitor | Alerts, dashboards, bots | Missed moves and noisy alerts | User-configurable alerts with evidence |
| Rebalance/exit | Native actions, Jupiter, automation | Authority, cost and failure recovery | Decision brief and explicit execution handoff |
| Reconcile | Provider PnL, wallet history | T0/T3 swaps and external flows may be omitted | Label accounting boundary and confidence |

## Design principle

Progressive disclosure is appropriate: start with one decision and reveal technical evidence, assumptions, costs and uncertainty only as needed. A broader platform should be modular rather than a dense all-in-one dashboard.
