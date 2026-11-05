# 90-Day Research-Validated Roadmap

**Reviewed:** 2026-10-21  
**This is a proposed validation roadmap, not an implementation instruction.**

## Days 0–30: Decision brief validation

- Test current HOLD/REBALANCE/EXIT brief with active LPs.
- Measure whether users can identify the decision, confidence and missing cost.
- Capture decision changes, repeat visits and unresolved questions.
- Do not add execution or custody.

**Success:** at least 10 active LP sessions, most users identify one actionable next step, and repeated users request the same evidence module.  
**Failure:** users prefer existing terminal views or cannot trust the data boundary.

## Days 31–60: Strategy and monitoring module

- Add strategy assumption cards for bid-ask, curve, ape-in, spot/directional and bear-market modes.
- Prototype configurable out-of-range and quote-age alerts.
- Compare against DLMM Alert/native workflows.

**Success:** users select a strategy explicitly, understand its risks, and return for monitoring.  
**Failure:** strategy labels confuse users or produce no repeated workflow.

## Days 61–90: Distribution and integration experiment

- Offer a read-only shareable decision artifact or API response.
- Test handoff links to Meteora/Jupiter/native execution without signing.
- Approach one community/alert partner with a minimal evidence-backed integration proposal.

**Success:** partner or users complete the handoff and request continued access; quote and data freshness remain within policy.  
**Failure:** no distribution pull, data limits prevent useful decisions, or partner requirements imply custody too early.
