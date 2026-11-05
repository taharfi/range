# Jupiter × Meteora Research Engine

Historical recovery, 2026-11-05: added a bounded, checkpointed Helius operator importer and reused the pinned DLMM decoder on an existing closed-position fixture. Recovered 13 transactions and decoded matching creation/closure events; cash flows and historical USD P&L remain unreconciled. See [implementation, evidence and reproduction](HELIUS_HISTORY_FOUNDATION.md). Portfolio UI and financial claims are unchanged.

Local testing, 2026-11-05: the app is available on loopback when `npm start` is running. Run `npm run pilot:preflight -- 2026-11-05` from `pilot/` for the dated, read-only live check; the date is required. Fresh SOL/USDC EXIT/REBALANCE quotes and responsive screens were verified. See [start here](PILOT_START_HERE.md) and [current evidence](pilot/evidence/pilot-preflight-2026-11-05/README.md). No new product modules or public deployment.

Latest sequence update: Phase 1 technical reliability and the ten-user facilitator pack are prepared. **72 research, 90 unit and 38 browser/API tests passed; production build passed.** Ledger readiness, restart recovery, honest operator metrics and valuation-expiry explanations were verified locally. Actual user-validation and remote-hosting gates remain open; later modules are not claimed built. See [sequence status](RANGE_V2_SEQUENCE_STATUS.md), [facilitator pack](PILOT_FACILITATOR_PACK.md) and [QA evidence](pilot/evidence/pilot-sequence/README.md).

Previous valuation update: validated metadata-only Token-2022 mints can receive current reference valuations; their conversion quotes remain blocked. Its recorded checks were 72 research, 86 unit and 36 browser/API tests passing. Transfer-fee and unknown extensions remain excluded. See [Token-2022 scope and evidence](TOKEN2022_VALUATION.md).

Previous Portfolio correctness sprint: component-specific valuation coverage, separate principal/fee validation, and live three-wallet evidence. Its recorded checks were 72 research, 80 unit and 35 browser/API tests passing. Valuation remains partial where unsupported mint programs or stale data prevent reliable marks. See [sprint findings](PORTFOLIO_CORRECTNESS_SPRINT.md) and [screenshots](pilot/evidence/portfolio-correctness/README.md).

The repository now includes **RANGE — Know your position.**, the provisional brand for the LP Exit Intelligence concierge pilot, alongside the preserved research pipeline. The pilot compares current Meteora DLMM inventory with read-only Jupiter conversion quotes. It does not execute transactions or claim verified historical USD profitability.

The implemented design uses a custom vector wordmark/boundary symbol, self-hosted Geist typography, dark CSS tokens, an explicit price-range diagram and comparable HOLD / REBALANCE / EXIT surfaces. See [BRAND_GUIDELINES.md](BRAND_GUIDELINES.md), [DESIGN_AUDIT.md](DESIGN_AUDIT.md) and [before/after screenshots](pilot/evidence/design/README.md). The name is provisional; no public launch, domain purchase or trademark availability is claimed. Existing invitation, consent and security controls remain in place.

The current wallet flow is **Search -> Server-aggregated portfolio -> Position -> Decision**. Wallet-specific API pagination and an independent owner/PositionV2 RPC scan run server-side. The browser receives a compact wallet summary and at most five cursor-paginated rows. Current Jupiter reference valuation separates liquidity and unclaimed fees, supports USD/SOL when fresh marks are available, and labels partial coverage. Performance shows current analytics; verified historical P&L remains unavailable. Selected-position event histories have durable partial checkpoints. See [aggregation and accounting report](PORTFOLIO_AGGREGATION_REPORT.md), [actual evidence](pilot/evidence/aggregation/README.md) and [terminal design](PORTFOLIO_TERMINAL_IMPLEMENTATION.md).

The compact portfolio now prioritizes loaded/range counts and selectable fee/range rows, with one visible USD-valuation notice. See the [latest portfolio screenshots](pilot/evidence/portfolio-simple/README.md).

## Run the read-only pilot

Requires Node 24+ and npm. From the repository root:

```powershell
Set-Location pilot
npm ci
npm run dev
```

Open **http://127.0.0.1:3000** for the product homepage, or **http://127.0.0.1:3000/app** for the invitation-protected analysis app. Paste a public wallet or open Meteora PositionV2 address and choose Analyze. Enter your invitation if requested, select a position, then choose Compare options. Switch action tabs instantly; use Back to position to return. Try Demo uses synthetic values; live lookup never substitutes demo data on failure. Full withdrawal/redeposit costs and immediate withdrawal availability remain unverified.

