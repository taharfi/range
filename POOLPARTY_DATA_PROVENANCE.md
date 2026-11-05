# Pool Party data provenance — REA investigation

Evidence captured **2026-10-19 UTC**; final review **2026-10-20 (Africa/Casablanca)**. Used **REA 6.7.0** from [morluto/rea](https://github.com/morluto/rea). This extends the [API audit](POOLPARTY_API_AUDIT.md); it does not establish a public data API or change the profitability pipeline.

## What we actually ran

- Downloaded **19 JavaScript assets, 1,006,919 bytes**, referenced normally by the already retrieved public application/guide HTML. No guessed application routes, hidden chunks, private profiles or member-data endpoints were requested.
- Ran REA's [static JavaScript application analysis](https://github.com/morluto/rea/blob/main/docs/javascript-artifact-reconstruction.md), selecting the shared application layout, beta gate and wallet/authentication UI chunk. It inventories all 19 files but analyzes **3**, leaving **16 outside analysis scope**. Target JavaScript is parsed as inert text, not executed.
- Analysis succeeded: **0 parse failures**, **16,406 visited AST nodes**, **95 findings**, **21 modules**. These are REA graph/extraction statistics, not counts of backend services or live network calls.
- Ran two [application feature traces](https://github.com/morluto/rea/blob/main/docs/javascript-application-workflows.md), seeded on the sync and profile request prefixes. Both commands succeeded. Trace relationships include static inference and have **partial** coverage; they are not runtime captures or proof that backend handlers executed.
- Used the pinned npm CLI without running `setup` or changing agent/MCP configuration. No subscription, account creation, wallet operation, authenticated session or server mutation was performed.

Raw evidence is under `data/poolparty_rea/`: asset hashes/source URLs, REA invocation, full analysis JSON, endpoint evidence and two traces. The main analysis is approximately 21.5 MB. REA evidence ID: `ev_9dcc6c08cfac8014f113650479808b43fcdbd79aae2a95e4dcbcd9390188f45c`.

## Data path recovered from the public client

```text
Pool Party browser
  ├─ session/member gate
  ├─ own-backend profile request → JSON user + snapshot consumed by UI
  ├─ member-specific backend sync request → local refresh event on success
  └─ wallet provider configured with public Solana RPC

Pool Party backend
  ├─ Meteora-derived performance/position data       [documented by Pool Party]
  ├─ retained closed-position history                [documented privacy policy]
  └─ exact upstream endpoints, RPC/indexers,
     price sources and accounting implementation     [not established]
```

### Source-located observations

These are **internal browser request constructions**, not authorized developer API endpoints. They were inspected offline and **not invoked**.

| Observation | Evidence | What it establishes / limitation |
|---|---|---|
| Profile data comes through Pool Party's own backend | [Public layout asset](https://lppool.party/_next/static/chunks/app/layout-5df69c64b00dd100.js), REA source range line 1, columns 4717–4786. A `fetch` builds `/api/users/` plus an encoded runtime identifier; its JSON consumer reads `user` and `snapshot`. | The frontend delegates to a same-origin backend. The identifier's complete contract, returned payload and permission checks are not established by static code. |
| Member-specific sync is delegated to that backend | Same asset, REA source range line 1, columns 31650–31707. The request expression builds `/api/sync/` plus a session wallet and a manual-sync flag; its options specify POST. | The inspected effect requires session user/wallet state. After a hidden-page interval longer than 15 seconds, a visibility change can request sync; success emits a local `pp:synced` event. This is not the scheduled 15-minute indexing cadence or an upstream API call. |
| The wallet UI has a Solana RPC endpoint | Same asset, `WalletProviders` module configures `https://api.mainnet-beta.solana.com`. | A client wallet-provider configuration is visible. This does **not** prove the leaderboard indexer uses public RPC, or that historical pool/position reconstruction happens in the browser. |
| The supplied API page is gated | [Beta asset](https://lppool.party/_next/static/chunks/app/beta/page-42cfd90b4f7f8ff1.js), session request at REA source range line 1, columns 260–305. | The component branches on session/member status and offers invite/sign-in access to signed-out visitors. It is not published API documentation. |

Static field references to wallets are **not evidence that another member's wallet is exposed**. No response containing member data was fetched. No attempt was made to infer hidden wallets or exercise any sync/authentication endpoint.

## Where the financial data comes from

| Data | Supported source attribution | What remains unknown |
|---|---|---|
| Portfolio performance and LP statistics | Pool Party's [profile guide](https://lppool.party/guide/profile) attributes its results to Meteora and covers directly held and HawkFi-managed activity. The [leaderboard guide](https://lppool.party/guide/leaderboard) describes periodic refreshes. | Exact server-side routes, managed-position aggregation, corrections, valuation samples, gas/platform-cost inclusion and win classification. |
| Closed-history persistence | [Privacy policy §2](https://lppool.party/privacy) describes retained closed-position histories without wallet or position addresses. | Database schema/engine, backfill completeness, original upstream identifiers and event/price provenance. No database access was obtained. |
| Pool market data and liquidity distribution | [Pool guide](https://lppool.party/guide/pools) attributes TVL/volume to Meteora and describes liquidity bins read from chain. | Exact candle provider, RPC/indexer, historical versus current depth, caching and timing. |
| Display snapshots | Public client code consumes same-origin JSON snapshots; local cache/state code is present. | No exact snapshot schema or actual ranked/profile values were retrieved. Client caching alone does not establish the backend storage architecture. |

**Conclusion:** the best-supported architecture is Meteora/chain data processed through Pool Party's backend, with retained history and browser snapshots. The frontend portion is source-observed; upstream financial attribution is provider-documented. REA cannot turn unavailable server code into verified backend provenance.

## What this changes for our research

1. **Use documented upstream access first.** Our existing [official Meteora API integration](https://dlmm.datapi.meteora.ag/api-docs/openapi.json) already accesses known-position histories and reported PnL. Its `/portfolio`, position-history and pool/user-PnL routes are candidates for comparable protocol data, **not a claim that Pool Party uses those exact routes**.
2. **Retained history is potentially valuable.** Pool Party may add historical persistence and aggregation beyond a current upstream response. Its non-public member snapshots do not become a permitted research feed merely because route strings can be extracted.
3. **Independent USD validation remains unresolved.** No server-side historical price source, timestamp policy, hold calculation or complete cost methodology was recovered. Meteora-derived results through a second interface would still need independent validation.
4. **Do not attribute a paid indexer without evidence.** The inspected client does not establish whether the backend uses Helius, Birdeye, GeckoTerminal, another RPC provider or its own indexing. A wallet-provider RPC string cannot answer that question.

## What would establish the remaining server-side details?

Provider-supplied methodology, backend source or a permitted export with upstream endpoint/version, retrieval times, price lineage and transaction references would resolve the key gaps. A capture from an explicitly authorized member session could clarify frontend payloads and timing, but generally cannot reveal server-to-server traffic. It should be limited to that member's permitted data and redact authentication material. No such capture was performed here.

## Reproduction and integrity

With compatible Node/npm and the existing retained assets:

```powershell
.venv/Scripts/python data/poolparty_rea/reproduce_analysis.py
```

This script replays local static analysis/traces using `rea-agents@6.7.0`; it does not fetch Pool Party data or register MCP. npm may download/cache the tool and dependencies. Running against another asset version creates different evidence IDs. Source ranges and findings above belong to the retained asset hashes only.

No profitability code, price selection, position outputs or prior research evidence was modified. This investigation spent **$0** on external services and collected **0 member records**.

The reproduction script completed successfully. The repeated analysis produced the same application evidence ID. Both feature traces completed successfully with partial coverage. Integrity checks matched all **1,013** entries in the prior Phase 5 manifest and all **52** entries in the original Pool Party audit manifest. Machine-readable results and hashes for this investigation are in `data/poolparty_rea/summary.json` and `evidence_manifest.json`.
