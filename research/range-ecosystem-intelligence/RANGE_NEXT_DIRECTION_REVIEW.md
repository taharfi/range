# RANGE — next direction review

Reviewed **2026-10-21**. Research and planning only. No application, dependency, test, configuration, branding or Copilot research changes are authorized by this report. No Git repository was initialized.

## Decision in brief

**Prefer a controlled validation of RANGE's existing position-decision workflow before funding another product module.** The potential next product is an evidence-backed, read-only pre-action brief for active Meteora DLMM LPs. Its proposed improvement is to explain what can actually be established before an exit or inventory change, rather than add another dashboard or promise complete costs.

This is a preferred **experiment**, not a decision to implement. Current quotes, incomplete withdrawal information and explicit uncertainty may be insufficient for users; that must be tested against their existing tools. If users do not return, existing development investment is not a reason to continue.

The three realistic options, in order for the next experiment, are:

1. **Position decision and pre-action evidence:** strongest implementation fit; meaningful demand is plausible, differentiation and payment remain unproven.
2. **Author-assisted DLMM scenario workspace:** credible alternative for pre-entry users; model token/range behavior under explicit assumptions, without claiming validated historical fees or alpha.
3. **Position-accounting evidence audit for LP tools/operators:** matches the developer evidence more closely than a retail product does; viable as a narrow manual service experiment before building an API.

Do not build these together. Do not launch a strategy directory, backtester, unified portfolio, execution engine or all-in-one platform to create a larger narrative.

## 1. What was inspected and how claims are classified

The requested directory exists at `C:\Users\user\Desktop\jup-meteora-research\research\range-ecosystem-intelligence\copilot`. The ten prioritized files exist at the requested paths. This review read them, the supporting demand/traction/integration notes, the current TypeScript app and adapters, selected Python research/accounting modules, stored phase summaries and prior limitations/validation reports.

Evidence labels used below:

- **Local-code verified:** present in inspected implementation; this does not mean all real-world cases work.
- **Documented:** stated in current first-party documentation inspected today; execution or performance was not independently tested here.
- **Observed artifact:** a count, schema condition or result found in the retained research files.
- **Inference / proposal:** our interpretation, estimate or future design; not validated demand.
- **Unknown:** evidence does not establish the claim.

Source and report dates are separated from transaction dates and publication dates. Public pages were read without logging in or submitting transactions. No protected account, private feedback records or production secret values were inspected. Tests and builds were **not rerun** for this document-only review; previous recorded results are identified as such.

## 2. What the Copilot research genuinely changes

### A. Strategy content is a distribution hypothesis worth testing

