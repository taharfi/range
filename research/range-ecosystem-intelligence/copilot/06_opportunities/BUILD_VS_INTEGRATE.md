# Build vs Integrate vs Partner

**Reviewed:** 2026-10-21

| Capability | Recommendation | Rationale |
|---|---|---|
| Current Meteora position adapter | BUILD/REUSE | Existing RANGE capability and product-specific validation matter |
| Jupiter quote comparison | INTEGRATE | Jupiter is the source of routing/quote functionality; do not reproduce it |
| Meteora SDK instructions | INTEGRATE selectively | Use official SDK for protocol actions; keep signing policy in RANGE |
| Meteora documentation MCP | INTEGRATE later | Read-only documentation aid; no product value by itself |
| Historical price and accounting | BUILD validation layer | Provenance, benchmark and missing-data semantics are differentiating |
| Wallet/event indexing | BUILD narrowly or PARTNER | Start with bounded Meteora coverage; avoid rebuilding broad infrastructure without demand |
| Alerts delivery | PARTNER/INTEGRATE | Existing alert tools and messaging channels may reduce time to market |
| Strategy content | PARTNER/curate | LP Army authors and tools have distribution; do not present community claims as verified alpha |
| Transaction execution | DEFER/INTEGRATE | Use native Meteora/Jupiter or a reviewed execution adapter before custom automation |
| Copytrading | DEFER | Consent, attribution and harm evidence are unresolved |
| Cross-protocol accounting | DEFER | Requires distinct adapters and historical validation |
| Full backtesting | DEFER | Data gaps and false precision risk are high |

## Partner shortlist

- LP Army ecosystem for distribution and strategy feedback.
- Read-only alert tools for notification handoff.
- Meteora for documentation, API and protocol feedback.
- Jupiter for quote/routing integration feedback.
- Existing analytics/API products only if methodology, licensing and privacy terms are clear.
