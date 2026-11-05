# RANGE — ten-user pilot facilitator pack

2026-10-23. Use the existing invitation-only Portfolio → Position → Decision flow. This is a research procedure, not evidence that recruitment or testing has occurred. Expanded note/measurement requirements remain proposed under [the privacy specification](PILOT_MEASUREMENT_SPEC.md); approve that protocol before collecting new manual fields or implementing telemetry. No new telemetry was added.

## Before the first session

1. Name the research/privacy owner; approve consent wording, fields, access, private storage, retention/deletion and backup handling. Review this template against the existing measurement specification. Never store actual study logs or contact mappings in the repository.
2. Freeze the hypotheses below before observing results. Assign one existing invitation privately per participant; codes are access credentials, not participant evidence. Keep any optional contact mapping separate from observations.
3. Select ten active/recent Meteora DLMM LPs through an experience discussion. Public address lookup does not prove ownership. Prioritize supported classic SOL/USDC positions for the core decision task; record unsupported cases instead of silently replacing participants.
4. Use a facilitator-led local session until secure remote hosting has been tested and separately authorized. Do not give remote testers a loopback URL. Do not send outreach or invitation messages without explicit instructions.
5. Rehearse liveness/readiness, the invitation gate, a supported live position, unavailable costs, deletion and expired-snapshot refresh. Schedule sessions sequentially to respect provider budgets. Keep demo and live data distinct.

## Concise interview script — approximately 20 minutes

Ask permission for access, optional usage measurement, structured feedback and facilitator notes separately. Explain that opting out of optional research storage does not remove invited tool access. Do not record wallets, balances, secrets, screen recordings or raw errors in research notes.

1. **Context, 2 minutes:** “Tell me about your last liquidity decision. What did you check, and which tools did you use?” Verify experience without claiming cryptographic ownership.
2. **Baseline, 2 minutes:** “For the position you will inspect, are you leaning toward holding, changing the token mix/range, exiting, or unsure? Which costs do you expect?” Capture intended action before exposing the comparison, only if notes are consented.
3. **First impression, 30 seconds:** Show the search screen. “What do you think RANGE does? Would it move your funds?” Record understanding before coaching.
4. **Unaided task, up to 5 minutes:** “Find a real supported position and compare your options.” Do not guide clicks. Time lookup→position→comparison; distinguish provider/data failure, unsupported position and usability difficulty. Both-unavailable conversion scenarios are not a useful core decision completion.
5. **Financial understanding, 3 minutes:** “Explain principal versus fees. What does REBALANCE estimate? Which costs are missing? Does the Jupiter minimum include withdrawal/redeposit costs?” Correct material misconceptions after recording the unaided answer. A swap estimate is not a full DLMM range migration.
6. **Value, 3 minutes:** “What did this reveal that your usual tool did not? Is it relevant to your decision? What remains unclear?” Generic praise and a changed intended action are not proof of improved returns or concrete insight.
7. **Comparison, 2 minutes:** Compare with their usual tool. Alternate which tool is shown first across sessions to reduce order bias. Do not imply a competitor lacks features without checking the task.
8. **Optional feedback and payment discussion, 2 minutes:** Offer the existing consent-based form and explain the deletion receipt. “Would you want continued access? For what specific job and at what price?” Survey interest is not a commitment. No payment collection occurs here.

Explain an optional 14-day observation window. A voluntary return must be self-initiated at least 24 hours after initial use and involve a useful fresh comparison. A scheduled check-in, visit, refresh or repeated survey does not establish it. Do not prompt use and then label it voluntary. Distinguish missed, declined and unavailable observations.

## Frozen hypotheses and stopping rules

| Measure | Proposed continuation threshold |
|---|---:|
| Screened, study-consenting genuine LP participants | 10 distinct people |
| Explain the product within 30 seconds | At least 8/10 |
| Useful live comparison without assistance within five minutes | At least 8/10 |
| Explain material financial boundaries before coaching | At least 8/10 |
| Describe a concrete useful new insight | At least 6/10 |
| Voluntary useful return within 14 days, at least 24 hours later | At least 4/10 |
| Credible commitment to a defined priced continuation | At least 2/10 |

Report invited, attended, eligible, attempted, successful, usage-consenting, responding and returning denominators separately. Keep failed/unsupported/nonresponding participants visible. Missing evidence is not a negative answer or a success. Pause for a privacy/signing boundary violation or unresolved material misunderstanding. Small-cohort thresholds are directional hypotheses, not product-market fit.

## Recording and reporting

The [blank session template](PILOT_SESSION_TEMPLATE.csv) contains no participants or example outcomes. It is a proposed manual form pending protocol approval, not a new app collection mechanism. Fill it only in approved private storage, with separate consent. Use bounded categories/pass-partial-fail where sufficient; reference private consented notes without embedding identifiable narratives. Delete on withdrawal and within the approved maximum retention (the proposed protocol specifies no more than 30 days). Account for backups separately.

Existing `npm run pilot:summary` reports retained structured responses and facilitator verification records. It now excludes expired responses and distinguishes repeat-feedback proxies from voluntary returns. Its `allThresholdsMet` remains false until separately consented protocol evidence is reviewed; it cannot certify manual comprehension/task/return outcomes. Existing visit counts must not be relabeled as verified LPs. No new notes or event types are ingested by the application.

After ten sessions and the return window, review positive and negative evidence together. If fewer than six gain a useful insight, revisit the problem before adding Explore. If provider gaps dominate, quantify affected users and establish demand for that missing answer before extending infrastructure. If users chiefly want a different task, use that evidence to revise the sequence explicitly.
