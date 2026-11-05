# RANGE — pilot validation readiness audit

Audited **2026-10-21**. Scope: the existing invitation-only, read-only application and the validity of a ten-LP pilot. No features, configuration, dependencies or deployment were changed. No real feedback was submitted or private feedback records inspected.

## Verdict

**Suitable for moderated local usability sessions now; not yet cleared for an independent remote ten-user pilot.** The core live lookup and quote path works, and the financial boundaries are substantially clearer than a generic LP dashboard. Remote hosting remains unvalidated. Before an unassisted pilot, address the small recovery/copy issues below and establish a measurement protocol that does not confuse visits, feedback completion or payment interest with retained value.

Whether a new LP understands RANGE in 30 seconds, completes a task unaided, learns something useful or returns voluntarily remains **unknown until tested with real people**. Browser automation and a clean screenshot cannot answer those questions.

## Actual audit evidence

Inspected the current React screens, Meteora/Jupiter adapters, amount/brief logic, API routes, invitation/session guards, feedback/analytics storage, operator summary scripts and container/proxy configuration. Reviewed rendered desktop/mobile pages from the existing local production server.

Fresh browser/API observations, October 21 around 17:43–17:45 UTC:

- The homepage explains Meteora positions, the three actions, read-only access and no wallet connection. `/app` initially has one address field.
- An unauthenticated live lookup returned **401**. The invitation appeared after Analyze; analytics was unchecked.
- A non-sensitive public SOL/USDC research wallet returned **200**, one position and no API-level lookup warnings. The measured lookup response after invitation submission took approximately **2.7 seconds** in this one probe, not a latency benchmark.
- A live brief returned **200**, with both exit and rebalance statuses `quoted`. No browser JavaScript errors were recorded. No signing/submission was attempted.
- Full execution-cost unavailability was visible on the live EXIT screen. Feedback storage consent was unchecked; the form had eight structured dropdown questions and no free-text box.
- Demo position and decision labels explicitly said synthetic; demo feedback was excluded. Initial exact-text checks in the inline audit harness did not match; inspecting the actual text and using a matching selector confirmed the product label. No missing-label product defect was observed.
- No horizontal overflow was found for demo screens at 1440, 834, 390 and 320 pixels; live Position/EXIT were checked at 1440 and 390 pixels. Desktop Position and mobile EXIT screenshots were visually reviewed.
- Separate **synthetic browser fixtures**, not real upstream observations, exercised empty lookup, provider failure, closed/unsupported position, missing fees, stale quote, expired snapshot and keyboard tab switching. Errors/warnings rendered and missing values stayed unavailable.
- The local readiness endpoint returned **200 / ready**, explicitly stating upstream was not probed. This does not certify a public host, TLS, proxy trust or durable recovery.
- The existing build audit scanned 15 browser files against 11 configured secret values: **zero matches; zero private artifacts copied**. This is a targeted check, not a general security certification.
- `docker info` failed because the Docker Desktop Linux-engine pipe was unavailable. No container, reverse proxy, public HTTPS service or restored volume was tested.

The full regression suite/build was not rerun in this audit. Previously recorded 72 research, 29 unit and 13 browser/API passes are historical validation, not fresh results claimed here. Temporary screenshots were kept outside the repository; source code was not edited.

## Ten readiness questions

