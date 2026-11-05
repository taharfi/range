# RANGE pilot measurement specification

2026-10-23 operator-report correction: expired feedback is excluded before counting, verified feedback nonresponders are retained in the denominator, and repeat-feedback observations are explicitly proxies. `allThresholdsMet` cannot become true from the current survey/storage fields alone; manual protocol evidence remains unestablished. This adds no collection fields, telemetry, identifiers or automatic note ingestion and does not approve the proposed protocol. See [facilitator pack](PILOT_FACILITATOR_PACK.md).

**Status: proposed protocol; privacy approval required before any new telemetry is implemented.** Prepared 2026-10-22 for ten active/recent Meteora DLMM LP testers. This sprint adds no analytics provider, event types, identifiers, tracking endpoint, cookies or telemetry storage fields. Existing invitation, optional usage analytics and separately consented feedback remain unchanged.

## Consent and identity

- An invitation authorizes tool access; it is not analytics or research consent. Declining usage measurement must not prevent invited use.
- Existing usage analytics requires its separate, initially unchecked consent. Structured feedback has its own consent. Obtain separate permission for facilitator notes; do not assume either checkbox authorizes recording video, screenshots, a transcript or contact details.
- Assign one invitation to each screened participant. Existing participant IDs are keyed HMAC digests of invitation codes; session IDs are random identifiers with a necessary HttpOnly/SameSite cookie lasting up to 24 hours. These are pseudonyms, not anonymous people or proof of LP ownership.
- Verify eligibility through an experience discussion and a voluntary public-position walkthrough. No keys, signatures or funding are requested. A public address alone does not verify ownership. Record the screening method without preserving wallet addresses or balances.
- Define a study ID for consented facilitator notes. Keep any necessary identity/contact mapping separate, access-restricted and optional. Do not send invitation codes or participant IDs to Meteora/Jupiter/RPC providers. Do not rotate identity secrets during the study to silently re-identify or reconnect erased records.

## What exists today versus what is proposed

Current consented usage events: `visit`, `lookup_success`, `comparison_completed`, `comparison_incomplete`, `feedback_submitted`, and `willing_to_pay`. Payloads are bounded event type, timestamp and a server-issued UUID or UTC day under a pseudonymous participant ID. They exclude wallets, token quantities, IP addresses and advertising identifiers. A manual recovery generates ordinary lookup/brief requests through the existing routes; those existing route events may consequently be counted again. They are not new participants or proof of a new decision.

The following outcome definitions are the proposed research protocol. Use separately consented manual observations where needed. **Do not implement the proposed failure/task/return measurement changes until the privacy requirements below have been reviewed and approved.** Do not infer unavailable measurements from the existing counters.

## Outcomes and minimal evidence

| Outcome | Definition | Minimal consented evidence | Interpretation |
|---|---|---|---|
| Thirty-second understanding | Explains position analysis, the three actions and read-only/estimated nature before coaching | Study ID, pass/partial/fail, short non-identifying explanation | A screenshot or click is not comprehension. |
| Task completion | Reaches a useful live comparison for a supported real position within five minutes, without assistance | Start/end UTC times, assistance flag, completion result; an existing analysis UUID if usage linkage is consented | Record initial comparison and later refresh separately. A demo or both-unavailable brief is not core task completion. |
| Failed analysis | A requested lookup/comparison cannot complete or data is unsupported | Study ID, phase, whitelisted category, time, assistance flag | Suggested categories: invalid input, invitation/access, unsupported/closed, stale snapshot, missing data, no route, provider limit, provider failure, other. No raw error text, address, amount, URL or stack trace. |
| Useful insight | Identifies a concrete new fact that matters to their decision relative to their usual tool | Yes/no/uncertain plus one consented, non-identifying sentence | A generic Yes answer is supporting evidence only; changing a decision does not prove improved financial outcomes. |
| Financial understanding | Explains principal versus unclaimed fees, missing costs, conditional quote minimums and token-mix-only rebalance | Pass/partial/fail and misconception category | Correct misconceptions before ending; log assistance and do not retroactively mark an unaided pass. |
| Voluntary return | Self-initiated useful live comparison at least 24 hours after first use and within 14 days | Distinct analysis UUID/timestamps where consented, plus manual confirmation whether return was prompted | A visit/access check, automated refresh, mandatory follow-up or second feedback submission alone is insufficient. |
| Feedback | A separately consented structured response linked to a live analysis receipt | Existing feedback record and deletion receipt | Do not require feedback to include an eligible tester in the study denominator. Demo responses remain excluded. |
| Payment evidence | Explicit commitment to a defined continued-pilot scope at a specific price, with permission to follow up | Date, scope/price, evidence reference and consented study ID | Existing request-to-discuss event is interest, not a payment/commitment. No payment or payment details are collected by RANGE. |

