# Opportunity scorecard

As of **2026-10-20**. **No opportunity is commercially validated yet.** The LP Decision Engine narrowly leads as a *demand experiment*, while execution automation has the strongest historical request signal. Their ranking is not robust enough to justify a full build. Smart LP Intelligence was not selected by default.

## Evidence base and demand quality

[USER_PAIN_POINTS.csv](USER_PAIN_POINTS.csv) contains **43 dated, publicly authored requests/reports across 24 threads and 39 source-qualified public handles**: 31 Meteora forum posts, nine SDK issues and three Reddit OPs. Multiple comments in one discussion are requests, not independent discussions or buyers. Handles are not verified people; no wallet identity linkage was attempted. Of 43 records, **19 are from 2024, 21 from 2025 and only three from 2026**. Most evidence predates today's competitors.

The 34 forum/Reddit records include requests, self-reported experience and disclosed builders; the nine GitHub records are **indirect developer friction**, not nine additional customer purchase signals. Two copying-harm reports are counterevidence to unrestricted smart-wallet copying. SDK complaints and claimed financial losses were not independently reproduced. Promotions, pure agreement, bots, deleted posts and speculative grant proposals were excluded. No payment intent was established. [Reproducible counts and source records](data/opportunity_validation/offline_analysis.json).

| Hypothesis | All tagged records, overlapping | Forum/Reddit only | Interpretation |
|---|---:|---:|---|
| Decision | 18 | 17 | Inventory, chart/range decisions and metric interpretation; many features now served. |
| Smart / persistence | 12 | 8 | Reporting and configurable strategies; copying objections included. No direct validation of a persistence-ranking subscription. |
| Automation | 26 | 21 | Strongest repeated request theme: manual exits/rebalancing and one-token flows. Existing products materially reduce the gap. |
| Backtesting | 6 | 2 | Both community records concern scenario/metric analysis; **neither proves demand for a paid historical backtester**. Other records are SDK feasibility problems. |

