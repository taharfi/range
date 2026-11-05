# RANGE V2 — implementation roadmap

Reviewed 2026-10-23 (Africa/Casablanca). Planning only. This report authorizes no implementation, dependency changes, tracking, purchases or deployment.

## Recommendation and sequence

Make Portfolio dependable first. Validate the existing decision workflow with real LPs before committing to additional workspaces. Then add Explore, bounded historical accounting, observational Intelligence and a hypothetical Lab through separate acceptance gates. The four modules describe a possible product structure, not a commitment to build everything.

| Phase | Deliverable | Dependency / release gate | Planning estimate |
|---|---|---|---|
| 0 | Portfolio completeness and current-valuation hardening | Existing aggregation implementation | 3–5 engineering days for the narrow sprint below; broader gaps estimated separately |
| 1 | Reliable invitation-only Portfolio pilot and operating model | Phase 0; privacy and hosting review before remote access | 3–5 engineering days plus 1–2 weeks of tester observation |
| 2 | Explore: token-to-pool research | Phase 1 reliability and demonstrated user need | 1–2 engineering weeks |
| 3 | Portfolio activity and accounting evidence | Phase 1; selected-position archival access demonstrated | 2–4 engineering weeks for a bounded cohort, not arbitrary-wallet P&L |
| 4 | Intelligence: transparent wallet and strategy observations | Phase 3 for historical claims; Phase 2 for pool context; demand gate | 1–2 engineering weeks for a curated cohort |
| 5 | Lab: hypothetical range scenarios | Phase 2 data contracts and explicit strategy rules; demand gate | 2–3 engineering weeks for one-pool, static scenarios |
| Deferred | Validated historical backtesting; execution handoff | Separate research, financial-validation and authorization gates | Not responsibly estimable yet |

Estimates assume one engineer familiar with this repository, exclude provider delays and recruitment, and are not delivery promises. Phases 2 and 3 can be reordered after interviews; do not develop them concurrently by default. Lab does not technically require a wallet-history indexer and can move ahead of Intelligence if users validate scenarios first. No module needs signing or custody.

## What exists, and what the evidence actually establishes

### Implementation inspected

- Next.js application with public `/` and invitation-controlled `/app`; wallet → Portfolio → Position → Decision navigation. Reuse the RANGE wordmark, SVG geometry, Geist typography and charcoal/lime tokens. Keep the existing read-only HOLD / REBALANCE / EXIT flow.
- `pilot/lib/aggregation.ts`: wallet-specific discovery, paginated hydration, two hydration workers, transient retries, deduplication, owner-matched PositionV2 RPC checks, server summary and five-row opaque-cursor pages. `POST /api/positions` starts the job; `GET /api/portfolio/aggregate` reads it. The summary is independent of visible rows.
- `pilot/lib/current-prices.ts`: current Jupiter marks, RPC observation timestamps, decimal-aware valuation and separate principal/fee coverage. Current inventory and marks have a 120-second validity policy; historical rules are separate.
- `pilot/lib/terminal.ts` and `ledger.ts`: indexed closed-position pages and selected-position events; durable local JSON identity-upsert checkpoints, duplicate handling and conflict quarantine. This is not complete historical accounting.
- `pilot/lib/jupiter.ts`, `brief.ts` and `math.ts`: server-only quote requests without a taker, checked atomic quantities, slippage assumptions, fee safeguards and conditional inventory comparisons. REBALANCE is a token-mix swap estimate, not a full range migration.
- Existing access, origin/input validation, rate/concurrency controls, feedback consent and build-secret checks remain reusable. Existing measurement is not proof of real tester participation or retention.
- `src/research/`: DuckDB/Parquet ingestion, pool validation, explicit lifecycle decoding, token/cost reconciliation, historical-price quality tiers and on-chain reference-price experiments. Reuse these as versioned offline fixtures and worker logic after reviewing runtime boundaries; do not run Python research pipelines inside page requests.

