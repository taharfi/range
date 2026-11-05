# Product Direction Scenarios

**Reviewed:** 2026-10-21

## Scenario A — Focused product

**Target:** active Meteora LPs making a HOLD, REBALANCE or EXIT decision.  
**Value proposition:** a fast, neutral brief that compares current inventory, range state, quote-aware conversion and known/unknown costs.  
**Architecture:** existing read-only Next.js pilot, Meteora adapter, Jupiter quote adapter, provenance and uncertainty model.  
**Complexity:** low-medium.  
**Monetization:** paid reports, team/API access or ecosystem sponsorship; willingness to pay unverified.  
**Distribution:** LP Army authors, Meteora community, wallet/alert partners.  
**Failure condition:** users do not change decisions or return after seeing the brief.

## Scenario B — Modular LP platform

**Target:** active LPs with multiple positions and monitoring needs.  
**Value proposition:** focused decision core plus optional alerts, saved positions, strategy assumptions and protocol modules.  
**Architecture:** modular adapters, event/notification service, evidence store and explicit accounting boundaries.  
**Complexity:** medium-high.  
**Monetization:** subscription tiers, API and partner integrations.  
**Distribution:** native and community tool handoffs.  
**Failure condition:** modules become a feature catalog without a core repeated workflow.

## Scenario C — All-in-one operating platform

**Target:** professional or delegated LP operators.  
**Value proposition:** discovery, analytics, strategy, management and selected execution in one system.  
**Architecture:** production indexer, wallet permissions/custody, transaction simulator, execution engine, monitoring, recovery and support.  
**Complexity:** high.  
**Monetization:** action/automation fees or managed-service revenue.  
**Distribution:** ecosystem partnerships and agent/tool channels.  
**Failure condition:** security/support burden and competitor overlap exceed differentiation.

## Recommendation

Start with Scenario A, design interfaces so Scenario B is possible, and treat Scenario C as a later option contingent on measured demand and security readiness.