| Question | Assessment | Evidence and remaining uncertainty |
|---|---|---|
| Understand within 30 seconds? | Plausible; unvalidated | Homepage has a clear purpose and trust line. Direct `/app` entry is more sparse. Measure teach-back rather than assuming comprehension. |
| Analyze a real position unaided? | Technical path passes for one sample; user task unvalidated | Actual invitation → lookup → comparison succeeded. Unsupported mints, stale indexed data, paging and snapshot expiry remain friction. |
| Understand HOLD/REBALANCE/EXIT? | Structurally clear; scope ambiguity remains | One selected panel, simple headings, keyboard tabs. REBALANCE changes token mix; it does not choose or move the LP range. Make that distinction unmistakable. |
| Quotes/timestamps/limitations clear? | Mostly passes inspection | Receipt age, stale notice and missing-cost warning are visible. USD value is unavailable. “Quoted minimum” is conditional, not guaranteed net proceeds. |
| Avoid technical overload? | Passes visual inspection, not user validation | Bins/metadata/settings are disclosed progressively. Mobile EXIT scrolls, but principal/cost limitations remain visible before technical disclosures. |
| Errors/empty/unsupported states? | Present; recovery needs attention | Invalid, empty, provider and unsupported cases are explicit. Expired snapshots on Decision offer no direct position refresh. |
| Demo distinct from live? | Passes rendered checks | Synthetic labels persist into Decision; feedback cannot be submitted from the demo. No live failure silently substitutes a demo. |
| Safe for public-wallet read-only use? | Bounded pass; remote operations not cleared | No wallet connector/signer/executor; server-side provider calls, schema/mint checks, invitation protection and limits. Not a security audit or proof all positions are withdrawable. |
| Useful feedback without sensitive data? | Strong structured privacy; qualitative protocol required | Separate consent, no attached wallet/position fields, deletion receipt, no free text. Facilitator must obtain separate permission for qualitative notes. |
| Reliably measure returns and value? | Partially; cannot use existing aggregates uncritically | Events exist, but visits, successful comparisons and repeated feedback are different outcomes. Genuine LP identity and credible payment require separate evidence. |

## Prioritized pilot-readiness checklist

P0 blocks remote release or valid interpretation. P1 should be resolved before the unassisted cohort. P2 is an observation to test, not a request to expand the product.

| Priority | Item | Current status | Smallest required action |
|---|---|---|---|
| P0 — remote | Approved private-pilot host, HTTPS, trusted proxy and persistent private storage | Unverified; Docker unavailable locally | Validate on an approved host later; verify unauthorized access, session cookie, proxy identity, restart, backup/restore and persistence. Do not deploy during this audit. |
| P0 — research | Freeze participant, task-success, retention and payment definitions before inviting users | Existing summaries use different definitions | Use the protocol below and a minimal consented facilitator ledger. No app feature is required to begin moderated testing. |
| P0 — data handling | Assign retention, purge and deletion responsibility | Purge code exists; a running daily schedule was not verified | Name an operator, confirm private storage/backups and run a documented daily check/purge when authorized. Do not run it against real data as part of this audit. |
| P1 — UX | Recover expired position snapshots from Decision | Confirmed recoverable but awkward | Offer a clearly named refresh-position-and-quotes path or an explicit back/refresh instruction. Keep the 120-second position and 30-second quote safeguards; do not relax them to make tests pass. |
| P1 — comprehension | Explain the exact REBALANCE boundary | Details disclose it; primary copy can still imply a complete rebalance | Add one short contextual sentence: “Swap-only estimate; moving your LP range and redepositing are not simulated.” No redesign. |
| P1 — consent | Explain necessary provider data flow before live lookup | Analytics copy covers storage, not a complete upstream explanation | Brief onboarding/privacy copy: public address queries go to Meteora; account/mint checks use RPC; Jupiter receives mints/amounts for wallet-free quotes. Do not claim no address ever leaves the browser. |
| P1 — coverage | Confirm each tester understands supported coverage | Only one actual live wallet checked here | Pilot scope: supported open DLMM PositionV2/classic SPL assets. Record unsupported cases and provider failures; do not pretend the app supports all Meteora products or replace failures invisibly. |
| P1 — load | Stagger the initial sessions | Two active expensive analyses allowed per process; provider calls serialized | Schedule the ten users in small waves. Verify the existing 429/retry path before later concurrency expansion. No scaling feature needed. |
| P2 — value | Determine whether missing USD value/full costs makes the product unusable | Unknown | Ask users; do not build pricing or full transaction simulation preemptively. |
| P2 — feedback | Prevent qualitative insight from being reduced to a Yes answer | Structured form intentionally omits free text | With consent, facilitator records one brief non-identifying explanation of the insight or failure. |
| P2 — usability | Check direct `/app` entry and selected-position paging | Basic navigation works; human behavior unknown | Include direct-link, multiple-position, mobile and out-of-range users in the cohort. No navigation redesign yet. |