The current workspace has an ignored `pilot/.env.local` with a local feedback secret, ten invitation codes and a **local invitation gate**; **no testers or responses have been created**. Enter a code from that private file to use live lookup. Usage measurement is optional and off by default. For a fresh checkout, copy `pilot/.env.example` to `pilot/.env.local` and configure server-only values. Never put signing keys or seed phrases in this file. Jupiter's keyless quotes work without a subscription. Private feedback storage requires separate consent and supports deletion receipts; runtime data is excluded from source control.

For repeated local building tests, optionally set `PILOT_DEVELOPMENT_CODE` with `PILOT_DEPLOYMENT=local` and a loopback origin. This separate code bypasses the personal six-per-minute lookup/brief cap; the shared 120-request/minute cap, provider pacing, finite queues and concurrency guards remain. Development sessions force usage consent off and do not count as measured pilot testers. The code and its existing sessions are rejected in staging/public mode or with a remote origin. Sessions still expire after 24 hours; sign in again when needed. Restart the local server after environment changes.

```powershell
# From pilot/
npm test
npm run typecheck
npm run build
npx playwright install chromium
npm run test:e2e
npm run start
# With the app running in another terminal:
npm run smoke:live
npm run pilot:summary
npm run pilot:usage
npm run audit:build
```

[Pilot plan and 10/6/4/2 hypotheses](PILOT_PLAN.md) · [MVP limits and live/estimated/synthetic distinctions](MVP_LIMITATIONS.md) · [Current smoke output](pilot/evidence/live-smoke.json). The app is local, not publicly hosted. Recruitment, paid subscriptions, payments and transaction execution are not performed. The sections below describe the earlier research infrastructure and its reproduction.

[Public-pilot readiness](PILOT_READINESS_REPORT.md) · [Deployment guide](DEPLOYMENT_GUIDE.md) · [Security checklist](SECURITY_CHECKLIST.md) · [Tester onboarding](TESTER_ONBOARDING.md). The production build uses a standalone Node server. Docker/Compose and HTTPS proxy configuration are prepared; actual Linux container/TLS validation and approval remain required before public launch. No public domain is deployed.

Stage 1 established verified API feasibility, a modular Python collector, DuckDB/Parquet persistence, audit records and a PostgreSQL schema. Research data and the 72 regression tests are preserved.

## Setup (PowerShell, Python 3.12+)

```powershell
python -m venv .venv
.venv/Scripts/python -m pip install -e '.[dev]'
.venv/Scripts/python -m pytest -q
.venv/Scripts/collect-pools --pages 2 --page-size 25
.venv/Scripts/uvicorn research.api:app --reload
```

Resume with `collect-pools --resume RUN_UUID --pages 4 --page-size 25`; pages means the final page number. Use a new run for a fresh observation. Single collector writer per data directory. Raw responses and metadata live under `data/raw/RUN_UUID/`; checkpoint advances only after the DuckDB transaction commits. Replaying a committed page is idempotent per run/address; first observation wins on duplicates. Schema failures preserve raw evidence and stop ingestion. Each successful invocation exports the run's Parquet and JSON summary.

`data/evidence/meteora-openapi.json` is the official schema snapshot used to validate every response. Refresh deliberately from the URL in API_FEASIBILITY.md, inspect changes, and run tests before collection. The collector does not silently update its contract.

## Docker

Create `.env` with `POSTGRES_PASSWORD=` followed by a local password. Then:

```powershell
docker compose up --build -d postgres api
docker compose --profile collect run --rm collector
```

PostgreSQL applies `migrations/001_initial.sql` on a fresh volume only. Existing databases need explicit migration application. PostgreSQL is scaffolded; the current collector writes DuckDB and Parquet only. API currently exposes `/health` and `/docs`, not research analytics. No Next.js dashboard is implemented in this first task.

## Verification and scope

See API_FEASIBILITY.md, RESEARCH_FINDINGS.md, DATA_DICTIONARY.md and DATA_LIMITATIONS.md. Tests cover official-contract validation, schema failure quarantine, retry policy, deduplication, resuming, and persisted artifacts. Live collection is the integration smoke test; deterministic tests require no network. No P&L reconciliation is claimed.

Next: validate historical series and units on a small pool cohort, then expand to at least 100 stratified pools after quality checks. Implement an indexer adapter for historical wallet discovery, ingest known-position events, and reconcile inventory/cash flows before opportunity scoring or dashboard metrics.

## Phase 2: reproducible research

