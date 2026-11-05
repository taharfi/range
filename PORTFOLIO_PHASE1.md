# RANGE open portfolio — Phase 1

Implemented locally on 2026-10-22 following approval of Phase 1 only. The wallet journey is **Search → Open portfolio → Position detail → Decision**. Direct supported position-address input still opens detail. No deployment, signing, new dependencies, historical indexer or profitability model was added.

## What changed

- Added `pilot/app/components/Portfolio.tsx`: an editorial overview, loaded/provider-indexed position counts, range counts, compact selectable rows, unclaimed token fees, range previews and source/coverage notices. USD values remain unavailable. No aggregate token-fee dollar value or health score is invented.
- Added `pilot/app/portfolio.ts`: merges pool and per-pool position pages, deduplicates addresses, preserves unrelated pagination and retains earlier observations and matching server handles. Conflicting identities produce a warning. An explicit refresh updates the first page and explains that additional pages must be loaded again.
- Updated `RangeApp.tsx`: portfolio navigation preserves loaded rows, selection, keyboard focus and scroll. Failed page loads preserve prior rows and allow retry. Invitation renewal resumes the same pending page. Detail refresh targets the selected position rather than replacing the wallet portfolio. Expired handles on Compare fetch that same position, request a new brief and explicitly disclose the updated figures.
- Updated `RangeUI.tsx`: compact range preview using the existing decimal geometry; detailed range behavior unchanged. Added responsive portfolio styling using existing RANGE tokens.
- `models.ts` and `meteora.ts` expose optional `indexedPositionCount` from the provider's `totalPositions`. This is source-reported metadata, not independent discovery. Existing API routes, financial arithmetic, source validation, quote gates, access controls, limits and consent storage remain in place.
- Added focused unit/browser tests, adapted existing journeys for the new portfolio selection step, and added `pilot/scripts/portfolio-live-smoke.ts`. Updated the existing browser smoke journey, README and UX changelog.

## Scope and financial boundaries

The portfolio lists indexed **open DLMM** positions. Closed/History tabs, historical fee totals, lifecycle replay, SDK-wide account discovery, independently verified historical P&L and wallet execution are not implemented. No inactive controls advertise those as available features.

Range counts describe loaded positions only. All returned pages loaded does not prove that the upstream index found every current on-chain position. A provider-count mismatch, warning or remaining page keeps coverage incomplete. Unknown fees remain unavailable. Each row's earlier data/handle pair is preserved when another page repeats the same address; a page load never quietly replaces its financial figures. Refresh failures do not remove previously displayed positions.

The existing server-handle expiry (120 seconds), source age checks and quote stale display (30 seconds) remain unchanged. Retrieval time is labeled as retrieval time; the portfolio does not equate it with an atomic on-chain snapshot. Multi-page observations can have different source times. State remains in memory within the app: reloading the browser starts a new lookup; browser-native back/deep links and durable portfolio sessions are deferred.

## Actual live checks

The read-only smoke used the four public addresses supplied by the owner. Optional analytics remained off; no feedback or transactions were submitted. Results changed naturally since the earlier investigation and are recorded without forcing old counts:

| Wallet | Indexed positions loaded | Independent current RPC owner matches |
| --- | ---: | ---: |
| `BazUUKN4YLpKQ4NNYYUtuzd6CcniPn1jkFjB4FuVMyo7` | 0 | 0 |
| `8k2KVhVrBWAVov4zbBXciyA3KbVz8Az9uTc7uX8WJP5R` | 1 | 1 |
| `6Gsjssm7u4i4TTbD51nxxmcpuKBN17T1QcpSSbNDwaGc` | 0 | 0 |
| `ACUvKyTc7dEwR8oMqUZd5xpj19osaFZoXPauuy52adQM` | 9 (5 + 4) | 9 |

The RPC cross-check used the official mainnet endpoint, current DLMM program and owner-field memcmp offset 40 at slots 460055517–460055526. It is a bounded current-account comparison, not historical coverage or proof of beneficial ownership. Empty current results do not establish a complete closure history. Both empty wallet lookups retained the corrected fallback classification and did not expose the expected non-position rejection as a wallet warning.

A later smoke at **13:44:29 UTC** reported **0, 0, 0 and 9** positions respectively. The second wallet changed from one to zero during the sprint. A subsequent official-RPC scan at slot **460057378** independently returned zero owner-matched accounts for it. The latest `live-smoke.json` preserves this later run; `rpc-cross-check.json` retains the initial checks and the subsequent check separately. No current-account absence is labeled as an independently proven historical closure.

`pilot/evidence/portfolio/live-smoke.json` records response counts and timestamps; `rpc-cross-check.json` records the independent check. The live smoke had zero browser page errors and preserved all nine rows after opening and leaving detail. No quote request is needed to browse a portfolio; existing Decision behavior is covered separately by the regression suite.

## Verification and screenshots

- 51 pilot unit tests passed, including cumulative pagination, per-pool cursors, conflicting identities, unavailable values, scoped health counts and explicit position replacement.
- 72 research regression tests passed.
- The first complete production browser/API run passed all 25 tests: existing financial/error/security/consent checks plus nine-position accumulation, scroll/focus restoration, failed-page retry, expired-handle recovery, direct position input and page-specific invitation renewal.
- Production build and typecheck passed. Build secret scan found zero configured-secret matches and zero private artifacts in browser output.
- The protected-evidence validator reported all 1,013 research files unchanged.
- A SHA-256 comparison confirmed eight financial/quote/guard/session/feedback/analytics/API-handler files unchanged; all 39 Copilot research files also matched their earlier hashes.
- Actual renders were inspected at 1440, 834, 390 and 320 pixels; no horizontal overflow. The 320px header was shortened after visual review. Final rerun results are appended below.

See [screenshot index](pilot/evidence/portfolio/README.md). Screenshots preserve point-in-time public data or explicitly labeled synthetic QA, not current executable quotes or financial performance evidence. Before/after captures occurred at different times and cannot be used to infer returns.

Reproduce the current public-wallet check from `pilot/`:

```powershell
node --env-file-if-exists=.env.local --import tsx scripts/portfolio-live-smoke.ts
```

This requires the local production server on port 3000 and a configured local invitation/development code. Credentials are read internally and never logged. Local development sessions are excluded from pilot analytics.

An additional browser run exposed a timing race in the existing settings test (24 passes, one assertion read 50 before the updated 70 request arrived). The test now waits for the observed request value; application settings/financial logic were not changed to satisfy it. All original assertions remain. This transient test failure is distinguished from the first fully passing run and the final rerun.

## Final results

The final complete browser/API rerun passed **25/25** tests after the request-observation synchronization fix. Final production build, typecheck and secret/artifact scan passed. Pilot unit and research suites passed **51** and **72** tests respectively; their accounting code and fixtures were not changed after those runs.

The updated existing live browser smoke was also executed with the public `ACUv…` wallet: position lookup HTTP 200, brief HTTP 200, EXIT `quoted`, REBALANCE `quoted`, zero page errors. It traversed portfolio → position → Decision; no transactions or feedback were submitted. Evidence is `pilot/evidence/browser-live-smoke.json` and the existing `pilot/evidence/progressive/live-decision-*-desktop.png` captures. Live portfolio, mobile detail and live Decision renders were visually inspected. This verifies read-only responses, not withdrawal success or complete execution costs.

The app is running locally at **http://127.0.0.1:3000/app**. The previously authorized local development access code remains configured. No production secrets, deployment settings, Copilot research or historical financial evidence were changed by this sprint.