### What actually blocks which form of testing?

- **Moderated local sessions:** no critical code-level blocker was found for the supported sample. Obtain research consent, prepare invitations, state scope and freeze the measurement protocol. Assistance must be recorded; a facilitator operating the app is not an unaided task success.
- **Unassisted remote testing:** no validated remote host exists in this audit, and public deployment is not authorized. Host validation is a real blocker. The expiry and scope-copy issues should be resolved before sending a self-service pilot link.
- **Reliable pilot conclusions:** current counters alone are insufficient. A manual, consented measurement procedure can resolve this without new product development.
- **Not a prerequisite:** verified historical P&L, a backtester, total-cost simulation, discovery, alerts or automation. If users say the missing information makes RANGE unhelpful, that is an experimental finding—not permission to fabricate it or expand immediately.

## Implementation-specific findings

### Financial safeguards to preserve

[brief.ts](../../pilot/lib/brief.ts), [math.ts](../../pilot/lib/math.ts), [jupiter.ts](../../pilot/lib/jupiter.ts) and [Decision.tsx](../../pilot/app/components/Decision.tsx) preserve important boundaries:

- Principal is separate from unclaimed fees/rewards; claims are not added to conversion totals.
- Jupiter fees already reflected in output are not deducted again. Slippage is a tolerance, not another certain fee.
- Unsupported or unverified mints block quotes; token amounts use precise decimal/bigint arithmetic.
- Wallet-free responses do not turn missing payer-linked network estimates into zero cost.
- USD value, historical profit and complete withdrawal/redeposit costs are not fabricated.
- HOLD's zero immediate transaction cost means taking no action, not risk-free ownership or a superior expected return.

The current scope remains an indexed, conditional inventory/conversion analysis. It is not proof of immediate withdrawal availability, a complete rebalance, or a guaranteed atomic zap-out. The API obtains quotes without a taker and rejects a transaction-bearing quote response. No execution endpoint exists in this app.

### Snapshot recovery

[meteora.ts](../../pilot/lib/meteora.ts) expires server-owned handles after 120 seconds. [RangeApp.tsx](../../pilot/app/components/RangeApp.tsx) refreshes quotes using the existing handle. In the synthetic Decision fixture, a 409 correctly displayed “Position snapshot expired. Refresh positions and request a new brief,” but Decision had **zero** visible “Refresh position” controls. Back to position → Refresh position → Compare options works as the existing recovery path. The data gate is correct; the UX does not provide the action where the failure occurs.

### Measurement semantics

| Implementation | What it actually measures | Why it cannot be the primary success criterion alone |
|---|---|---|
| [analytics.ts](../../pilot/lib/analytics.ts): `returningTesters` | Consenting invitation identifiers with visit events at least 24 hours apart | Visits originate from session opening/checking; a return does not require a successful comparison or prove self-initiated use. UTC-day deduplication can undercount some return timing. |
| [pilot-summary.ts](../../pilot/scripts/pilot-summary.ts): return count | Verified ledger participants with two feedback-backed analysis IDs at least 24 hours apart | A user who returns and successfully compares but skips the second survey is missed. It can also include a live brief with unavailable scenarios. |
| Same summary: verified testers | Verified ledger entries that also have feedback records | Users who tested but did not finish feedback disappear from this denominator, creating completion bias. |
| Same summary: useful insight | Any Yes response among verified feedback participants | No explanation or comparison with the user's existing tool is required. |
| `willing_to_pay` event | User requested a discussion about a priced pilot | Interest is not a purchase or a credible priced commitment. The separate facilitator ledger is necessary. |
| `allThresholdsMet` | Counts meet 10/6/4/2 | Does not require task completion or a comprehension/safety gate. Do not treat it as a product go/no-go decision. |

The form's “before” intention is asked after exposure and is therefore retrospective. Record the real baseline before showing the comparison. Event references are server-issued and privacy-conscious, but they are not participant verification or a causal value measure. Current analytics does not record every lookup failure or meaningful tab inspection; manual session observations must retain those failures.

