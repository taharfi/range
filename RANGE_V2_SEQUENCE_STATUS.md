# RANGE V2 — sequence status

2026-11-09: the user confirmed no testers are ready and requested local validation. Added compact per-position current USD estimates using the existing portfolio valuation gates, refreshed server-owned direct-lookup handles, and ten-item historical timestamp RPC batches compatible with Helius. Principal and unclaimed fees remain separate; no historical USD P&L is established. One closed-position token-flow reconciliation and its optional saved-evidence view were completed previously; they are not a complete wallet history. Daily reviewed-source GitHub checkpoints are configured and their no-change scheduled run passed. Explore, Intelligence and Lab remain behind unmet demand/data gates. See [local validation](LOCAL_VALIDATION_READINESS.md) and [reconciliation evidence](CLOSED_POSITION_RECONCILIATION_PILOT.md).

2026-11-05 local-testing continuation: refreshed the live walkthrough against current data. The sample wallet returned one supported current position; its funded SOL/USDC EXIT and REBALANCE scenarios received live quotes. Added `npm run pilot:preflight -- YYYY-MM-DD` and removed the diagnostic's obsolete default date so a missing argument cannot silently replace older evidence. Application financial logic, security controls and dependencies were unchanged. See [current local guide](PILOT_START_HERE.md) and [new capture](pilot/evidence/pilot-preflight-2026-11-05/README.md). This automated check does not pass the human-validation gate.

2026-10-24 continuation: [local pilot quickstart and live preflight](PILOT_START_HERE.md) passed through a funded SOL/USDC position with real EXIT/REBALANCE quotes, explicit missing costs and no submitted feedback. Application code was unchanged. Genuine user evidence remains unestablished; this does not advance the demand gate.

2026-10-23. The user authorized proceeding through the sequence. The roadmap's data-quality, demand and deployment gates remain explicit; authorization is not evidence that those gates passed. No public deployment, execution, new telemetry or paid purchase.

| Phase | Current state | Gate to the next step |
|---|---|---|
| 0 — Portfolio correctness | Implemented aggregation, bounded pages, independent summary, reason-coded valuation and metadata-only Token-2022 support. Valuation remains partial when sources fail gates. | Maintain existing financial regression suite and honest coverage. |
| 1 — Pilot reliability | Added ledger-storage readiness, persistent ledger configuration in the prepared single-node container template, honest operator outcomes, isolated restart rehearsal and facilitator pack. Final QA evidence is indexed below. | Actual study/privacy approval and ten-user evidence; secure hosting rehearsal/approval if remote access is needed. |
| 2 — Explore | Not implemented in this continuation. | Reliable pilot plus a demonstrated pool-research user task. |
| 3 — History/accounting | Existing partial ledger/research fixtures only; no new historical P&L claims. | Demonstrated exact-date archival access and a bounded cohort. |
| 4 — Intelligence | Not implemented. | Validated historical observation boundaries, cohort/privacy rules and demand. |
| 5 — Lab | Not implemented. | Explicit strategy rules, model tests, pool data and user demand. |
| Execution/backtesting | Deferred. | Separate financial/security research and authorization. |

## Phase 1 fixes

Readiness previously probed feedback storage only. It now probes feedback and ledger storage independently, keys its short-lived probe cache by directory, rejects a shared root for the two stores and requires an explicit ledger path in public configuration. The prepared Compose configuration mounts ledger files under the existing private persistent volume. `var` is now excluded from Docker's build context. These configuration/probe checks do not prove a remote volume survives host failure or that deployment is secure.

The operator report previously could treat survey proxies as passing the pilot and include expired feedback before an operator purge. It now filters retention, rejects invalid/conflicting report evidence, keeps verified feedback nonresponders visible and separates repeat-feedback observations from voluntary returns. Even a synthetic cohort passing all old survey thresholds cannot certify the full protocol. No new telemetry, browser identifiers, analytics events or research-note fields are collected.

The isolated two-process restart rehearsal confirms that process-memory aggregation IDs expire with HTTP-409 semantics and require a fresh analysis, while the partial ledger checkpoint persists. Existing test-only usage persisted and erased successfully. Synthetic records were confined to a temporary directory and deleted; they are not genuine participants or financial evidence. An explicit browser regression covers snapshot-loss recovery without an empty-wallet claim.

Actual screenshot review found an expiry-copy gap: reference values correctly became unavailable after their source deadline, but earlier coverage counts lacked a clear expiry explanation. Portfolio/Performance now explicitly request refresh after valuation expiry and label those counts as snapshot-time coverage. No age limit, price source or financial calculation changed. A browser clock test verifies the transition.

## Actual pilot evidence

The [operator snapshot](pilot/evidence/pilot-sequence/operator-summary.json) contains **zero retained feedback responses and zero facilitator-verified LP participants**. Existing usage includes one unverified consenting invitation identifier, which does not prove a genuine LP, a useful insight or a voluntary useful return. It was preserved, not erased or relabeled as test activity. Tester recruitment/status remains unconfirmed. No interviews, testimonials, payment commitments or successful validation were invented.

The measurement protocol remains proposed where it requires new manual records or telemetry. Use the [facilitator pack](PILOT_FACILITATOR_PACK.md) after privacy/retention/storage responsibilities are approved. The empty CSV is a template, not a populated dataset. No invitation messages were sent.

## Operating boundary

Use one persistent Node process. Sessions and aggregation snapshots remain in memory; restart requires invitation renewal and reanalysis. Durable history is partial, not a resumable complete-wallet index. Do not use an ephemeral serverless deployment or multiple replicas with the present session/rate-limit model.

Docker's Linux engine is unavailable in this environment (`dockerDesktopLinuxEngine` pipe missing). Container runtime, proxy/TLS, volume restore and public hosting remain unverified. Configuration was prepared only; nothing was deployed. Writable local directories do not prove durability of remote disks.

## Evidence and next action

Final executed checks: **72 research tests, 90 unit tests and 38 browser/API tests passed**; production build and TypeScript passed. Build audit found no configured secrets/private artifacts; research integrity confirmed 1,013 protected files unchanged. Ten concurrent warm localhost status reads returned 200 with p95 about **224 ms**. The normal-UI run passed with twelve responsive screenshots and zero page errors. These are engineering checks, not genuine user validation. Compose syntax passes; Linux container/TLS behavior remains blocked by the unavailable Docker engine.

The engineering changes are in `pilot/lib/readiness.ts`, `storage.ts`, `ledger.ts`, new `pilot-report.ts`, the private operator summary, two current-valuation UI components, isolated test configuration, the prepared ledger-volume environment template and Docker context exclusions. New tests exercise report honesty, retention, nonresponders, storage isolation and browser recovery/expiry. New diagnostic scripts and the facilitator pack contain no actual participant notes. Application signing, quote, consent and rate-limit controls remain unchanged.

See [Phase 1 QA and reproduction](pilot/evidence/pilot-sequence/README.md). The next dependent step is genuine LP workflow validation, not automatically creating three more workspaces. Establish the specific pool-research task before Phase 2, preserve cohort/accounting gates before Phase 3/4, and keep Lab hypothetical until a model is independently checked. Passing this technical sprint does not waive those conditions.