The completed study contains 276 unique pools, 24 historical pool series, finalized on-chain pool/mint checks, and 20 independently verified LP owner/event links. Read `PHASE2_FINDINGS.md`, `DATA_QUALITY_REPORT.md`, `WALLET_DISCOVERY_COMPARISON.md` and `POOL_STATISTICS.csv`. No complete net LP return is claimed.

```powershell
.venv/Scripts/python -m research.phase2
.venv/Scripts/python -m research.phase2_validation
.venv/Scripts/python -m research.account_discovery
.venv/Scripts/python -m research.phase2_reports
.venv/Scripts/python -m pytest -q
```

These commands reuse archived responses in `data/phase2`, verify hashes and schema, and reproduce the frozen study. The first run with a new output directory performs real requests. To create a new dated cohort, use `research.phase2 --output data/phase2-new`; subsequent validation/discovery/report calls must use the same directory (Python functions accept a root Path; validation CLI also accepts `--output`). The phase2 command supports `--days` and `--history-pools`, and rejects changing those settings in an existing plan. CSV and Markdown reports are written to the repository root. Keep a copy if comparing studies.

`research.rpc_discovery --max-transactions 160` is the alternative bounded transaction-wide experiment. It is not a full historical indexer: it caches a signature sample and response bodies, skips failed transactions, decodes a limited event subset, and stops after 20 explicit owners or the request/error budget. The current-account proof is substantially more efficient here but excludes closed accounts. `research.phase2_validation --positions` optionally attempts histories for positions from that alternative experiment.

Analytical exports: `data/phase2/research.duckdb`, `pool_statistics.parquet`, `historical_series.parquet`, `tvl_observations.parquet`, and `verified_wallet_links.csv`. Raw responses, plan, cohort membership, coverage, validation and reconstruction evidence remain alongside them. The original `data/research.duckdb` remains unchanged.

Verification: final pytest run covers original collector behavior, exact token scaling, invalid decimals/amounts, fee-versus-profit, incomplete histories, event deduplication, price gaps/flat series, address validation and IDL decoding. External service spend for the completed study was $0; local resource costs were not measured. Docker daemon remains unverified from milestone 1; this phase runs locally.

Latest executed result: **25 passed** (`python -m pytest -q`), including replay of the 20 real finalized wallet links and audit hashes. All required phase-2 reports and sample exports were generated from the collected artifacts.

## Phase 3: valuation audit and closed lifecycles

Read `PHASE3_FINDINGS.md`, `VALUATION_AUDIT.md` and `POSITION_RECONCILIATION.md`. The actual sample has ten explicitly closed accounts (nine funded, one never-funded), ten retrievable creation-to-closure histories and ten token-transfer reconciliations. Historical USD P&L and hold benchmarks remain unavailable; this financial milestone is not complete.

```powershell
.venv/Scripts/python -m research.valuation_audit
.venv/Scripts/python -m research.closed_scan
.venv/Scripts/python -m research.closed_scan --output data/phase3/extension --start 458874080 --end 458874143
.venv/Scripts/python -m research.lifecycle
.venv/Scripts/python -m research.phase3_reports
.venv/Scripts/python -m pytest -q
```

The scan plan freezes each interval before fetching/decoding its blocks. The first interval produced eight closures; the adjacent extension produced two. Current stored responses are reused: the commands reproduce the evidence, not a fresh market snapshot. Archived raw response bodies total roughly 435 MiB. A fresh network execution makes many full-block calls; public endpoint throttling/retention may differ. No paid key is required for the successful recorded run. Each successful RPC response is cached; failures remain in raw evidence. Price-source provider/update timestamps are unavailable in Meteora responses. The valuation audit compares fresh details and finalized reserves without replacing original TVL. Its Jupiter Price V3 reads are current diagnostics only.

`CLOSED_POSITIONS.csv` includes creation/closure slots, UTC times, owners, pool/mints, raw token cash flows, observed transaction fees and Solscan links. `POSITION_LIFECYCLES.parquet` retains exact event payloads and raw bytes; the full JSON retains token transfers, unassigned events and source-estimated API USD values. Events and costs are kept separate from USD estimates. Decoding depends on the saved official IDL; `phase3_reports` refuses to report if the separately fetched phase-3 IDL differs. No frontend, wallet custody or transaction submission is implemented.

The phase-3 tests add explicit closure-versus-removal checks, alias deduplication, timestamp ordering, multiple deposits/partial withdrawals, missing/zero/future/stale prices, owner changes and actual closed-sample replay. Phase-2 tests remain intact.

Executed phase-3 verification: **39 passed** (`python -m pytest -q`). The actual pipeline summary is persisted in `data/phase3/phase3_summary.json`.

