# Pool Party competitor analysis

Checked **2026-10-19 UTC**. Pool Party is a material documented competitor for social LP discovery and portfolio analytics. It is also a possible validation collaborator. Neither finding selects a product for this project.

Evidence labels: **documented** means stated in current official guides; **observed** means directly retrieved in this audit; **unknown** means accessible evidence does not establish implementation or absence. Member-only workflows were not tested. The public Grid product query for the exact name returned no matches; this is a coverage limitation, not evidence of inactivity or lack of competitors. Current primary sources take precedence.

## Comparison with the four hypotheses

| Hypothesis | Existing documented overlap | Differentiation still requiring evidence | Research implication |
|---|---|---|---|
| LP Decision Engine | Pool discovery by member participation, TVL/volume/liquidity sorting, pair-price candles, chain-read liquidity bins and permitted member ranges. [Pool guide](https://lppool.party/guide/pools). | Prospective recommendations, calibrated downside estimates and decision explanations were not established. | A generic pool dashboard or social range overlay is already documented. Test whether independent risk/accounting evidence changes decisions. |
| Smart LP Intelligence | Performance-ranked member discovery, time windows, following/country views and badges. [Leaderboard guide](https://lppool.party/guide/leaderboard). | Exposure-adjusted skill, held-out persistence, concentration, drawdown and uncertainty-aware ranking are not established by the listed ranking measures. | Strong overlap with a leaderboard/profile product; do not claim an empty market. |
| Liquidity-to-Trade Automation | Analytics, pool links and observations of participant activity. | [Current terms §3](https://lppool.party/terms) explicitly describe read-only operation and no transaction execution; future actions are conditional on new terms and opt-in. | Execution is not offered under the inspected service description. This is not proof of a durable gap, demand, feasible execution economics or a development commitment. |
| LP Backtesting Lab | Retrospective position outcomes, history views and a PnL calendar. [Profile guide](https://lppool.party/guide/profile). | Counterfactual range simulation, hold-relative results, independently validated USD prices and replayable event/cost assumptions were not verified. | Historical reporting overlaps part of this hypothesis; it does not establish a backtesting engine. |

## Are the proposed gaps actually missing?

| Capability | Evidence-supported assessment | What would resolve the unknown |
|---|---|---|
| Independent historical accounting | Documentation attributes statistics to Meteora. [Terms §3/§7](https://lppool.party/terms) also identify upstream data reliance. Independence from that upstream is **not demonstrated**; internal accounting methods cannot be ruled out. | Methodology, transaction/cash-flow lineage, independent price sources, schema/version history and reconciliation examples. |
| Risk-adjusted rankings | Published ranking choices are outcome/fee/deposit/win-rate metrics, not a demonstrated risk model. **Not documented**, rather than proven absent from the whole product. | Inspect an authorized methodology and UI; check loss severity, leverage/exposure, time-weighting, minimum sample and uncertainty. |
| Buy-and-hold benchmarks | No capital-matched hold comparison was established in inspected documentation. A denomination switch does not answer the counterfactual. | A documented lot-funding/exit convention, treatment of partial flows, fees and costs, and worked outputs. |
| Strategy persistence | **Partly addressed:** linked pool ideas and activity exist. [LP-idea guide](https://lppool.party/guide/lp-ideas). That does not establish systematic strategy versioning or predictive persistence measurement across regimes. | Stable strategy/cohort identity, predefined features, out-of-sample tests and wallet-change handling. |
| Execution-cost analysis | No itemized network/native-payment/priority/platform-cost reconciliation was verified. Whether costs are already embedded in source PnL is **unknown**. | Explicit cost inclusion rules and signature-level examples, including managed-position fees. |

These unknowns are research questions, not advertised differentiators. No claim is made that Pool Party lacks a feature merely because this audit could not access it.

## Data independence and comparability

Pool Party's upstream relationship matters: reproducing a Meteora-derived number through a second interface does not independently validate Meteora's historical pricing. Pool Party may add aggregation, managed-position coverage and history retention; those additions could still be useful, but their methodology needs examination. Our Phase 5 chain reconciliations and approximate USD estimates should remain separate from any future provider-reported values.

Visibility-protected member performance also differs from an exhaustive on-chain population. The [privacy policy](https://lppool.party/privacy) protects identity linkage; an anonymous member outcome must not become a wallet attribution through inference. This limits a passive competitor dataset but can support a consent-based partner study.

## Recommendation

**Use as a competitor benchmark now**, based on official documentation. **Consider a research/validation partnership** that preserves member privacy and supplies explicit research rights and methods. **Do not integrate it as a production data provider yet**: no public API contract or authorized sample was verified. Do not dismiss the service altogether; it demonstrates significant existing overlap, and cooperation could resolve accounting questions more efficiently than reproducing social features.

No final product, frontend, automation or paid service was selected. No provider or community member was contacted.
