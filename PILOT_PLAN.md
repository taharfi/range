# LP Exit Intelligence — concierge pilot plan

Date: **2026-10-20**. This is a two-week demand experiment, not a validated product or a profitability study. The working local app is in [pilot/](pilot/). No testers have been recruited and no responses are pre-filled. Ten generated invitation codes are not ten users.

## Participants and workflow

Recruit **ten genuine, self-directed Meteora DLMM LPs** who can walk through a recent position decision. Start with classic SPL SOL/USDC positions. The facilitator should confirm that each tester can explain the public position and their actual workflow; a public wallet address alone is not proof of ownership. No signing, private key, seed phrase, balance transfer or paid subscription is needed. Recruitment/outreach has not been performed by this implementation.

1. The facilitator privately assigns one invitation code to one participant. Codes are in the ignored local `pilot/.env.local`; never put them in a public repository or shared screenshots. Reuse the same code for the follow-up. Do not create a code from a wallet address.
2. Before showing the comparison, ask for the user's intended action and the costs they expect. Write only consented, pseudonymous research notes. The app's before/after answers are retrospective, so this interview step reduces recall bias.
3. The participant enters a public wallet or open PositionV2 address. No wallet connection is offered. Wallet discovery is paginated; supported positions can be selected individually. Review warnings and the actual balance timestamp before proceeding.
4. Set an exit asset, target token-X share **by pool-mark value**, and slippage cap. Compare holding, the conditional inventory-rebalance scenario, and principal conversion after withdrawal. Review fees/rewards separately; all-cost execution totals may be unavailable.
5. Ask the participant to explain which amounts are observed, indexed, quoted or unavailable. Specifically ask whether Jupiter's minimum output includes Meteora withdrawal costs (correct answer: **no**). Do not coach them before recording the answer.
6. Invite optional feedback. The storage-consent checkbox starts unchecked, and the server rejects submissions without consent. A valid live-analysis receipt and invitation code are required. Synthetic example feedback is disabled. Give the participant their deletion receipt or let them delete immediately.
7. Ask them to initiate a second current analysis at least **24 hours later** within two weeks. An expressed intention to return is not an observed return. Do not manufacture repeat activity by refreshing the same brief during the first session.
8. For users interested in paying, discuss a concrete scope and price. No payment form or collection is implemented. A positive survey answer alone is not credible willingness to pay.

## Measures and proposed gates

These thresholds are **hypotheses**, not guaranteed outcomes or statistically representative validation.

| Measure | Definition | Proposed continuation threshold |
|---|---|---:|
| Genuine LP participation | Unique invitation-coded participants verified through a facilitated position/workflow walkthrough, with storage consent | **10** |
| Useful new insight | Unique verified participants reporting a useful new insight; retain their explanation, including negative feedback | **6/10** |
| Observed return | Unique verified participants with feedback tied to distinct live analyses at least 24h apart | **4/10** |
| Credible willingness to pay | Unique verified participants requesting a priced pilot **and** a facilitator-recorded concrete commitment, such as an accepted priced proposal/LOI; payments are not collected here | **2/10** |
| Comprehension | Self-rating plus the withdrawal-cost question | Report both; investigate any “all costs included” misunderstanding |
| Overlooked costs | Unique verified participants answering yes; ask which cost they had missed | Report, without treating every unknown cost as saved money |
| Decision change | Stated before/after intention differs | Report direction; a changed action is not automatically a better decision |
| Repeat intent | Survey intention to use again | Report separately from actual returns |

Suggested price-discussion range: **$20–50/month**, explicitly a research assumption. Never mark a paid commitment solely because the user selected a nonzero survey amount. Do not claim realized savings, optimal actions or future returns from this pilot.

## Feedback records and facilitator verification

`POST /api/feedback` stores validated structured answers as one JSON file per participant/analysis in `pilot/.pilot-feedback/` by default. Records contain HMAC-pseudonymized participant identifiers, analysis IDs/times, consent version, answers and deletion-token hashes. They contain no wallet/position address, invitation code, API key or usable analysis token. Free text is rejected. Separately consented usage measurement records server-issued event IDs/times, not lookup wallets, amounts, raw IPs or advertising identifiers. Necessary access cookies are HttpOnly; no browser local-storage tracker is added.

Self-reported LP status and survey payment interest remain **unverified** in every raw response. To count verified outcomes, the facilitator may maintain a separate, consented `facilitator-verifications.json` inside the private feedback directory. It is an array of records with this schema (no records are supplied):

```text
participantId: the HMAC identifier in the consented feedback file
consentRecorded: true (separate consent for the facilitator verification note)
genuineLpVerified: boolean
verificationDate: YYYY-MM-DD
method: facilitated-position-walkthrough
paidCommitment: null OR { date: YYYY-MM-DD, monthlyUsd: positive number, evidenceRef: private reference }
```

Keep names, addresses and payment details outside this ledger. Explain verification-note storage and obtain consent separately; the feedback checkbox alone does not authorize arbitrary interview notes. A reference is an actual consented commitment document, not an invented testimonial. Duplicate ledger participants are rejected. The summary joins only verified participants who also have consented stored responses.

From `pilot/`, run `npm run pilot:summary`. It reports observed answers, verified users, returns and commitments separately. **Current actual totals are all zero.** The summary does not inspect our research wallet sample or count automated/browser tests as testers. Test storage is isolated and its records are deleted.

Participants can delete a response immediately in the app, or keep the downloaded receipt and later call `DELETE /api/feedback` with `receipt` and `deleteToken`. Related feedback/payment-interest events are also erased. Signing out separately erases usage history. There is no feedback-list endpoint. Feedback expires 30 days after submission and usage expires 30 days after consent; the operator must schedule `pilot:purge` daily. The scheduler is not installed by preparing the configuration. Separate verification notes/backups need the facilitator's consent and deletion procedure.

## Decision after two weeks

Continue only if the 10/6/4/2 gates are met **and** misunderstandings do not depend on treating unavailable costs as zero. Compare against each tester's existing Meteora/HawkFi/Tidepool/LP Agent workflow. If they already get the same answer easily, or only want automatic execution, stop or revise this read-only wedge. If provider gaps dominate, establish that users value the missing answer before buying historical data or expanding infrastructure.

## Operations and recruitment readiness

Local app: `http://127.0.0.1:3000` while the process runs. It is **not publicly hosted**; ten external testers need a facilitator-led local session or a separately configured persistent Node deployment. Use a persistent private volume for feedback, server-only secrets, and access controls appropriate to the pilot. The default binds to loopback. No deployment, subscription purchase, grant application or user outreach has occurred.