Examples: U05/U07/U09 describe missed/manual exits or sleep-related monitoring; [out-of-range thread](https://proposals.meteora.ag/t/auto-swap-when-out-of-range/1153). U31 directly requests history to contextualize fee/current-TVL ratios; [metric request](https://proposals.meteora.ag/t/suggestion-to-upgrade-dlmm-ui-chart-of-tvl-fees-volume-changes-over-time-periods/873/1). U13/U15 object to being copied, while U14 requests compensation; [copying debate](https://proposals.meteora.ag/t/remove-accounts-that-copy-unauthorized-dlmm-wallets-from-the-airdrop/2175/1). C03/C04/C05 now offer many requested tools; see [competitor evidence](COMPETITOR_LANDSCAPE.md).

Access limitations: Reddit JSON returns 403; readable public web pages were used with calendar-day evidence, not guessed relative ages. X and LP Army/private Discord did not yield independently accessible first-hand evidence suitable for this CSV. Public Discourse pages sometimes expose only an initial post batch; we do not claim exhaustive coverage. The sample is purposive, forum-concentrated and not representative. Raw forum/GitHub responses, retrieval metadata and [Reddit reading notes](data/opportunity_validation/reddit_read_notes.json) are retained.

## Quantitative pain from existing data

Offline recomputation only; no pool expansion, new indexer or profitability pipeline change. Exact inputs and results: [script](scripts/opportunity_evidence.py), [analysis JSON](data/opportunity_validation/offline_analysis.json), [pool CSV](POOL_STATISTICS.csv), [stored daily series](data/phase2/histories.json).

| Observation | Result and denominator | Implication / limit |
|---|---|---|
| Pool concentration | 276 purposively collected pools, $161.78m reported TVL; top ten **63.3973%**, HHI **0.078547**. | Sampling concentration, not market-wide concentration or user demand. Reported TVL definitions remain important. |
| Activity versus liquidity | Median trailing volume/current TVL **0.010362** among 251 defined ratios; **61/251 >1**. | Activity varies sharply. Turnover is not return; current liquidity is not a time-weighted denominator. |
| Fee-to-liquidity ratio | Median **0.0000160967** = **0.00160967%** for 24h fees/current TVL. | No annualized yield or position entitlement inferred. In-range bin share, dynamics and costs matter. |
| Daily fee variability | September 19–October 18, 2026 UTC; all 24 pools have 30 stored volume/fee days. **15** have positive total fees; median population daily fee CV **1.8661**, range **0.4794–5.3852**. Nine all-zero series have undefined CV and are excluded. | Within the 15, median largest-day share **34.1989%** of the 30-day fee total. This is API-reported pool fee variability, not LP income or proof of every trade. |
| Historical gaps | Original 720 pool-day OHLCV grid has **310 missing days**; sparse TVL observations cannot supply daily historical liquidity. | Fee/TVL persistence and faithful replay are presently constrained. [Quality report](DATA_QUALITY_REPORT.md). |
| Lifecycle complexity | Six funded SOL/USDC positions span **40 distinct transactions**, with 2–21 transactions per position. Canonical position events include 18 removals, 18 fee claims and 16 rebalancing events. | Raw compatibility/preferred fee events appear twice: 18 ClaimFee aliases must not become 36 payments. Shared transactions must not duplicate wallet costs. [Lifecycle evidence](data/phase4/position_lifecycles.json). |
| Valuation ambiguity | **82 >5% inventory/API TVL differences** previously audited; **zero verified historical USD P&Ls**, including after Phase 5. | Different valuation/accounting definitions, timing and incomplete evidence must not become claims that the API is wrong or LPs unprofitable. [Audit](VALUATION_AUDIT.md), [Phase 5](PHASE5_FINDINGS.md). |

The native guide itself defines trailing fee/current-TVL, corroborating the denominator concern, without proving any intentional misrepresentation. [Official definition](https://github.com/MeteoraAg/docs/blob/main/user-guides/how-to-use-dlmm/dynamic-terminal.mdx). Dataset prices and today's quotes cannot establish historical net profitability.

## Weighted assessment

Scale 1–5 (higher better); `total = Σ(weight × score / 5) × 100`. Weights: demand 25%, differentiation 20%, feasibility 20%, ecosystem 25%, defensibility 10%. Scores are analyst judgments about a narrow first version, not measured market probabilities. Confidence below concerns each judgment. Inputs: [score_inputs.json](data/opportunity_validation/score_inputs.json).

| Opportunity | Demand | Differentiation | Feasibility | Ecosystem | Defensibility | /100 |
|---|---:|---:|---:|---:|---:|---:|
| LP Decision Engine: cost-aware exit/rebalance brief | 3.5 | 2.0 | 4.0 | 4.0 | 2.5 | **66.5** |
| Jupiter-powered liquidity execution automation | 4.0 | 1.5 | 2.5 | 5.0 | 2.0 | **65.0** |
| Smart LP Intelligence / strategy persistence | 2.5 | 1.5 | 3.0 | 3.0 | 2.5 | **50.5** |
| DLMM strategy backtesting | 2.0 | 1.5 | 2.0 | 2.5 | 3.0 | **42.5** |

### Evidence and confidence for every score

| Opportunity / criterion | Score; confidence | Basis |
|---|---|---|
| Decision / demand | 3.5; medium-low | U24/U26/U31/U41 ask for inventory/outcome clarity; 17 relevant community records, mostly old. Need current workflow interviews and payment evidence. |
| Decision / differentiation | 2.0; low | C01/C03/C05 already aid decisions; C05 documents arbitrary-wallet attribution limits. An uncertainty/cost-aware brief is a candidate distinction, not an established missing feature. |
| Decision / feasibility | 4.0; medium | Existing token reconciliation plus current quote assessment can support a bounded manual brief without full historical USD P&L. General automated advice remains harder. |
| Decision / ecosystem | 4.0; medium | Real Jupiter amount-specific quote comparison plus Meteora inventory/range context. Zero immediate swaps in read-only MVP; behavioral benefit unproven. [Integration map](ECOSYSTEM_INTEGRATION_MAP.md). |
| Decision / defensibility | 2.5; low | Opt-in decision/outcome records might accumulate useful feedback; no proprietary advantage, exclusive data or patent assumed. Easy incumbent replication. |
| Automation / demand | 4.0; medium | U04–U11 and U16–U20 give repeated manual-work requests. Current unmet demand remains weaker than historical demand. |
| Automation / differentiation | 1.5; medium-high | C03/C04/C05/C08 already offer major workflows. Better reliability or cost must be demonstrated, not asserted. |
| Automation / feasibility | 2.5; medium | Jupiter instructions and Meteora SDK make it possible; permissions, event/account changes, failed costs and recovery remain production risks. U32/U34/U37/U40 are concrete implementation reports. |
| Automation / ecosystem | 5.0; high architectural / low adoption | Most direct LP-to-swap composition. Extra volume is not automatically beneficial; unnecessary rebalances cost users. [Current build API](https://developers.jup.ag/docs/swap/build). |
| Automation / defensibility | 2.0; medium-low | Execution infrastructure can be copied; trustworthy operating history could help but is not yet owned. |
| Smart / demand | 2.5; low | Eight community tags, no demonstrated buyer for persistence scores; U13/U15 resist copying. Strong product marketing is not demand evidence. |
| Smart / differentiation | 1.5; medium-high | C02 rankings, C05 wallet scoring/copying and C04 creator compensation. Prospective persistence validation is unverified across competitors, not proven missing. |
| Smart / feasibility | 3.0; medium-low | Read-only cohorts possible, reliable profit rankings blocked by our historical valuation/accounting coverage; transfers, selection bias and ownership confound scores. |
| Smart / ecosystem | 3.0; medium-low | Meteora strategy context useful; Jupiter mainly downstream optional implementation. Broad rankings alone produce no swaps. |
| Smart / defensibility | 2.5; low | Longitudinal opt-in strategy records could help, but no evidence of persistent alpha, exclusive labels or consented distribution. |
| Backtesting / demand | 2.0; low | U25 asks for scenario simulation, not historical replay; U31 concerns metric history. No strong direct paid-backtest request in this sample. |
| Backtesting / differentiation | 1.5; medium-high | C03 explicitly documents DLMM Laboratory; C07 historical range tests and C11 scenario tools are adjacent. |
| Backtesting / feasibility | 2.0; high for current constraint | Missing OHLCV/TVL history and zero verified USD P&Ls constrain execution-faithful validation. Current prices cannot repair it. |
| Backtesting / ecosystem | 2.5; medium | Helps Meteora strategy study, but historical replay has little native Jupiter functionality before a separate execution handoff. |
| Backtesting / defensibility | 3.0; low | Validated historical bins and a prospective benchmark corpus might be valuable; obtaining/validating them is costly and demand unproved. |

### Sensitivity and decision

A **0.5-point** drop in Decision demand reduces its total by **2.5**, putting it below automation. A 0.5-point differentiation change moves either score by 2.0. The 1.5-point lead is therefore **not decisive**. Leave full product selection unresolved; prefer a low-cost, read-only decision experiment because it tests the shared user problem before assuming custody/execution responsibility. If users only want automation and reject a decision brief, this recommendation loses its basis.