Thirty-day usage expiry and feedback purge have different implementations. The private pilot summary reads feedback records without applying the same expiry filter as the operations summary, so stale records may remain in summary counts until purged. A production retention schedule was not established here. Signing out deletes usage history; feedback has its own deletion receipt; facilitator notes/verification files/backups need their own consent and deletion procedure. Do not undo those privacy protections to improve retention counts.

## Concise interview script — approximately 15 minutes

Use ten distinct, screened, active/recent DLMM LPs. Aim for at least three mobile sessions, two multiple-position users and two out-of-range cases; these groups may overlap. Include existing native-terminal/third-party-tool users. A public wallet address alone does not prove ownership or LP experience: use a brief experience discussion and a voluntary position walkthrough, without signing or collecting keys. Record the screening method honestly.

1. **Consent and baseline, 2 minutes.** “We're testing RANGE, not you. No transactions, wallet connection or keys are needed. May we record brief, non-identifying research notes? Usage analytics and feedback storage are optional separately.” Ask: “When did you last manage a DLMM position? What were you considering doing next, and which tool would you normally use?” Record intent before showing results.
2. **Thirty-second comprehension.** Show the homepage—or direct `/app` link for a subgroup—without explaining features. Then ask: “What do you think this does? What would you expect it not to do?” Record their own words, not a coached Yes answer.
3. **Unaided task, up to 5 minutes.** “Using your invitation and a public address you're comfortable submitting, find a position and compare your options.” Stay silent. Record time, completion, selected position, errors, backtracking and any prompt needed. Do not retain the address. If a public sample or facilitator input is substituted, mark it as assisted/sample use.
4. **Financial teach-back, 3 minutes.** “Walk me through HOLD, REBALANCE and EXIT. What happens to your range? Which fees or costs are missing? Are unclaimed fees included? What does the minimum output mean? When would you refresh?” Check whether they understand estimates and lack of execution; then correct material misconceptions before ending.
5. **Incremental value, 2 minutes.** “What, if anything, did this reveal that your usual tool did not? What is still missing to make a decision?” Compare the same task with their existing workflow; alternate which tool comes first across participants. A changed decision is not inherently an improvement.
6. **Return and price, 1 minute.** “In what real situation would you open this again?” After the value discussion, present one consistent, defined continued-pilot offer at a specified price. Ask whether they would actually opt into it, not merely whether they like the idea. Do not charge, collect payment information or imply a purchase happened.
7. **Optional feedback, 1 minute.** Let them choose whether to submit the existing form. Explain the deletion receipt. Say they may return naturally during the next 14 days; do not schedule mandatory repeat analyses and count them as retention.

## Feedback and measurement plan

Before recruitment, freeze the offer, scope, definitions and threshold dates. Assign one invitation per person. Keep a minimal private facilitator ledger with consented study ID, eligibility, timestamps, assistance level, error category, teach-back result and a short insight category/explanation. Do not add wallet addresses, token amounts, balances, screenshots, seed phrases, keys or raw invitation codes to research notes.

The app already has separate optional analytics and structured-feedback consent. Declining analytics must not block use. With separate permission, a participant can contribute manual research observations without enabling usage analytics. If they decline all research recording, do not invent their outcomes or silently track them.

Report the complete funnel: invited → attended → eligible → attempted → successful task → opted-in analytics → submitted feedback → voluntary return. Count people, not events, for the headline pilot outcomes. Keep failed, unsupported and nonresponding eligible participants visible in the denominator; do not replace them until the threshold passes.

