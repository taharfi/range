# API feasibility — 2026-10-19

## Inspected official evidence

- [Swagger UI](https://dlmm.datapi.meteora.ag/swagger-ui/), whose initializer specifies `/api-docs/openapi.json`.
- [Meteora OpenAPI](https://dlmm.datapi.meteora.ag/api-docs/openapi.json), saved at `data/evidence/meteora-openapi.json`. Request base: `https://dlmm.datapi.meteora.ag`. No authentication required for the successful pool probe.
- [Meteora documentation repository](https://github.com/MeteoraAg/docs), which links to [official docs](https://docs.meteora.ag).
- [Jupiter documentation](https://developers.jup.ag/docs), [index](https://developers.jup.ag/docs/llms.txt) and [Swap overview](https://developers.jup.ag/docs/swap/index.md), saved as `data/evidence/jupiter-swap.md`.

## Capability map

| Capability | Verified schema route | Prerequisite / limit | Live tested |
|---|---|---|---|
| Pool discovery | `GET /pools` | 1-based page, page_size <=1000, sort_by; no wallet needed | Yes |
| Pool detail | `GET /pools/{address}` | Known pool | No |
| Historical prices | `GET /pools/{address}/ohlcv` | Known pool; timeframe, start_time/end_time in seconds | No |
| Historical volume | `GET /pools/{address}/volume/history` | Known pool; time-bounded series | No |
| Open portfolio | `GET /portfolio/open?user=...` | Known wallet | No |
| Closed-position portfolio | `GET /portfolio?user=...` | Known wallet; days_back documented maximum 365 | No |
| Position P&L | `GET /positions/{pool_address}/pnl?user=...` | Known pool + wallet; status and pagination | No |
| Position events | `GET /positions/{address}/historical` | Known position; event_type add/remove/claim_fee/claim_reward | No |
| Accumulated claims | `GET /wallets/{wallet}/pools/{pool_address}/total_claims` | Known wallet + pool | No |
| Protocol daily metrics | `/stats/daily/volume`, `/trading_fees`, `/protocol_fees` | Protocol aggregates, not LP performance | No |

No route in this snapshot enumerates all historical LP wallets or all positions across pools. `src/research/discovery.py` defines a pluggable discovery protocol; no indexer is connected. A complete cohort requires historical transaction indexing including closed accounts. Current program-account scans alone cannot supply this.

Jupiter currently documents `https://api.jup.ag/swap/v2/order`, with inputMint, outputMint and integer atomic-unit amount. Omitting taker returns a quote without a transaction; keyless access documented at 0.5 RPS. This is documentation verification only: no Jupiter request or adapter implemented yet. Inspect the endpoint's full current OpenAPI before implementing slippage, impact, routing and cost mappings. Live quotes cannot establish historical fills.

The first urllib probe returned HTTP 403; curl with a browser user agent succeeded. Collector uses a descriptive browser-compatible user agent, does not retry 403, and does not bypass authentication. No published Meteora rate guarantee established; conservative 1.1-second request spacing is a local policy.

## Stage result

Scaffolding and local pool persistence are implemented and tested. PostgreSQL migration and Docker configuration are supplied; their runtime validation is recorded in RESEARCH_FINDINGS.md. Historical/position ingestion, reconciliation, Jupiter integration and frontend remain subsequent stages.

Phase 2 update: pool OHLCV and volume/history routes, position historical events, public RPC account queries and limited event decoding have now been exercised. See PHASE2_FINDINGS.md and DATA_QUALITY_REPORT.md for current evidence and gaps. `meteora-openapi-phase2.json` was fetched again on 2026-10-19 and matches the original schema. No historical pool TVL series endpoint was found. Jupiter integration, complete LP reconciliation and frontend remain unimplemented.
