# Meteora Data Sources

**Reviewed:** 2026-10-21  
**Primary source:** [DLMM Data API overview](https://docs.meteora.ag/developer-guides/dlmm/api-reference/overview)

| Data family | Documented endpoint/surface | Likely RANGE use | Verification caveat |
|---|---|---|---|
| Pools | `GET /pools`, groups and single-pool routes | Discovery and current pool context | Pagination, sorting, freshness and valuation semantics |
| OHLCV | `GET /pools/{address}/ohlcv` | Charts and scenario context | Does not equal LP inventory or realized return |
| Historical volume | `GET /pools/{address}/volume/history` | Activity context | Bucket semantics and gaps require checks |
| Open portfolio | `GET /portfolio/open` | Current wallet discovery | Indexed view can lag or omit unsupported states |
| Closed portfolio | `GET /portfolio` | Historical position discovery | Completeness and account closure semantics require validation |
| Portfolio total | `GET /portfolio/total` | Cross-pool summary | Must reconcile with transaction-level accounting |
| Position historical events | `GET /positions/{address}/historical` | Event reconstruction | Alias duplication and partial flows require deduplication |
| Position PnL | `GET /positions/{pool_address}/pnl` | Provider comparison | Do not treat provider PnL as independently verified USD accounting |
| Protocol stats | `GET /stats/protocol_metrics` | Ecosystem context | Aggregate metrics are not third-party product adoption |
| Limit orders | Wallet/pool open/closed/summary routes | Order monitoring | Fill and claim semantics need lifecycle handling |
| Wallet claims | `GET /wallets/{wallet}/pools/{pool}/total_claims` | Fee/reward evidence | Claims are not equivalent to total LP profitability |
| Program accounts | RPC + published IDL | Independent validation | Raw accounts require exact schema and slot context |
| Program events | Anchor event CPI payloads | Indexing and reconciliation | Event presence does not guarantee exhaustive history |

The documentation states a **30 requests/second** limit for DLMM APIs. Any future collector must preserve rate limits, cache raw responses, retain retrieval timestamps and record schema revisions. RANGE's existing research already demonstrates why source values need reconciliation before being labeled USD or net profit.