Current counters have limitations: visits are deduplicated by UTC day and do not establish voluntary useful returns. The revised operator report labels repeated-feedback observations as proxies, includes verified feedback nonresponders in the denominator, excludes expired responses and cannot certify the full protocol from stored survey fields. Manual outcome evidence remains unavailable until the separate protocol is approved and observations actually occur. No new telemetry collection was added.

## Denominators and study procedure

Report invited, attended, eligible, attempted, successful, analytics-consenting, feedback-submitting and returning counts separately. Count people once per outcome; do not count refreshes as participants. Keep unsupported, failed and nonresponding eligible cases visible. Do not replace inconvenient cases until targets appear to pass. Label missing, declined, revoked and withdrawn observations explicitly.

Capture intended action **before** exposure; the current form asks retrospectively. Counterbalance whether RANGE or the participant's usual tool is seen first. Do not coach during the timed task. Note any public sample substituted for the participant's position. Stagger sessions to respect the existing two-analysis concurrency cap and provider queues.

Proposed thresholds, to freeze before sessions:

- Ten distinct screened, study-consenting LP participants; usage analytics remains independently optional.
- At least eight understand the product within 30 seconds and eight complete the unaided task within five minutes.
- At least eight explain financial boundaries without coaching; zero unresolved material misconceptions at session end.
- At least six describe a concrete useful new insight, four voluntarily return within 14 days, and two make a credible priced-pilot commitment.
- Pause for a confirmed privacy/read-only boundary violation or persistent material misunderstanding of costs/proceeds. Passing these small-cohort thresholds authorizes reviewing the next experiment, not declaring product-market fit.

## Retention, deletion and access

Existing usage consent expires after 30 days and is removed on access or purge. Feedback is intended to be retained for up to 30 days after submission; its purge requires operator scheduling. A running production scheduler has not been verified. The existing pilot summary must not be treated as excluding all expired feedback until purge has run.

Signing out erases usage history for that participant and invalidates their sessions. Feedback deletion uses its separate receipt and removes linked feedback/payment-interest events; other separately consented usage remains unless revoked. Explain that refreshing/closing the page loses an undownloaded receipt, and provide a facilitator-assisted deletion procedure if a receipt is lost. Do not recover erased tracking to improve retention results.

Proposed facilitator notes and verification records: private storage, access only to the named research operator, no greater than 30 days retention, and deletion upon withdrawal. Confirm how private backups expire and how deletion requests reach the facilitator before collecting notes. Do not promise receipt-based deletion automatically removes separate notes, verification records or backups. Aggregate reporting must omit unnecessary identifiers and describe withdrawals/missingness without retaining identifiable withdrawn responses.

The public lookup is not local-only processing: Meteora receives lookup addresses; configured Solana RPC receives account/mint requests; Jupiter receives swap mints/amounts without a taker wallet. This necessary provider flow is separate from optional pilot analytics. Do not attach these addresses or amounts to study records or enable request-body/cookie logging.

## Approval requirements before new telemetry

Name the research/privacy owner and approve: exact purpose/fields, event trigger, consent wording/version, access roles, storage location, retention/purge owner, withdrawal/deletion behavior including backups, participant-linking method and reporting denominator. Exclude raw wallets, transaction amounts, full URLs, raw errors, keystrokes, fingerprints, recordings and third-party analytics. Verify that declined consent sends/stores no optional events and that deletion prevents silent recreation.

Until that approval, use only existing consent controls and separately authorized manual research. No proposed new telemetry is implemented by this specification.
