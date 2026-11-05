# RANGE portfolio terminal — implementation

2026-10-22. Local, read-only implementation. No deployment, subscription purchase, signing, dependency changes or competitor backend integration.

## Audit and scope

Reviewed the actual `RangeApp`, `Portfolio`, discovery adapter, API guard, financial models, existing tests, `PORTFOLIO_PHASE1.md` and `WALLET_DISCOVERY_DEBUG.md`. A separate portfolio architecture proposal was not found among the repository's reports; Phase 1 and the discovery investigation are the available implementation records. Copilot research was not edited.

Reused the existing public-address search, open-position pagination, metadata validation, server-owned quote handles, range geometry, invitation/consent controls and Position → Decision workflow. The prior RANGE wordmark, design tokens, Geist typography and portfolio distribution graphic remain in use. No LP Agent layout, chart or private endpoint was copied.

The smallest complete addition is a portfolio workspace with a command header, snapshot, deterministic attention queue, searchable open explorer, bounded closed-position explorer, selected-position activity and a clearly unavailable performance view.

| Capability | Actual behavior |
| --- | --- |
| Wallet identity | Short address, full public address in details, copy with success/failure status, refresh open snapshots |
| Snapshot | Loaded/indexed open count; in/out/unknown counts; position-count ring, never value-weighted allocation |
| Financial totals | Active liquidity value, aggregate claimed fees and portfolio P&L explicitly unavailable or unreconciled; no current prices substituted |
| Currency preference | Token units supported; SOL/USD portfolio conversion unavailable, so no functioning fiat toggle is advertised |
| Open explorer | Loaded-page search by pair, mint, pool or position; range filters; source/address/pair/freshness sorting; list/card views; current token fees; range graphic; per-row snapshot freshness |
| Contextual inspector | Expandable position facts: pool, principal inventory, precise boundaries and age since source-reported creation where available; deposited capital and performance remain unavailable |
| Closed explorer | Real source-reported closed records; dates/duration when present; per-token deposits/withdrawals/claims; pool and per-pool position pagination; expandable details |
| Closed financial results | No reported API USD/SOL P&L exposed as RANGE performance. Claimed amounts labeled fees **and rewards**, matching the source schema |
| Activity | Selected loaded position; date-grouped indexed add/remove/fee/reward events; actor, slot, instruction and validated-signature Solscan links; incremental display of 20 events |
| Performance | Informative unavailable state explaining missing prices, complete cash flows and cost reconciliation. No fake chart, selectable period or portfolio-value series |
| Decision | Analyze Position opens the existing position inspector and Compare options workflow. Closed positions never receive executable quote handles |

Historical requests start only through user action. No whole-wallet historical crawl runs on search. Wallet-wide history, creation/close/transfer decoding and lifecycle replay are **not implemented** by this terminal adapter. Existing offline research remains separate.

## Sources and normalization