### Latest captured evidence

[Aggregation diagnostic](pilot/evidence/aggregation/discovery-verification.json) explains the original nine-versus-five defect: `/portfolio/open` paginates **pool groups**, but the previous path hydrated only its first page. The second page contained four more supported accounts, independently checked at the captured slot. This is a verified defect already addressed in code, not a new feature to implement again.

[Normal-UI smoke](pilot/evidence/aggregation/live-smoke.json), captured `2026-10-22T23:41:47.718Z`, reports nine indexed/hydrated/owner-matched supported accounts, five then four browser rows, and compact responses up to 11,016 bytes. Principal coverage was **3/9** and fee coverage **5/9**. Successful discovery therefore does not establish complete valuation. These are historical test observations, not today's wallet state.

Previous implementation-session checks passed: 72 Python research tests, 74 pilot unit tests, 34 browser/API tests and the production build. They were **not rerun for this document-only review**. Fixtures with 100/500 positions do not establish live provider throughput at that size.

[Phase 3](PHASE3_FINDINGS.md), [Phase 4](PHASE4_FINDINGS.md) and [Phase 5](PHASE5_FINDINGS.md) retain valuable reconciled examples, including six funded closed SOL/USDC cases. They establish **zero independently verified historical USD P&Ls**. Six approximate Phase-5 scenarios must not become verified product performance.

### Research implications

The [prior technical review](research/range-ecosystem-intelligence/RANGE_NEXT_DIRECTION_REVIEW.md), [Copilot challenge report](research/range-ecosystem-intelligence/copilot/09_second_pass/CHALLENGE_REPORT.md), [scorecard](research/range-ecosystem-intelligence/copilot/06_opportunities/OPPORTUNITY_SCORECARD.csv) and [evidence gaps](research/range-ecosystem-intelligence/copilot/08_final/EVIDENCE_GAPS.md) support testing reliability and decision clarity. They do not establish demand for a complete platform. The first scorecard and second-pass rankings use different judgments; their numerical ordering is not measured market preference. Eight accessible strategy cards and developer issue reports cannot establish retail demand, profitable rules or willingness to pay. Competitor screenshots establish functional references only; no layout, code or branding reuse is proposed.

## Verified source boundaries