| Measure | Primary definition | Evidence |
|---|---|---|
| Thirty-second understanding | Independently describes public-position analysis, three options, and read-only/estimated nature | Facilitator observation before explanation |
| Unaided task success | Finds a supported real position and reaches a useful action comparison within five minutes, without prompts | Observation plus successful live response/events where consented |
| Useful insight | Describes a specific new, decision-relevant fact versus their normal workflow | Consent-based short explanation; form Yes is supporting evidence only |
| Comprehension | Explains excluded withdrawal/redeposit costs, principal/claim separation, quote uncertainty and token-mix-only rebalance scope | Teach-back, not self-rating alone |
| Return for value | Self-initiated successful live comparison at least 24 hours after first use and within 14 days | Consented timestamped comparison events plus confirmation of context; repeated survey not required |
| Credible willingness to pay | Accepts a defined scope at a concrete price and explicitly agrees to a follow-up/paid-trial commitment | Dated permission and evidence reference in the facilitator ledger; no payment collected here |
| Failure and coverage | All eligible attempts, including errors, unsupported assets and incomplete quotes | Manual task ledger; current success-only counts are insufficient |

Keep homepage visits, access checks, repeat surveys, reminder-driven returns, willingness-to-discuss and genuine commitments as separate measures. Do not present an exported public-position brief as anonymous—it contains position/pool identifiers even though feedback storage does not attach them.

## Proposed success/failure thresholds

These are preregistered pilot hypotheses, not measured results or statistical evidence of product-market fit.

| Criterion | Threshold to continue the narrow pilot | Failure interpretation |
|---|---|---|
| Genuine study participation | Ten distinct screened LPs with consent for the recorded measures | Fewer means incomplete recruitment, not a ten-user validation. |
| Thirty-second understanding | At least 8/10 | Below eight: purpose/scope communication needs work. |
| Unaided core task | At least 8/10 within five minutes | Below eight: fix the observed blocker before expanding recruitment/features. |
| Financial teach-back | At least 8/10 understand the boundaries unaided; zero unresolved material misconceptions at session end | Pause unmoderated testing if users infer guaranteed proceeds, complete costs, verified profit or executed transactions. |
| Useful incremental insight | At least 6/10, with a concrete explanation | Below six: insufficient incremental value; more dashboard features are not the default remedy. |
| Voluntary repeat comparison | At least 4/10 during the 14-day window | Below four: weak repeat-use evidence; separate reminders and return failures. |
| Credible price commitment | At least 2/10 for the same specified offer | Below two: monetization remains unvalidated; a “Maybe” or discussion request is not a pass. |
| Privacy/read-only boundary | No unintended transaction/signature request, sensitive-data collection or private-data disclosure | Any confirmed occurrence pauses the pilot pending correction. |

Success requires the comprehension and task gates as well as the 6/4/2 value thresholds. A ten-person convenience sample supports deciding the next experiment, not proving broad demand. Report exact counts and dissenting observations; do not infer that changed decisions improved financial outcomes.

## Minimal implementation plan if the identified blockers are authorized later

1. **Protocol and operator preparation — roughly half a day, no new product features.** Finalize consented ledger definitions, price offer, recruitment scope, purge/deletion owner and staggered sessions. Use existing feedback and events; interpret them correctly.
2. **Small recovery/copy patch — approximately 1–2 engineering days including targeted verification.** Add a clear Decision recovery path for an expired snapshot; preserve/confirm selected position and settings or disclose any reset. Add one-line REBALANCE scope and provider-data-flow notices. Preserve every existing age/mint/amount/fee/unknown-cost gate. No UI redesign or new financial model.
3. **Measurement correction only if manual operations prove inadequate — approximately one day.** Derive return analysis from distinct successful comparisons rather than visits or repeated feedback, keep eligible nonresponders in the denominator, and add comprehension as an operator go/no-go gate. No new wallet tracking or forced analytics consent. Document expiry/deletion effects and distinguish prompted returns.
4. **Private-host operational validation — approximately 1–2 days after a host is available and deployment is separately approved.** Validate single-instance Node/container, HTTPS/proxy headers, ten invitations, persistent private volume, backup/restore, retention and fresh supported live lookup/quotes. Re-run applicable regression/browser tests and build after any authorized patch. Host availability is not an engineering-time guarantee.

None of this plan has been implemented. No platform expansion, pricing subscription, transaction simulation, signing, automation or public deployment is needed to answer the initial usefulness question. Stop at the audit and review these gates before authorizing changes.