The [official Meteora Data API overview](https://github.com/MeteoraAg/docs/blob/main/developer-guides/dlmm/api-reference/overview.mdx) links the [production OpenAPI](https://dlmm.datapi.meteora.ag/api-docs/openapi.json) and [Swagger](https://dlmm.datapi.meteora.ag/swagger-ui/). The captured specification and public samples are in `pilot/evidence/terminal/`.

- Existing open lookup: `/portfolio/open` followed by pool metadata and `/positions/{pool}/pnl?status=open`. Direct PositionV2 mapping and classic token mint checks use Solana RPC.
- Closed lookup: `/portfolio?days_back=365&page_size=2`, then metadata and `/positions/{pool}/pnl?status=closed&page_size=20`. Both pagination levels are preserved and deduplicated. `totalPositions` is **all-time**; pool discovery is a **365-day window**. Loading every returned pool does not establish all-time wallet completeness.
- Selected activity: `/positions/{position}/historical?order_direction=desc`. The schema documents add/remove/claim events, not a complete create/close lifecycle. Production `blockTime` observations are milliseconds; position creation/closure timestamps are seconds. Each path normalizes and validates its own units.
- Closed token amounts are display units and conservatively rounded down to metadata decimals. Their source status stays `indexed-unreconciled`; no independent mint verification or financial reconciliation is claimed for the new historical adapter.
- Open position age uses the optional indexed `createdAt` in seconds. Implausible, future or millisecond values become unavailable with a warning; current inventory, quote arithmetic and ownership rules are unchanged. This is not independent proof of a creation event.
- Activity amounts retain decimal strings; source USD columns are discarded. Signatures decode to 64 bytes; pool/position identity, public keys, nonnegative amounts and timestamps are checked. Different actors are retained rather than assumed to be the wallet owner. Unknown event types remain visible.
- Event identity is signature + instruction index + event type + position. Exact duplicates are counted; conflicting records with that identity are excluded and reported, never silently summed. Missing inner-event identifiers remain a limitation.
- Historical responses always declare partial coverage. Rejected records and duplicate counts are exposed. Invalid top-level responses and provider outages fail; per-pool failures remain explicit warnings. An empty response is never proof of a nonexistent lifecycle.

The official [DLMM SDK](https://github.com/MeteoraAg/dlmm-sdk) remains a reference for current account discovery, rather than a newly installed dependency. Historical closed accounts cannot be recovered from current account scans alone. No claimed beneficial-owner mapping is inferred from a fixed account-owner field.

## RANGE endpoint

`POST /api/portfolio`, Node runtime, no-store responses:

```json
{"kind":"closed","address":"<public wallet>","page":1}
```

Optional `pool` scopes a subsequent per-pool position page. Result: `ClosedPage` with positions, both cursor types, source-reported all-time count, window, warnings, retrieval time and source URLs.

```json
{"kind":"history","position":"<position>","pool":"<pool>"}
```

Result: `ActivityPage` with position-scoped events, source URL, retrieval time, accepted/rejected/duplicate counts and mandatory partial coverage. These are public indexed records, not a wallet ownership attestation.

Both variants reuse `guard(request,'lookup')`, same-origin checks, bounded JSON, invitation enforcement, per-user/global limits, the two-analysis concurrency bound and the existing paced provider queue. Requests accept validated public keys, never arbitrary provider URLs. No new analytics or address persistence was added. Historical invitation expiry opens the existing gate and retains displayed records; users explicitly retry after renewal. Request errors never relabel old data as current.

## Transparent attention rules

1. Missing timestamp, more than 120 seconds old, or more than 30 seconds in the future: refresh warning.
2. API-normalized active bin outside the position's bin bounds: outside-range flag.
3. An in-range, geometrically consistent price within 5% of the **linear price-range width** from a boundary: boundary flag. This is an explicit heuristic, not a probability or prediction.
4. The same mint appearing in at least 60% of at least three distinct loaded positions: shared-token notice. It counts positions, not capital exposure, and deduplicates position addresses and each pair's mints.

Each flag exposes evidence, significance and an Analyze Position action. Stale flags sort first. The queue begins collapsed to keep the explorer prominent. No composite health score, valuation-based concentration or significant-fee threshold is fabricated.

## Discovery recheck

Fresh independent official mainnet `getProgramAccounts` owner-field scans at slots 460079186–460079210 agreed with the indexed open totals: **0, 0, 0 and 9**, respectively, for the four supplied wallets. See `discovery-check.json` for full public identifiers and returned accounts. The fourth wallet required another indexed pool page; pagination remained available.

This is a current owner-field comparison, not an independent re-decoding of every returned account, a delegated-authority search, historical completeness or beneficial-ownership proof. The earlier PositionV2 fallback presentation defect remains fixed. No new active-position loss was reproduced, so the working discovery path was preserved rather than forcing false positives.

## Real sample run and reproduction

The initial normal-UI smoke returned nine open positions, twenty closed records from a bounded page and fifteen indexed events for one selected closed position. EXIT and REBALANCE returned HTTP 200 quoted results. This establishes read-only API behavior, not transaction success, closure proof or net profitability.

Run locally from `pilot/`, with the existing local server on port 3000:

```powershell
node --env-file-if-exists=.env.local --import tsx scripts/terminal-live-smoke.ts
```

The script reads the existing development code internally, leaves optional analytics off, captures desktop/tablet/mobile views and writes `evidence/terminal/live-smoke.json`. No credentials or tester responses are included in screenshots.

## Limits and next prerequisites

- No independently verified wallet-wide historical USD P&L, allocation weighting, complete claimed-fee total or profit chart. Historical pricing, full transaction accounting and observable costs must be validated before those can appear.
- API closed status is not a decoded PositionClose event. A withdrawal is never promoted into closure proof. Create/close/ownership changes require the existing offline decoder to be safely adapted and independently reconciled in a separate task.
- Historical associations come from the source's wallet index. Transferred or delegated positions may need additional authority-aware indexing. Failed or missing records remain visible coverage gaps.
- Activity endpoint has no documented pagination cursor or completeness watermark. Oversized responses fail the existing bounded reader; the UI must not claim completeness or silently truncate financial accounting.
- Closed pool discovery uses a 365-day window and bounded manual paging. Large wallets require many metadata/position calls; this version adds no durable indexer, background crawler or paid provider.
- State and rate limits remain process-local. Portfolio filters/history are in component memory and reset when leaving/reloading the workspace. Existing open data, handles, focus and scroll restoration remain preserved.
- Refresh updates the first open page; closed and selected activity have explicit separate refresh/load controls. Multi-page observations are not an atomic snapshot.

Final verification and screenshot links are recorded in `pilot/evidence/terminal/README.md` and the final results below.

## Final results

- **72 research regression tests, 59 pilot unit tests and 30 browser/API tests passed (161 total).** Production build, TypeScript and browser-secret scan passed; zero secret matches/private artifacts in the build scan.
- Final live smoke at **2026-10-22 22:02:11 UTC**: **9 open positions**, **6 indexed closed records in the bounded first two-pool page**, and **12 indexed events for the selected closed position**. Both Jupiter scenarios returned `quoted`; zero browser page errors and zero horizontal overflow across all captured widths.
- An earlier capture loaded 20 closed records and 15 events. Different most-recent pools/positions were sampled as the wallet and index changed; these are page-local observations, not total-history counts or evidence of data loss. The final JSON and screenshots retain the latest run.
- Visually reviewed open/list, cards, inspector, attention, closed, history, performance-unavailable and existing Position/Decision layouts across desktop/mobile captures. Refined attention density, filter accessible names and separators after the first visual review.
- Initial QA found endpoint generic/test typing errors, ambiguous implicit filter labels, an assertion matching Next's empty alert announcer and a test fixture exceeding the unchanged demo request limit. Fixed typing/labels/selectors and generated the synthetic test fixture directly. Subsequent complete tests passed; security limits were not relaxed.
- SHA-256 checks confirmed the eight existing math/brief/Jupiter/guard/session/feedback/analytics/positions-handler files unchanged. The evidence validator confirmed **1,013 protected research files unchanged**; all **39 Copilot files** also matched the previous baseline. Open adapter changes are limited to optional creation-time metadata and validation.
- The app remains local at **http://127.0.0.1:3000/app**. No public deployment, secrets changes, transactions, new analytics or paid-service purchases.