The [LP Army library](https://www.lparmy.com/strategies), accessed October 21, displays 374 strategies and 114 contributors. That establishes the site's stated content supply, not independently counted complete strategies, readers, successful traders or paying customers. The eight retained cards demonstrate varied approaches and a tool-assisted research workflow. They are a reason to interview authors and test explicit rulesets, rather than conclude that a profitable-strategy marketplace is demanded.

The important distinction is **formalization before simulation**: obtain the actual entry, bin/distribution, sizing, rebalance and exit rules, and identify what is discretionary. A directory excerpt cannot supply missing rules. Source-author permission and attribution would be needed for reusable curated content; public accessibility is not a blanket license to republish articles.

### B. Reliability is a possible separate customer problem

The second-pass issue dataset concerns event coverage, account layouts, fee handling, quote errors and transaction construction. Those are relevant to an SDK integrator or analytics operator, and to RANGE's correctness requirements. They do not establish that retail LPs want an engineering observability product. For example, [DLMM SDK issue 241](https://github.com/MeteoraAg/dlmm-sdk/issues/241) reports possible double fee application, and [issue 247](https://github.com/MeteoraAg/dlmm-sdk/issues/247) reports IDL/account-layout mismatch. These are reports, not defects reproduced by this review or proof that the current SDK remains broken.

This creates an alternative **B2B audit experiment**, not permission to build a broad indexer. RANGE already has event-alias and reconciliation research that could be useful in bounded cases.

### C. A modular journey is plausible, but not a four-module roadmap

Current official Meteora interfaces provide discovery, account/bin inspection and transaction-building primitives. Jupiter provides genuine amount-specific swap quotes. Those support several narrow products without inventing a protocol or buying a broad data feed. They do not provide complete historical LP performance, a strategy's future fees, a universally valid withdrawal estimate or customer acquisition. See the official integration checks in section 5.

### D. Competition materially limits the claimed gap

The native [Dynamic Terminal](https://docs.meteora.ag/user-guides/how-to-use-dlmm/dynamic-terminal), accessed October 21, already documents pool/risk context, position management, charting, rebalancing and entry/exit workflows. [HawkFi Laboratory](https://hawkfi.gitbook.io/whitepaper/hawkfi-laboratory/liquidity-providing) documents DLMM strategy tests, passive LP and HODL comparisons, and drawdown. [Revert's range backtester](https://docs.revert.finance/revert/playbooks/backtest-before-funding) is a separate EVM precedent and explicitly acknowledges snapshot and capital-dilution limitations.

Consequently, “simulation,” “HODL comparison,” “risk metrics,” “transparency” and “Jupiter integration” are not inherently new capabilities. A narrower advantage must be demonstrated through a task users currently struggle to complete, better evidence or lower effort. Missing implementation evidence is not evidence that a competitor lacks a feature.

## 3. Research corrections and unsupported conclusions

The source files remain unchanged. The following are review findings, not repaired datasets.

### 3.1 Scores are not one consistent, reproducible ranking

The first-pass [score CSV](copilot/06_opportunities/OPPORTUNITY_SCORECARD.csv) has seven directions. Its arithmetic reproduces the stated totals. The revised [challenge report](copilot/09_second_pass/CHALLENGE_REPORT.md) has six directions, different scope/labels and no revised per-criterion inputs.

| Direction | First-pass CSV | Second-pass narrative |
|---|---:|---:|
| Decision intelligence | 70 | 69 |
| Strategy intelligence/backtesting → discovery/simulation | 56 | 72 |
| Modular/unified portfolio | 67 | 67 |
| Automation | 66 | 64 |
| Wallet intelligence/copying | 53 | 57 |
| All-in-one | 56.5 | 55 |
| Neutral data/decision API | 67.5 | Omitted |

The strategy score changes both the evidence and the product definition: a constrained scenario tool is easier than historical backtesting. The increase from 56 to 72 cannot be attributed to a measured demand increase or reconstructed from the report. No sensitivity table, uncertainty intervals or independent rater data establish that a three-point lead over decision intelligence is meaningful.

Under the stated weights, a one-point change on the 1–5 demand scale changes the total by five points; a one-point differentiation change changes it by four. Either exceeds the revised three-point lead. **Treat the top two as uncertain alternatives, not a proven winner.** Reuse lowers RANGE's experiment cost; it does not increase market demand.

### 3.2 Strategy CSVs are not safe import inputs

Using Python's standard CSV reader:

- `LP_ARMY_STRATEGIES.csv`: eight data rows, 21 header columns; physical rows **2, 3 and 5 have 20 fields**, so some later field labels are misaligned.
- `LP_ARMY_STRATEGIES_SECOND_PASS.csv`: 32 data rows, 14 header columns; all **24 inventory rows have 15 fields**.
- The second file contains eight baseline summaries plus 24 inventory rows, **23 distinct source URLs overall**, including the baseline URLs. It is not 32 independently analyzed strategies. The inventory has 15 distinct URLs not in the eight-card baseline.
- All inventory `date` fields say October 21. Given their capture context, those must not be treated as verified source publication dates.

Counts based on the unaffected `record_type` and URL columns are usable; shifted rule, evidence or access-status fields are unsafe for automatic interpretation. Qualitatively, the cards do not provide complete machine-testable policies. Missing rules remain unknown; “implied” rebalances or exits are analyst interpretation. None is an independently validated profitable strategy.

### 3.3 More issue rows do not create more retail customers

The first [pain dataset](copilot/05_users/USER_PAIN_POINTS.csv) contains 43 records, 24 thread identifiers and 39 platform-qualified handles: 31 forum records, nine GitHub issues and three Reddit records. Its year counts are 19 in 2024, 21 in 2025 and three in 2026.

The second [evidence dataset](copilot/05_users/USER_EVIDENCE_SECOND_PASS.csv) contains 25 issue records. SDK issue **247 is already present** in the first dataset. Together these are 68 rows and **67 distinct source URLs**, not 68 new independent discussions or people. Twenty-three of the second-pass records are dated 2024–2025. Generic reporter labels cannot establish distinct authors or independent buyers.

Issue reports can support engineering feasibility concerns. They cannot establish demand for strategy discovery subscriptions or the price retail LPs would pay. An “A: reproducible” label is a dataset judgment; this review did not reproduce the defect. A concrete counterexample is issue 241: its visible body links a historical code line, and it was closed as completed on September 8, 2025. The CSV's “A: reproducible technical report” label overstates what that body alone establishes. Issue age, present status and fix/version applicability need separate checking.

The sampled failure report in [Invent issue 83](https://github.com/MeteoraAg/meteora-invent/issues/83) concerns **DBC and DAMM v2**, not a measured failure rate for DLMM, RANGE or all LP transactions. Its author also describes their own diagnostic/repair tool; it is builder evidence with that context, not a neutral customer purchase signal. It cannot justify an assumed DLMM reliability business on its own. No price, purchase, retention or causal outcome experiment in the supplied research validates any direction.

### 3.4 The feature matrix overstates RANGE

Corrections to the [feature matrix](copilot/02_competitors/FEATURE_MATRIX.csv), established from the current implementation:

| Matrix wording | Correct classification |
|---|---|
| HODL benchmark “Confirmed in decision framing” | HOLD is present; a capital-matched historical hold benchmark is **not a live product feature**. |
| Realized/unrealized P&L “Partial” | Research has approximate historical scenarios. The app does **not** calculate verified historical or live USD P&L. Its USD position value is explicitly unavailable. |
| Strategy/pool/wallet discovery “Partial” | Bounded research collectors exist; the user-facing app looks up submitted addresses. It is not a pool feed, public wallet-discovery service or strategy directory. |
| Rebalancing “Read-only plan” | Correct only if understood as a **single inventory-composition swap**. There is no new-range selection, liquidity removal/redeposit simulation or full rebalance. |
| Historical performance “Partial” | Isolated Python research artifacts, not a validated historical-performance product or online service. |
| API “No” | Internal server API routes exist. A documented, independently supported external analytics API is not implemented. |

For competitors, “No,” “Advertised,” “Confirmed” and “Not verified” are used inconsistently. Several rows cite only one overview URL for many feature claims. Absence requires a direct statement or bounded test, not silence in an overview. Keep documented capability, successful execution, independent accounting validation and adoption as separate columns in any future matrix.

### 3.5 Specific second-pass recommendations exceed the evidence

“Generic dashboards hide provenance,” “directories do not normalize rules” and “pool screens rarely explain failure causes” are plausible hypotheses, not verified sector-wide absences. Replaying 20 historical range transitions with complete costs in two to four weeks is not supported by RANGE's available historical state. Similarly, six accessible rulesets would not establish replay validity: they would first need complete inputs and an appropriate model. Alerts that provoke action do not prove beneficial decisions; misleading alerts and unnecessary churn must be measured separately.

The [integration matrix](copilot/03_meteora/INTEGRATION_MATRIX.csv) also conflates quote-only work with transaction construction in its security assessment. A read-only cross-protocol **current** portfolio can use protocol APIs without a custom indexer; exhaustive historical accounting may need retained indexing or a data partner. “Custom indexer required” is too categorical for all portfolio scopes.

## 4. Existing RANGE infrastructure: what is genuinely reusable

### Product and frontend

The public `/` homepage is separate from `/app`. The client [RangeApp component](../../pilot/app/components/RangeApp.tsx) uses React state for Search → Position → Decision. It supports multiple returned positions and pagination, live/synthetic separation, errors/loading, action tabs, freshness notices, settings, analysis export and optional feedback. There is no wallet connector, signer or executor. This is a focused product shell worth preserving, not a reason to add a discovery dashboard.

[Decision.tsx](../../pilot/app/components/Decision.tsx) presents only the selected action. The app always shows reliable position USD value as unavailable; it does not turn the pool's reported TVL into the user's value. The UI marks quotes stale after 30 seconds. Existing settings are scenario defaults, not recommended portfolio weights.

### Meteora and RPC

[meteora.ts](../../pilot/lib/meteora.ts) uses the documented DLMM Data API:

- `/portfolio/open` for the submitted wallet's pool list;
- `/pools/{address}` for metadata;
- `/positions/{pool}/pnl` to extract current inventory/fees, rather than accept the API's historical P&L as independently verified.

Direct lookup checks the DLMM program, PositionV2 discriminator and pool/owner prefix through `getAccountInfo`. Mint checks independently verify classic SPL Token ownership, initialization and decimals. These checks do not independently reconstruct every bin balance, operator right, reserve condition or withdrawal restriction. Unsupported/unverified mints block quotes, including Token-2022 scenarios in this pilot.

Wallet pages use five pools and 20 positions per pool page; direct lookup searches at most five 100-position pages. Partial results and next pages are represented. This is not an exhaustive multi-wallet account index.

### Jupiter and financial logic

[jupiter.ts](../../pilot/lib/jupiter.ts) calls `/swap/v2/order` without taker, payer or referrals; validates assets, atomic amounts, minimum output and slippage; and requires a null transaction response. It records quote source, receipt time, route and optional context slot. Costs without usable payer evidence remain unknown. No submission route exists.

[math.ts](../../pilot/lib/math.ts) provides bigint atomic conversion and 80-digit Decimal arithmetic. [brief.ts](../../pilot/lib/brief.ts) separates principal from unclaimed fees/rewards, retains included Jupiter fees without subtracting them twice, and sizes a single swap against the current pool mark. Its assumptions explicitly exclude full withdrawal, account-close, claim and redeposit costs. HOLD means no immediate action/spend, not proof of the most profitable choice.

The live `Position` contract lacks per-bin liquidity shares and a validated USD valuation observation. Its bin boundaries cannot substitute for the full distribution of an existing customized position. The quote adapter and amount arithmetic are reusable; the rebalance sizing formula is **not** a DLMM strategy simulator.

### Backend, security and persistence

Next.js Node route handlers proxy providers. Server-owned short-lived snapshot handles prevent the browser from supplying arbitrary balances to the quote engine. Invitation sessions, origin checks, bounded bodies, global/per-tester rate limits, provider queues and concurrency limits are implemented. Usage requires consent; structured feedback and deletion are supported. See [guard.ts](../../pilot/lib/guard.ts), [http.ts](../../pilot/lib/http.ts), [session.ts](../../pilot/lib/session.ts), [analytics.ts](../../pilot/lib/analytics.ts) and [storage.ts](../../pilot/lib/storage.ts).

This remains a **single-process pilot architecture**. Snapshots, pacing, limits and serialization locks are process-local; feedback persistence is file-based. It does not provide durable distributed jobs, shared rate limits, multi-instance snapshot availability, alert scheduling or historical portfolio storage. Production launch gates from [MVP_LIMITATIONS.md](../../MVP_LIMITATIONS.md) still apply.

### Historical research and accounting

The Python [collector](../../src/research/collector.py) and [Phase 2 archive](../../src/research/phase2.py) retain raw evidence, validate contracts and persist DuckDB/Parquet. [Lifecycle reconstruction](../../src/research/lifecycle.py) handles event identity, fee aliases, token transfers, chronology and completeness gates. [economic.py](../../src/research/economic.py) has strict valuation gates; [Phase 5](../../src/research/phase5.py) adds capital-timed cash-flow/hold coefficients and explicitly approximate price scenarios. [onchain_prices.py](../../src/research/onchain_prices.py) screens historical observations and aggregates references.

Stored, bounded results—not new measurements in this review:

| Artifact | Observed retained result | Practical limit |
|---|---|---|
| Phase 2 pool study | 276 sampled pools; top-ten reported TVL share about 63.4%; 24 selected historical series | Purposive, dated sample; not today's ranked opportunity set. |
| Historical quality | 310 missing OHLCV pool-days in the original grid; insufficient TVL snapshots | No complete historical bin liquidity, fee entitlement or fill path. |
| [Phase 3 summary](../../data/phase3/phase3_summary.json) | Ten closed histories/reconciliations, nine funded in that selected cohort | A successful bounded cohort, not arbitrary-history coverage. |
| [Phase 4 summary](../../data/phase4/phase4_summary.json) | Six funded SOL/USDC positions, six chain/cost reconciliations, 40 distinct lifecycle transactions | Zero verified USD P&Ls/hold benchmarks. |
| [Phase 5 summary](../../data/phase5/summary.json) | Six approximate P&L scenarios; zero verified USD P&Ls; references at 13/15 target times | Quality/coverage remain insufficient for independently verified returns. |
| Valuation audit | 82 outliers: 76 unresolved price/accounting definitions and six missing/nonpositive source prices | Not evidence that reported API TVL is wrong. |

The Phase 5 reference recovery and independent candle comparison are valuable research, but agreement between sources is not calibrated valuation accuracy. No current quote, assumed USDC peg or hourly mark may silently fill a historical gap. These routines are not yet an online service. Reuse their validation patterns and bounded fixtures first.

### Tests and technical debt

Current source declares 29 pilot unit tests and 13 browser/API tests. The retained [validation record](../../pilot/evidence/VALIDATION.md) reports those passing alongside 72 research cases and a successful production build during the homepage sprint. Python parameterization means source function count differs from executed case count. This review makes **no new passing-test claim**.

Coverage includes precision, mint/position validation, stale/missing data, quote conservation, fee handling, invitation/consent, errors and responsive navigation. Python cases cover lifecycle aliases, reconciliation, price chronology and missing valuations. There is no evidence of validated strategy replay, a 1,000-position production service, robust token-extension handling or a signing system.

Material debt before expansion: hand-maintained account-prefix/schema assumptions; separate Python and TypeScript financial models; absent bin-distribution/valuation contracts; single-process queues and transient snapshots; limited pagination; duplicated SOL/USDC constants; and short-lived quotes whose refresh may require a fresh position lookup. The live package does **not** currently depend on the Meteora DLMM SDK or Solana web3 SDK. Proposed SDK-backed simulation/validation would be a new, version-pinned integration, not an existing capability.

## 5. Official integration checks and boundaries

All links below were accessed October 21, 2026. Documentation support is not an executed integration test.

| Official source | What it supports for planning | What it does not establish |
|---|---|---|
| [Meteora Data API overview](https://docs.meteora.ag/developer-guides/dlmm/api-reference/overview) | Current pool discovery, open portfolios, position history and indexed P&L; publishes a 30-RPS limit | Historical completeness, independently validated prices or a service-level guarantee. RANGE's conservative local pacing is not that published ceiling. |
| [SDK getting started](https://docs.meteora.ag/developer-guides/dlmm/typescript-sdk/getting-started) and [reference](https://docs.meteora.ag/developer-guides/dlmm/typescript-sdk/reference) | Pool/position reads, bin/strategy helpers and liquidity/swap builders | A historical replay engine or a guarantee of safe transaction composition. Package/version compatibility and relevant license terms must be reviewed before adoption. |
| [DLMM accounts](https://docs.meteora.ag/developer-guides/dlmm/program/accounts) | Position, pool and bin-array state; official IDL/types for layouts | One coherent historical snapshot from unrelated API/RPC reads. |
| [DLMM formulas](https://docs.meteora.ag/core-products/dlmm/formulas) | Fixed-price bins, liquidity-share, fee and rounding mechanics for an explicitly scoped model | Fees from aggregate TVL/volume alone or one unique execution path from OHLCV. |
| [DLMM instructions](https://docs.meteora.ag/developer-guides/dlmm/program/instructions) | Liquidity, claims, close/resize, operator and rebalance primitives | Owner-only authority assumptions or complete cost estimates. |
| [Meteora Invent actions](https://docs.meteora.ag/invent/actions) | Existing configured action workflows and development examples | A signer-free product execution API. The documented CLI includes key-based setup and is not a drop-in read-only RANGE integration. Nothing was installed or run. |
| [Jupiter Swap API](https://developers.jup.ag/docs/swap) | Quote-only `/order` without taker; keyless 0.5 RPS for prototyping; optional keyed production limits | Historical marks, a complete LP-exit bill or a future fill guarantee. |
| [Jupiter Build](https://developers.jup.ag/docs/swap/build) | Raw Metis instructions for possible future custom composition | Same route/output as a multi-router `/order` quote. JupiterZ quotes are not freely editable withdrawal/redeposit transactions. |

Two attempted Meteora URLs ending in `/overview` and `/typescript-sdk/sdk-functions` were unavailable. The official documentation index resolved the working `getting-started`, `reference`, accounts and API pages above. No guessed endpoint was used as evidence.

## 6. DISCOVER → SIMULATE → DECIDE → ACT

This is an optional relationship between capabilities, **not a required funnel**. A user with an existing position should continue entering directly at DECIDE. A prospective LP may start with a scenario; neither needs a broad feed first.

| Module | Feasible narrow scope | Differentiation and value | Gate |
|---|---|---|---|
| DISCOVER | Manually curated source-linked strategy rules or a few user-chosen pool filters | Generic screening is crowded. Explicit eligibility/rule completeness might help; value unknown. | Obtain repeat use for a concrete selection task; do not rank expected profits. |
| SIMULATE | Hypothetical bin distributions and user-specified paths; token exposure and assumption sensitivity | Could make prose strategies understandable. No exclusive advantage established. | Authors validate rules; model matches supported protocol mechanics. |
| DECIDE | Existing position state plus current amount-specific quotes and evidence gaps | Most immediately reusable. Better decisions or lower effort versus the native terminal must be measured. | Run the existing pilot before adding a new capability. |
| ACT | Future external native-product handoff; later separately reviewed user-approved execution | Genuine Meteora/Jupiter functionality, but signing and reliability change the product materially. | Revalidate state, routing and costs; separate explicit authorization and security work. |

**Three different meanings of “simulation” must stay separate:**

1. **Mechanical scenario:** model outcomes under supplied rules, liquidity and path assumptions. Fees may be zero or an explicitly user-supplied sensitivity. No probability or historical success claim.
2. **Read-only transaction simulation:** construct a specific unsigned candidate and inspect current RPC simulation/account results. Requires accounts, authorities, token-extension handling and fee-payer assumptions. State races and later execution still remain.
3. **Historical backtest:** reconstruct past states and strategy decisions without future information, including competing liquidity, dynamic fees, fills and costs. RANGE does not yet have validated inputs for this.

A terminal price alone does not identify all active-bin fills, liquidity changes or earned fees. A hypothetical distribution must not be substituted for the user's real per-bin position. A timestamped USD scenario is not verified historical profit. This distinction prevents a small scenario project from inheriting an unsupported “backtesting” promise.

## 7. Technical feasibility by capability

Effort ranges are planning estimates for **one experienced engineer** familiar with this repository, after scope approval. They include bounded tests, not broad coverage, public deployment or external security review. Data access, rule ambiguity and support can increase them. No estimates authorize implementation.

### Required data, reuse and additional integration

| Capability | Required data | Existing reuse | New integrations/work |
|---|---|---|---|
| Strategy discovery | Attributed rules, author/source/version, supported markets and applicability | Existing research/source records; current app shell only if a task needs it | Author interviews/permission and manual structured cards first. No scraping paywalls or automatic rule inference. |
| Pool screening | Fresh mints, pool metadata, activity periods, blacklist/quality flags | Python collectors, schema checks, category/statistics code | Narrow live Data API adapter/cache if justified; token-risk provider only for a specifically validated need. |
| LP scenario modeling | Bin step, decimals, exact hypothetical distribution, initial capital, path and explicit fee assumptions | Atomic arithmetic and validation patterns | Pinned official SDK/bin helpers; pure deterministic model. Real-position mode also needs validated per-bin shares and reserves. |
| Historical backtesting | Historical bin states/liquidity changes, ordered trades/fee state, policy rules, USD marks, costs and failed actions | Archived events, decoding, price gates and cash-flow accounting | Historical state reconstruction or validated dataset partner, replay engine and reference fixtures. OHLCV alone is insufficient. |
| Risk analysis | Current state, concentration, route impact; historical series only for backward-looking metrics | Range/freshness/mint gates, quote impact, offline concentration analysis | Explicit risk taxonomy and permitted risk sources where necessary; no unsupported composite “safe” score. |
| Portfolio management | Complete current pages for selected wallets/protocols; history only for performance | Existing multi-position lookup, pagination and models | Durable watchlist/consent if wanted, refresh scheduling and separate protocol adapters. Not necessarily an indexer for current state. |
| Decision intelligence | Current supported position, intended asset/composition, quotes, evidence of missing constraints | Nearly all current lookup, math, brief, UI and feedback workflow | No integration for the baseline experiment. Conditional next step: read-only SDK account/authority checks or unsigned simulation. |
| Future execution handoff | Current pool/action details; later fresh quote, accounts, authorities and explicit user approval | Existing analysis/export and validated identifiers | First native-product navigation only; later official DLMM builders plus appropriate Jupiter path, wallet signing and landing/recovery. No claim of automatic prefilled handoff support. |

### Difficulty, quality, financial limits, testing and user value

| Capability | Difficulty / bounded effort | Quality and financial constraints | Testability | User value / confidence |
|---|---|---|---|---|
| Strategy discovery | Low technical, high editorial; 3–5 days for three author-approved cards | Missing rules, creator selection and survivorship; no performance ranking | Completeness checklist, source trace and author acceptance | Easier research; low confidence in paid/repeat demand. |
| Pool screening | Low–medium; 1–2 weeks for a few explainable filters | Dated samples, TVL definitions and variable periods; turnover is not yield | API fixtures, units, missing values, pagination and freshness | Plausible time saving; crowded and not yet differentiated. |
| Scenario modeling | Medium–high; 2–4 weeks for a single-pair, hypothetical no-fee model | No actual historical fees/fills. Distinguish assumed distribution from account state; token units before USD | SDK/helper cross-checks, bin boundaries, rounding, conservation, extreme prices and model limitations | Potential learning/planning utility; small direct evidence base. |
| Historical backtesting | High; 2–3-week data feasibility spike; validated engine 8–12+ weeks **conditional on obtainable data** | Existing gaps can invalidate returns; endpoint agreement is not independent truth. No delivery date for trustworthy profitability is established | Replay known transactions, hold matched capital/timing, no-look-ahead tests, historical liquidity and independent prices | Advanced user value possible; cannot responsibly promise a validated MVP now. |
| Risk analysis | Medium; 1–2 weeks for explicit current-state flags | Unsupported tokens/unknown authority are coverage limits; do not imply current flags predict loss or certify safety | Known risky/unknown fixtures, stale/error cases and source freshness | Useful context inside a task; standalone risk subscription unproven. |
| Portfolio management | Medium for current DLMM only, 2–4 weeks; multi-protocol 6–10+ weeks | Partial pages, duplicate positions, differing accounting/price times and missed managed positions | Adapter contracts, totals that preserve unknowns, pagination, refresh and consent | Convenience plausible; broad competitors already exist. |
| Decision intelligence | Baseline experiment in 5–10 working days, **no new product code**; conditional read-only pre-action spike 2–3 weeks | Principal-only, no reliable USD value, incomplete withdrawal/redeposit costs, stale state. Fail closed rather than invent totals | Existing suites plus observed current-user tasks; later compare supported account checks against official SDK/RPC fixtures | Best immediate learning per unit effort; medium technical, low commercial confidence. |
| Execution handoff | Native navigation 1–3 days after URL verification; custom user-signed single-path execution 4–8+ weeks plus review | Requote; do not reuse `/order` output for a different `/build` route. Unknown authorities/rent/extensions and partial failures matter | Isolated local/devnet testing, simulation, account diffs and recovery before any mainnet trial | Could reduce friction later; no automatic benefit from more swaps or churn. |

## 8. Three distinct MVP options

### Option 1 — Evidence-backed position decision brief

**Target user:** an active, discretionary DLMM LP who already holds a supported classic SPL position and is considering an exit or inventory adjustment.

**Problem:** the user cannot easily tell what principal they would receive/convert, which costs are represented, and which important conditions remain unknown. The historical [exit-reporting request](https://proposals.meteora.ag/t/pool-profit-loss-reporting-when-exiting-a-position/843) supports clarity needs, but does not establish current unmet demand or a paid buyer.

**Differentiation hypothesis:** a concise, source-timestamped pre-action evidence record that helps the user find an omitted cost or unverified prerequisite faster than their current terminal. “Read-only” alone is not differentiation; [Tidepool](https://tidepool.ag/docs) also documents watch-address access and cost review.

**Journey/features:** existing address → position → selected HOLD/REBALANCE/EXIT action → inventory, current quotes, known/missing costs and evidence → user returns to their execution venue. No feature addition is necessary for the first experiment. Only if a repeated blocker is observed should a subsequent MVP add one supported pre-action check, such as authority/account prerequisites, without expanding the interface into a dashboard.

**Architecture/integrations:** preserve the existing Next app and server routes; reuse `Position`, `Quote`, decimal arithmetic and consent workflow. Any later check belongs in a server-side, versioned read-only adapter. Add official SDK/RPC support only for that check. Keep Python historical research separate; no new price vendor or historical P&L dependency.

**Scope:** a 5–10-day facilitated test of the current product; a later 2–3-week technical spike is conditional on what users actually need. A full-cost or guaranteed-withdrawal product is outside this estimate.

**Risks:** no USD position value, incomplete costs and weak differentiation may make the brief insufficient; users may already prefer native/third-party tools; users may mistake a quote for a fill. More warnings are not a solution to missing useful information.

**Validation:** ten genuine active LPs, including users of competing tools; use the same supported position/task in RANGE and their existing workflow, counterbalance tool order, record initial intent before showing RANGE. Record failures and excluded/unsupported positions in the denominator. Store observations only with consent; do not collect keys or require transactions.

**Proposed success criteria:** at least eight correctly explain that costs are incomplete and quotes are not guaranteed; six identify a concrete new useful insight relative to their current tool; four voluntarily return within 14 days; two make a credible commitment to a specified priced follow-up pilot. “Would probably pay,” compliments and prompted repeat sessions do not qualify as payment or retention. Any material mistaken inference of guaranteed proceeds/profit is a failed safety criterion to investigate. These are hypotheses, not results.

### Option 2 — Author-assisted range and inventory scenario workspace

**Target user:** a self-directed LP or strategy author preparing an entry, who wants to understand how a defined range/distribution changes token exposure.

**Problem:** published strategies often omit parameters; users cannot compare the consequences of different rules. The [May 2024 threshold-inventory discussion](https://proposals.meteora.ag/t/token-balance-at-liquidity-thresholds/731) explicitly asks for inventory scenarios, but also includes a tool builder and predates today's alternatives. It is evidence for scenario comprehension, not demand for an alpha engine.

**Differentiation hypothesis:** explicit rules, assumptions and unsupported conditions, reviewed by an author; education tied to a concrete user's candidate position. This must outperform the existing GeekLad simulator, native range tools and HawkFi in a chosen task. No claim that competitors cannot formalize strategies is supported.

**Journey/features:** choose one attributed template or enter one's own rules → set a hypothetical SOL/USDC range/distribution → compare a few explicit price/path cases → inspect token exposure and assumption sensitivity → optionally take the parameters to an existing venue. Start with three **new, author-approved complete policies**, not automatic import of the malformed research CSVs. No strategy leaderboard, performance score, expected APY or recommendation to copy.

**Architecture/integrations:** a pure, deterministic model with versioned rules and inputs, separately identified hypothetical positions, official bin/weight helpers and exact-unit tests. Reuse validation/arithmetic and existing presentation primitives only where appropriate. Live pool metadata is optional context; Jupiter is useful only when comparing a present-day conversion cost, not to validate hypothetical future returns. Model outputs are not plugged into current live balances or labeled historical P&L.

**Scope:** author/LP discovery in one week before engineering; 2–4 weeks for a constrained model if authorized. No-fee modeled inventory is the first scope. User-supplied fee sensitivities, if useful later, must remain assumptions rather than estimated earnings. Existing customized positions require new bin-share reads and a separately verified model.

**Risks:** rules remain discretionary, authors withhold details, educational use does not repeat, existing tools suffice, or model precision looks like certainty. Even a small dollar-denominated gain can be misleading if fees/fills/costs are omitted.

**Validation:** ask five authors and five active LPs to formalize three policies manually and compare matched scenario worksheets with their current tools. No new app needed for this prerequisite. Success: three complete author-approved rulesets, six users correctly explain changed exposure, five identify a concrete parameter decision the exercise clarified, four independently request another scenario, and two commit to a specifically priced follow-up. Reject or narrow the concept if parameters cannot be specified without inventing rules.

### Option 3 — Bounded position-accounting evidence audit

**Target user:** an LP analytics builder, small LP operator or integrator investigating a specific discrepant position; not an assumed mass-market retail audience.

**Problem:** it is difficult to identify whether an accounting discrepancy comes from a missing lifecycle, duplicate event alias, valuation policy, authority/ownership change or repeated transaction cost. The second-pass developer reports support this segment more directly than a retail strategy subscription.

**Differentiation hypothesis:** a reproducible evidence packet with transaction/event references and completeness reasons; no “True P&L” claim without independent valuations. [LP Agent already documents transaction checking for closed copies and limitations for other wallets](https://docs.lpagent.io/data-methodology), so transaction verification itself is not novel.

**Journey/features:** submit an agreed public position/signature case → receive canonical token cash flows, closure/coverage checks, fee/reward/cost treatment and explicit unresolved reasons → reproduce the evidence and resolve a concrete issue. Exclude tax certification, wallet-wide P&L, automated judgments and arbitrary-history guarantees.

**Architecture/integrations:** reuse the Python decoder, deduplication, lifecycle/transfer reconciliation and archived evidence. Provide manually reviewed reports first. A future isolated batch job could emit versioned results; do not expose the script directly as an unlimited public API. New work would include supported event/authority coverage, job/resource bounds and a verified RPC/archive provider for the agreed dates. Price acquisition is needed only if clients require USD conclusions; missing marks keep those fields unavailable.

**Scope:** 1–2 weeks for buyer interviews and five bounded cases; 3–5 weeks for a small supported audit service after that, subject to archival availability. A commercial SLA or broad indexer is not included.

**Risks:** customers use upstream APIs directly; most issues are fixed SDK bugs; incomplete historical data prevents a useful answer; client support and manual evidence work dominate revenue. Current six-position performance research does not prove scalability.

**Validation:** interview five prospective buyer teams and audit five real discrepancies they select, within explicit program/date limits. Success: at least three reports change the team's diagnosis, two teams reproduce the conclusions and request another case, and one accepts a specifically priced trial with an identified budget owner. Report unavailable cases as failures of coverage, not successful “issues found.” No buyer conversations or commitments are claimed here.

## 9. Why this ordering, and what could reverse it

This is a qualitative ranking of **experiments from the present repository**, not a replacement set of falsely precise market scores.

| Criterion | Option 1: decision evidence | Option 2: scenario workspace | Option 3: evidence audit |
|---|---|---|---|
| Demand relevance | Historical LP clarity requests; current incremental demand unknown | Small, old direct scenario signal plus incomplete strategy cards | Concrete developer problem reports; buyer/budget unknown |
| Technical fit | High for baseline; incomplete costs remain a material constraint | Medium; bin distribution/model integration is new | Medium–high for bounded token accounting; USD and arbitrary coverage weak |
| Differentiation | Low confidence; must beat users' current workflow | Low confidence; clear existing substitutes | Low–medium confidence; established transaction-checking alternatives |
| Distribution | Existing pilot can recruit ten LPs; conversion unmeasured | Potential author-led distribution; no partner commitment | Few focused buyer interviews; no sales pipeline |
| Monetization | Unverified | Unverified | Unverified, possibly clearer budget if a team owns the problem |
| Smallest useful test | Existing product, no new code | Manual rule formalization and scenario comparison | Manual evidence packet for agreed cases |

**Preference for option 1 is about lower experiment cost, not a 69-vs-72 verdict.** If it fails to provide incremental value against the same user's current tools, stop expanding it. If authors provide complete policies and repeatedly use scenarios, option 2 can become first. If builders bring recurring costly discrepancies and accept paid trials, option 3 can move ahead of both. A small change in assumed demand/differentiation can reverse the ranking; none has demonstrated defensibility or product-market fit.

Broad current portfolio triage is feasible but not selected among the first three experiments: its convenience is crowded, and saved wallets, refresh jobs and protocol adapters would add scope before the indispensable task is known. Automation has clearer historical action requests but substantially greater execution/authority/recovery risk. Neither should win merely because it could generate more Jupiter swaps.

## 10. Build versus integrate — conditional plan, not authorization

| Area | Proposed stance after validation | Reason |
|---|---|---|
| Position/quote evidence contract and financial boundaries | Reuse RANGE; extend only the proven task | This is where normalized uncertainty and exact amounts belong. |
| Current pool/portfolio state | Integrate documented Meteora API; selectively verify accounts | Do not rebuild a broad data service to answer a narrow question. |
| Bin math, account layouts and future instructions | Evaluate official SDK/types with pinned versions and license review | Do not substitute generic CLMM math or hand-guess extended layouts. |
| Routing and quotes | Continue Jupiter integration | No reason to rebuild routing; quote path and eventual execution path must match. |
| Community strategy material | Partner with consenting authors; link and attribute | Complete rules and permission matter more than content volume. No partnership is currently established. |
| Historical data | Reuse cached research; obtain a precise provider sample only if a validated task requires it | No subscription until relevant dates, fields, lineage and permitted use are demonstrated. |
| Execution, signing and alerts delivery | Defer; later use existing venues/providers where appropriate | Operational and security obligations require separate approval and evidence. |
| Competitor proprietary clients/backend APIs | Reference only; no integration or copying | Observable frontend routes do not establish a permitted public data API or backend accuracy. |

Meteora benefits only if supported LPs understand positions and avoid avoidable mistakes; Jupiter benefits if a later user-approved action uses appropriate routes. Today RANGE's quote-only requests generate **no executed swaps**. Benefits and distribution are hypotheses to measure, not claims of official support, a grant or endorsement.

## 11. Smallest next experiment and explicit stop conditions

The preferred next experiment is ten facilitated, consent-based sessions on the **existing** app, with a 14-day voluntary return window. Recruit current users of native Meteora and at least one third-party tool. Ask what they planned to do before RANGE, then compare the same task against their normal workflow. Record useful insights, time/effort, misunderstood costs, unsupported cases, voluntary returns and credible price commitments. Do not judge success by taking an action, trading more, attractive hypothetical returns or praising the design.

If six useful-insight, four return and two credible-price-commitment hypotheses are met, review the actual repeated blocker. Then authorize at most one narrow next capability. If missing withdrawal costs make the tool unusable, a bounded unsigned simulation feasibility test may be appropriate; it must not be presumed feasible or implemented before that review. If the current tool already solves the tested task, onboarding/distribution may be the next problem rather than more product development.

Do **not** build yet: all-in-one navigation/modules, autonomous management, wallet custody/signing, copytrading, a broad strategy marketplace, risk-adjusted profit rankings, portfolio-wide accounting, a historical backtesting engine, generalized wallet indexing or new subscription integrations. Do not redesign the three-screen interface to accommodate unvalidated modules.

## 12. Review completion and limitations

This report is the only new output of this review. Copilot research was not overwritten or silently corrected. A before/after SHA-256 comparison found **142 existing audited files unchanged**, including all **39 Copilot research files** and the audited application, backend, scripts, tests and root pilot configuration files. All local report links resolved. No application code, dependencies, tests, configuration, Codex instructions or production secrets were changed. The workspace has no `.git` directory; Git was not initialized.

The assessment is based on source inspection, CSV/schema/count checks, retained research artifacts and current official documentation. It is not a fresh end-to-end integration test, independent reproduction of issue reports, security audit, full competitor adoption study or customer validation. The historical financial limitations and existing public-release blockers remain intact.

**Decision checkpoint:** review the preferred experiment and alternatives together. No new product direction has been selected for implementation, and no implementation work follows this report.