| Source | Available and useful | Boundary |
|---|---|---|
| [Meteora DLMM Data API OpenAPI](https://dlmm.datapi.meteora.ag/api-docs/openapi.json) | Wallet pool groups; position pages; pools/search/sort/filter; OHLCV, volume history; selected-position historical events | Indexing is not independent financial verification. The historical event route documents no since-slot cursor/completeness watermark. Check source periods and schemas. |
| [Official DLMM SDK](https://github.com/MeteoraAg/dlmm-sdk) and published schemas | Account layouts, owner-filtered current discovery, bin/range and strategy logic to evaluate | Current accounts cannot enumerate deleted closed accounts. Validate compatible layouts and authority scope. SDK installation is not part of this roadmap task. |
| [Solana signatures](https://solana.com/docs/rpc/http/getsignaturesforaddress), [transactions](https://solana.com/docs/rpc/http/gettransaction) | Address-referenced signatures with before/until pagination; transaction events, balances and observable fees | Provider retention and missing results limit history. A wallet-address scan alone may miss managed-authority activity. Missing account ≠ verified closure. |
| [Jupiter Price V3](https://developers.jup.ag/docs/price) | Current USD marks with decimals and block IDs; up to 50 mints per request | Reference estimates, not historical marks or executable proceeds. Tokens can be unpriced. |
| [Jupiter Swap V2](https://developers.jup.ag/docs/swap) | Amount-specific quote-only requests when no taker is supplied | Does not establish Meteora withdrawal/redeposit costs or full rebalance feasibility. Keep transaction execution disabled. |
| Existing archived research and raw evidence hashes | Reproducible fixtures, explicit gaps, selected historical observations | Sampled, dated and incomplete; not a live universal index or unbiased wallet cohort. |

The live Meteora schema was fetched successfully during this review using a direct HTTPS read; the browser research tool could not open it. Confirmed parameters include `/pools` page/page_size/query/sort_by/filter_by, OHLCV timeframe/start_time/end_time, and historical event_type/order_direction. The retained schema is at `pilot/evidence/terminal/openapi.json`. No internal competitor endpoints or LP Agent backend are proposed as dependencies. Current official source availability is not an SLA or permission to ignore provider limits.

## Shared architecture and financial contract

Keep one Next.js UI and existing protected API boundary. Reuse server adapters rather than introduce a separate microservice per module. For a local pilot, keep the bounded Node process; before restart-tolerant remote use, introduce one durable job/checkpoint store and a persistent worker. A single-node SQLite store is a candidate for a single-writer pilot; PostgreSQL is appropriate if multiple workers/replicas become necessary. This is a future choice to validate, not a new dependency approved here. Preserve Parquet/DuckDB as offline analytical evidence.

Browser requests should read compact summaries, paginated rows and selected details. Provider pagination stays behind the server. Catalog refreshes and historical backfills run as budgeted scheduled jobs, never as a full scan on wallet search. Deduplicate transactions by signature, prices by mint/source/observation and position records by stable account identity. Add explicit source/slot-window checkpoints, not just a maximum observed slot. Bounded retries, provider pacing, job coalescing, backpressure and recorded failures apply across modules.

Proposed shared response metadata: `schemaVersion`, `snapshotId`, `asOf`, `retrievedAt`, `expiresAt`, `sources`, `coverage`, `issues`, `nextCursor`. Preserve atomic quantities as strings plus mint decimals. Keep discovery, hydration, ownership, inventory and pricing coverage separate; distinguish absent, unsupported, stale, failed and unknown. A confirmed current-account read is not an atomic cross-provider inventory snapshot. Cache keys include network, provider, filters, schema and valuation-policy version; quote cache keys also include amount and slippage. Never publicly cache invitation-protected responses.

Use separate quality dimensions for source evidence and price quality: on-chain observed, indexed/unverified; exact execution evidence, high-confidence market estimate, approximate estimate, unavailable. A transaction execution price is not automatically the correct market mark for another event. Price freshness and measurement uncertainty must travel with every financial field.

Do not sum principal, fees and rewards into one indistinct value. Missing nonzero token marks prevent a complete position valuation; incomplete position coverage prevents a wallet total. Current values are estimates, unclaimed fees are not realized income, rent collateral is not an expense, and route fees included in outputs cannot be subtracted twice. No aggregate net P&L is published unless every required lifecycle, ownership, price and cost gate passes for its stated scope.

## Phase 0 — finish Portfolio correctness

**Exact MVP:** retain server aggregation; categorize every unhydrated/unpriced position; demonstrate page-independent counts and values; recover cleanly from rate limits, expiry and refresh. Add wallet-wide range counts and coverage to the existing health presentation, or label page-only observations explicitly. Do not create a numerical health score. Scope completeness to owner-matched supported open DLMM accounts.

**Sources:** existing Meteora wallet/position endpoints, official RPC account reads, Jupiter current marks and source block times. Investigate Token-2022 metadata using the [official extension documentation](https://www.solana-program.com/docs/token-2022/extensions); extensions can affect transfer semantics, so readable decimals alone do not establish executable withdrawal/quote support.

**Backend/API:** keep existing routes and five-row cursor contract. Record reason codes for each coverage stage. Separate stale inventory from stale price; expose per-position price status on requested rows without shipping all positions. Build diagnostic fixtures from the affected wallet. If adding verified Token-2022 metadata, keep valuation eligibility separate from conversion eligibility; extension-aware execution remains gated. Do not loosen freshness solely to increase coverage.

**Frontend/reuse:** `Portfolio.tsx`, `CurrentAnalytics.tsx`, `DataCoverage.tsx`, existing position/range visuals and Decision. Compact liquidity/fee subtotals with coverage; contextual missing-data details; summary unaffected by page filters. No page redesign or new workspace.

**Risks:** provider inventory already stale when received; unsupported extensions; source changes during hydration; RPC discovery unavailable; indexed balances not independently reconstructed from bins. Token-2022 support may recover metadata but cannot supply a missing price or fresh inventory. Large-wallet request budgets remain finite.

**Tests/acceptance:** 0/1/9/100/500 fixture cases; every discovered candidate accounted for as included or excluded with reason; 5+4 reproducer; duplicate/conflicting records; 429/timeout; provider failure never becomes empty wallet; 6/9/18 decimals; principal/fee separation; missing/future/stale marks; expiry/refresh; unchanged auth and read-only gates. Require identical summary across cursors and no more than five rows per response. Proposed payload budget ≤32 KiB for these responses. Verify affected wallet and at least two other public test wallets live, retaining slots/timestamps. A partial valuation is an acceptable honest result; an unexplained gap or false complete total is not.

**Dependency:** existing implementation only. Exit gate is trustworthy coverage, not 100% price availability for every asset.

## Phase 1 — validate Portfolio utility and operating reliability

**Exact MVP:** existing open positions, explicitly indexed/unreconciled Closed and selected History views, current-value/fee analytics, position details and three-action Decision. Demonstrate a refresh directly from stale Decision state. No additional trading feature. Run ten consented LP sessions comparing RANGE with each tester's existing workflow.

**Sources:** same current-data sources as Phase 0; selected indexed history remains partial. Voluntary feedback supplies product evidence, never a performance claim.

**Backend/API:** preserve invitation access and server-only keys. Before remote use, validate process restart behavior, durable job storage or explicit expired-job recovery, persistent ledger volume, TTL/deletion, TLS/origin configuration, per-provider budgets and session/rate-limit behavior across the chosen process model. An ephemeral serverless deployment is incompatible with the current in-memory job design. No remote deployment is authorized by this report. Review existing measurement against the approved consent protocol before changing telemetry; no third-party tracking.

**Frontend/reuse:** existing four-step app, feedback and current freshness/limitations controls. Show analysis progress separately from history loading. Keep demo/live distinctions and selected-action details; never turn REBALANCE into a promised full range move.

**Risks:** slow long-tail wallets; shared provider saturation; expiring snapshots; public wallet addresses becoming linked to identifiable feedback. Do not publish tester wallets or retain unnecessary identifiers.

**Tests/acceptance:** full regression/build and secret audit; invitation/origin/input/rate tests; restart/refresh recovery; no signing requests; mobile 320/390, tablet 834 and desktop 1440; keyboard completion. Proposed technical target: warm summary/row requests p95 <2 seconds in a measured ten-tester load rehearsal, excluding upstream cold aggregation. Report cold latency and failure distribution separately. Pilot hypotheses: ≥8/10 complete lookup→position→comparison unaided, ≥6 identify a useful new insight, ≥4 return voluntarily within 14 days, ≥2 show credible willingness to pay. Ten sessions are directional evidence, not statistical market validation. Fewer than six useful-insight responses triggers problem/UX review before a new module; access/provider failures trigger technical remediation first.

**Dependency:** Phase 0. Distinguish local pilot readiness from approved secure remote hosting.

## Phase 2 — Explore: tokens and pools in one workspace

**Exact MVP:** search a mint or token name within the indexed Meteora universe; inspect its DLMM pools; filter/sort by documented TVL, period-specific volume, bin step and available age; select one pool for price, range/bin context, volume and data coverage. Show volume/TVL as turnover, not expected return. No token launch feed, safety certification, predicted yield or all-Solana discovery claim.

**Sources:** official `/pools`, selected pool metadata, OHLCV and volume-history endpoints; RPC mint validation; Jupiter reference prices where available. API-supplied fee statistics remain explicitly provider-reported unless their units/period/accounting are validated. Distinguish pool inception from first observation when creation evidence is absent.

**Backend/API:** proposed `GET /api/explore/pools?query=&filters=&cursor=`, `GET /api/explore/tokens/{mint}`, `GET /api/explore/pools/{pool}?window=`. A bounded background catalog refresh materializes searchable fields; pass through supported provider filters or query the local index. Tokens are derived from observed pool mints. Stable server cursor snapshots and a maximum 25-row catalog page; selected charts return bounded series plus gap masks. Record refresh completion and catalog coverage; never promise a complete catalog after a truncated refresh.

**Frontend/reuse:** one search/filter strip, compact pool rows, token context and a selected-pool panel. Reuse typography, address formatting, range visuals, error/loading states and quality details. Small volume charts must show real gaps. No browser-wide pool preload, decorative dashboard tiles or copied competitor composition.

**Risks:** inconsistent TVL definitions, thin/manipulated activity, symbol collisions, missing OHLCV, mixed windows and API drift. The research's 82 audited valuation outliers and 310 missing pool-days are reasons to retain provenance, not to correct provider values without evidence.

**Tests/acceptance:** catalog pagination/deduplication, refresh resumption, filter/sort stability, mint identity, units/windows, no zero-filling OHLCV gaps, stale catalog notice. Browser receives ≤25 rows and only selected chart series. Five active LPs perform a predeclared pool-research task; proposed demand gate: ≥3 find a verifiable useful fact and request repeat access. Reassess if existing tools solve the task adequately.

**Dependency:** Phase 1 reliability and a demonstrated pool-research task. Not dependent on verified historical P&L.

## Phase 3 — Portfolio history and accounting foundation

**Exact MVP:** asynchronous selected-wallet synchronization over a documented interval; paginated activity; explicit creation/add/remove/claim/reward/transfer/closure evidence; token-denominated flows and unresolved-event counts. Closed positions require closure evidence, not a zero balance. Initially support a narrow SOL/USDC cohort. Keep indexed closed candidates distinct from verified closures. Add realized/unrealized/net USD metrics only individually after their gates pass; absence of P&L does not prevent a useful activity view.

**Sources:** Meteora selected-position history as candidate evidence, official IDL/program events, archival RPC signatures/transactions and validated mint accounts. Historical price adapters and retained on-chain observations are research inputs with their original quality tiers. Verify a provider serves the exact required dates before relying on it; no subscription assumed.

**Backend/API:** proposed `POST /api/portfolio/sync` enqueues bounded work; `GET /api/portfolio/activity?wallet=&cursor=` and `GET /api/portfolio/accounting?wallet=&interval=` read materialized results. Store raw transaction hashes and decoder version; event identity must include instruction path/inner-event ordinal to avoid collapsing multiple CPI events. Maintain authority/owner intervals, failed transaction records, gap ranges, scanned boundaries, source coverage, retry state and durable checkpoints. Re-fetch overlapping finalized intervals idempotently. Wallet signatures seed discovery but do not prove exhaustive managed-position coverage; expand through known positions and authorities and disclose residual scope.

**Frontend/reuse:** History and Closed tabs, coverage interval, lifecycle timeline and expandable transaction evidence. Reuse `PortfolioHistory.tsx`, `terminal.ts`, `ledger.ts`; extend offline `dlmm_schema.py`, `lifecycle.py`, `closed_scan.py`, `phase4.py`, `historical_prices.py`, `onchain_prices.py` through a worker boundary. The current JSON ledger is a migration input, not a complete accounting database.

**Risks:** archival truncation, changed ownership, fee aliases, shared transaction costs, rent recovery, rewards without mint attribution, transfers/hedges outside the visible lifecycle and missing historical prices. Cache max slot is not proof all intervening transactions were scanned. Dollar value change is not investment return when capital flows occur.

**Tests/acceptance:** reproduce retained ten explicit closures and six funded accounting fixtures without upgrading their USD verification status; multiple deposits/partial withdrawals/claims, ownership changes, repeated CPI events, conflicts, failed fees, transaction-wide cost allocation once, rent versus expense, missing prices and restart checkpoints. A failed sync must not advance coverage. Every unmatched event stays visible. Balance/cost residuals block verified accounting. USD P&L requires complete scoped lifecycle + token reconciliation + costs + valid historical prices; hold benchmarks use actual external funding lots without adding withdrawals/fees as new investment. Complete wallet P&L requires every constituent and the wallet accounting boundary to pass.

**Dependency:** Phase 1 operating model and proven archival access. Bounded time/call/storage budget required before expanding a cohort. This is not a full-chain indexer project.

## Phase 4 — Intelligence: public wallet and strategy research

**Exact MVP:** a manually curated, provenance-linked cohort of roughly ten public research wallets, using owner-provided public examples or independently public on-chain identifiers without deanonymizing people. Compare observed pool choices, bin steps, position durations, range widths and repeat entry/exit behavior within explicit observation windows. Attach hypotheses to observations; do not infer a person's intent, entire strategy or skill. No profitability leaderboard, copy button or wallet score.

**Sources:** Phase 3 decoded evidence and owner histories, Phase 2 pool snapshots, direct public strategy sources where their rules are accessible and attribution/use is permitted. Current-position cohorts retain survivorship bias; prospective cohorts use fixed enrollment rules. Competitor APIs are comparison material, not needed infrastructure.

**Backend/API:** proposed `GET /api/intelligence/cohorts/{id}?cursor=` and `GET /api/intelligence/wallets/{wallet}?interval=&cursor=` serve precomputed cohort observations. Cohort manifests record inclusion, observation windows, missing histories and exclusion reasons. Refresh on a schedule with hard wallet/transaction budgets, not on each profile view. Research facts and authored interpretations are separate records.

**Frontend/reuse:** compact cohort list, selected wallet observation profile and source-linked strategy notes; reuse portfolio rows, pool context, lifecycle evidence and coverage labels. Observed-range distributions need a visible denominator; no P&L chart unless independently validated.

**Risks:** biased sampling, external hedges, delegated capital, social identity errors, position transfers and inferred strategy labels presented as facts. Public activity is not consent to identify a person. Do not automatically publish pilot feedback wallets.

**Tests/acceptance:** fixed cohort replay, denominator consistency, authority attribution, interval truncation, unavailable-duration handling, no inferred profit rank and no unsupported identities. Proposed demand gate: ≥3/5 advanced LP testers use an observation to form a specific research question and return once. Failure means stop expansion, not add copytrading.

**Dependency:** Phase 3 for lifecycle claims and Phase 2 for comparable pool context; public research/privacy review. Without historical coverage, restrict any preview to current snapshots explicitly.

## Phase 5 — Lab: hypothetical range scenarios

**Exact MVP:** one selected pool, explicit starting token inventory/capital reference, range boundaries and a supported liquidity distribution. Compare a small set of user-specified price endpoints/path assumptions. Show modeled token exposure and differences versus an explicitly funded hold inventory. Default future fees/rewards to unavailable, with optional user-entered sensitivity assumptions clearly separated. No historical replay, optimized recommendation, probability of profit or APY promise.

**Sources:** validated current pool state and bins, official SDK math and documented strategy behavior; user-entered hypothetical prices/fees/costs. Current market marks only anchor the current scenario. Historical OHLCV may provide labeled context but cannot establish intra-bin trade order, active liquidity, fee attribution or executable fills.

**Backend/API:** proposed `POST /api/lab/scenarios` validates capped inputs and returns deterministic, versioned assumptions/results. Keep calculations in a tested pure library; server resolves and timestamps the selected pool state. Cache by state hash, model version and parameters, not wallet identity. No transaction construction. Static endpoint scenarios must state inventory-transition assumptions; do not imply that arbitrary paths with identical endpoints necessarily earn identical fees.

**Frontend/reuse:** focused controls, range/inventory visualization, small scenario comparison and always-visible hypothetical label. Reuse range geometry, Decimal helpers and known-cost/unavailable-cost presentation. SDK compatibility and licensing must be checked before any component reuse; no simulator dependency is approved by this plan.

**Risks:** wrong bin/decimal direction, infeasible token composition, ignoring path dependence, unmodeled active liquidity/transfer fees and scenario output mistaken for a backtest. Hypothetical fee assumptions are not observations.

**Tests/acceptance:** official SDK comparison fixtures; exact boundary/out-of-range cases, token orientation, decimal precision, nonnegative inventory, conservation under stated model, zero fees/costs and adversarial inputs. Three preregistered rule sets must be explicit enough to reproduce. Proposed validation: ≥4/5 LP testers explain assumptions and distinguish modeled results from real historical returns; ≥3 request another scenario. Failure blocks any historical-backtest branding.

**Dependency:** Phase 2 pool contracts, sufficiently explicit strategy rules and validated scenario demand. Phase 3 is required only if adding real lifecycle comparisons. This phase can precede Phase 4 through an explicit review decision.

## What is deliberately outside the sequence

Do not add autonomous management, wallet signing, custody, copytrading, multi-protocol accounting, AI agents, a global strategy ranking or live transaction execution. A future handoff to official Meteora/Jupiter interfaces is a separate proposal; independently verify supported handoff parameters, current position state and all missing costs first. Existing quote functionality provides real Jupiter utility without execution.

Do not call hourly OHLCV replay a validated DLMM backtest. That requires historical bin/active-liquidity state, swaps and dynamic fees, strategy timing, realistic fills/costs and independently tested reconstruction. Do not buy historical prices to compensate for missing events or unknown ownership. No paid provider is necessary merely to test the current supported subset; archival retention, throughput and historical USD access must be demonstrated before recommending a paid plan. Hosting/storage/engineering costs are additional and not zero simply because external API spend has been zero.

## Smallest next implementation sprint — proposed, awaiting authorization

**Goal:** make every current Portfolio count and valuation gap explainable while preserving the working app. Scope: 3–5 engineering days, no new module and no deployment.

1. Re-run the affected nine-position wallet and two other public fixtures; save source pages, account slots and per-position inventory/mint/mark statuses. Treat changed live counts as new observations, not a failed frozen assumption.
2. Trace why each nonzero component is unpriced: unsupported mint, decimal mismatch, missing price, unknown price time, stale inventory, stale mark or discovery/hydration failure. Produce a compact internal matrix and stable API reason codes; never expose credentials or private feedback.
3. Fix only demonstrated defects. If unsupported Token-2022 metadata is the cause, assess an extension-aware decoder separately; support only independently validated layouts and preserve quote restrictions. If the provider lacks fresh inventory or prices, retain unavailable and document the exact missing evidence. Do not broaden this sprint into full bin reconstruction or provider procurement.
4. Ensure health/counts state wallet-versus-visible-page scope, refresh removes expired financial values, and row navigation cannot change the summary. Preserve original visual components; add only concise contextual status where required.
5. Add regression cases only for verified defects/gaps, run Python/unit/browser/API suites and production build, then repeat desktop/mobile live checks. Review source request counts, cold latency and payload size before increasing limits.

**Sprint acceptance:** all discovered candidates explained; no first-page-only total; no fabricated or double-counted value; honest partial coverage; no expired quote reused; existing access/consent/security gates unchanged; all relevant regressions/build pass; live evidence and remaining gaps documented. Guaranteed 9/9 pricing is explicitly not an acceptance criterion. Durable remote workers, historical P&L and all three new workspaces stay outside this sprint.

After that sprint, review the evidence and authorize the ten-user pilot. Advance to a new workspace only when a specific user task and its data contract pass the corresponding gate.
