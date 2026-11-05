# Competitor Architecture Notes

**Reviewed:** 2026-10-21  
**Evidence rule:** public docs and public code only; backend architecture is not inferred from marketing pages.

| Product | Verified public architecture signal | Inference boundary | RANGE lesson |
|---|---|---|---|
| RANGE | Next.js pilot, TypeScript adapters, Meteora Data API/RPC validation, Jupiter quote-only path, Python DuckDB/Parquet research | Production indexing and multi-instance state are not present | Keep read-only adapters and research artifacts separate from execution |
| LP Agent | Public API with API-key auth, rate limits, Solana Meteora/DAMM routes, transaction-building/Jito/RPC route families | Internal indexer and custody implementation are not fully public | API consumers need rate-limit, plan and attribution disclosures |
| Meridian | Public JavaScript repository with agent, screener and manager tool boundaries; LLM-powered description | Production deployment and safety controls cannot be assumed from repo | Agent tool boundaries are useful, but execution policy is a separate layer |
| MetEngine | Public docs describe terminal, extension, Telegram bot and Data Agent | Backend/indexer, MEV implementation and data provenance not verified | Distribution and API packaging can be a differentiator |
| Meteora | Official SDK, IDL, Data API and program references; program source not open | Exact runtime behavior must be tested against docs/IDL/chain | Use official surfaces and preserve source semantics |
| Revert | Public accounting methodology and benchmark definitions | Implementation and data providers are not fully inspected here | Definitions and reconciliation can be product moat |
| Kamino | Vault/kToken model documented | Vault strategy internals and current performance not reviewed | Cross-protocol adapters require distinct exposure models |

## Data architecture themes

Across the public evidence, serious LP products need some combination of:

- protocol-specific account/event indexing;
- current pool and position state;
- historical cash-flow and price snapshots;
- notification/event processing;
- transaction construction and signer/custody controls;
- explicit fee, gas, rent and slippage treatment.

RANGE already has parts of the first three for a bounded Meteora decision brief. Full automation would add an operational and security system, not just UI features.