## Phase 4: historical USD pricing and profitability gates

Read `HISTORICAL_PRICE_SOURCES.md`, `PRICE_COVERAGE_REPORT.md` and `PHASE4_FINDINGS.md`. Six additional funded SOL/USDC closed positions were reconstructed. **No verified USD P&L or hold benchmark is claimed**: the available historical prices do not meet the frozen 60-second age limit. CSV hourly sensitivity columns are explicitly unverified.

```powershell
.venv/Scripts/python -m research.phase4_cohort
.venv/Scripts/python -m research.lifecycle --output data/phase4 --target 6
.venv/Scripts/python -m research.phase4
.venv/Scripts/python -m research.phase4_reports
.venv/Scripts/python -m pytest -q
```

The enrollment closure cutoff and sorted candidate-owner list are preserved in `data/phase4/recent_cohort_plan.json` and `cohort_plan.json`. Re-runs use archived observations and frozen dates rather than refreshing market data. The initial all-date exploration is retained separately. Phase-3 outputs are preserved; the additional lifecycle Parquet goes under `data/phase4`.

`POSITION_USD_PNL.csv` and `HOLD_BENCHMARKS.csv` distinguish blank verified results from source-priced sensitivity estimates. `data/phase4/price_observations.csv` lists every cash-flow/cost/hold-terminal price reference and its source time, age, status, URL and response hash. `usd_analysis.json` retains raw token flows, independent pre/post balance checks, actual network fees, explicit native payments and price series. Recoverable rent is tracked as collateral; temporary wrapped-SOL accounts are recognized from initialization instructions even when absent from both token-balance snapshots.

The historical adapter implements CoinGecko day-range series and an optional Pyth authenticated range client. The executed profitability runner uses CoinGecko. `COINGECKO_DEMO_API_KEY` can supply an existing Demo entitlement; the standalone Pyth adapter reads `PYTH_API_KEY`. No paid Pyth request or subscription was used. API keys are never saved in audit metadata. The recorded keyless CoinGecko access worked here, but official docs advertise a Demo key; future availability is not guaranteed. Retryable cached 429/5xx responses are retried on a later invocation; success bodies are replayed with SHA256 verification. Price arithmetic uses Decimal from JSON parsing onward.

No interpolation, future sample, current-price substitution or USDC=$1 assumption is allowed. `pricing_policy.json` freezes strict and separate one-hour sensitivity thresholds. Minute sources remain blocked by 401/403 or unverified entitlement. Review the precise recovery options in HISTORICAL_PRICE_SOURCES.md before buying any data plan.

Latest executed verification: **50 passed** (`python -m pytest -q`). All six independent cost/balance checks pass after accounting for temporary wrapped-SOL accounts. **0/129** price references pass the strict freshness gate. Phase 4 therefore has zero verified USD profitability results; its three-position target remains unmet.

## Phase 5: historical execution references and explicit estimates

Phase 5 preserves Phase 4's verification failures and introduces separate execution-evidence, high-confidence estimate, approximate estimate and unavailable tiers. An executed SOL/USDC swap ratio does not establish SOL/USD or the LP's actual USD conversion proceeds. See [ONCHAIN_PRICE_METHODOLOGY.md](ONCHAIN_PRICE_METHODOLOGY.md), [PRICE_SOURCE_COMPARISON.md](PRICE_SOURCE_COMPARISON.md), [PRICE_UNCERTAINTY_REPORT.md](PRICE_UNCERTAINTY_REPORT.md) and [PHASE5_FINDINGS.md](PHASE5_FINDINGS.md). Actual classified results are in [UPDATED_POSITION_USD_PNL.csv](UPDATED_POSITION_USD_PNL.csv).

```powershell
.venv/Scripts/python -m research.phase4
.venv/Scripts/python -m research.phase5_capture
.venv/Scripts/python -m research.phase5_pool_history
.venv/Scripts/python -m research.exchange_validation
.venv/Scripts/python -m research.phase5
.venv/Scripts/python -m pytest -q --junitxml=data/phase5/test_results.xml
.venv/Scripts/python -m research.phase5_reports
```

The two frozen collection plans under `data/phase5` retain bounded prior-slot and pool-history samples. RPC responses, exact schema files and hashes remain there. Collection uses read-only public RPC with caching and rate limits; no paid account is required. The initial network run can take several minutes. Reproduction uses local cached evidence where available. Research outputs distinguish raw executions, screened market references, hourly USD anchors and empirical stress envelopes. Those envelopes are sensitivities, not calibrated confidence bounds. No high-confidence or verified USD result is inferred merely from a freshness cutoff.
