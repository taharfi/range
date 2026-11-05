# RANGE Existing Infrastructure Audit

**Audit date:** 2026-10-21  
**Evidence type:** local repository inspection and existing research reports  
**Scope:** read-only audit; no application or existing research files were modified

## Repository and isolation

The working directory is `C:\Users\user\Desktop\jup-meteora-research`. It is not a Git repository: `git status`, branch inspection and `git worktree list` all report that no `.git` directory exists in the workspace or its parents. Consequently, there is no active branch or Git worktree to verify. The research agent is operating in the shared project directory and has restricted new output to the Copilot research directory.

## Product surface

The current product is described as a local, read-only Next.js concierge pilot with three screens:

1. Search: public wallet or open Meteora PositionV2 address, plus demo path.
2. Position: current inventory, range state and unclaimed fee context.
3. Decision: mutually comparable HOLD, REBALANCE and EXIT views.

The existing description explicitly states that the pilot has no wallet connector, signer, transaction construction or submission, trading bot, leaderboard or historical-profitability calculator. It does not claim verified historical USD profitability.

**Source:** [`README.md`](../../../../README.md), [`MVP_LIMITATIONS.md`](../../../../MVP_LIMITATIONS.md), inspected 2026-10-21.

## Capability classification

| Capability | Classification | Evidence |
|---|---|---|
| Next.js pilot UI | Implemented and tested according to existing project documentation | `pilot/package.json`, `README.md` |
| Meteora open-position lookup | Implemented; current indexed data only | `pilot/lib/meteora.ts`, `MVP_LIMITATIONS.md` |
| Direct PositionV2 lookup | Implemented with account/program/discriminator checks | `pilot/lib/meteora.ts`, `MVP_LIMITATIONS.md` |
| Jupiter quote-only conversion | Implemented and read-only | `pilot/lib/jupiter.ts`, `MVP_LIMITATIONS.md` |
| HOLD / REBALANCE / EXIT comparison | Implemented as decision support | `pilot/lib/brief.ts`, `pilot/app/components/Decision.tsx` |
| Historical wallet discovery | Experimental/research-only | `src/research/account_discovery.py`, `src/research/rpc_discovery.py` |
| Historical lifecycle reconstruction | Experimental/research-only | `src/research/lifecycle.py`, `PHASE4_FINDINGS.md` |
| Historical USD P&L | Missing as a verified capability | `DATA_LIMITATIONS.md`, `VALUATION_AUDIT.md` |
| Transaction execution | Missing by design | `MVP_LIMITATIONS.md` |
| Automated rebalancing | Missing | `MVP_LIMITATIONS.md` |
| Leaderboard/copytrading | Missing | `MVP_LIMITATIONS.md` |
| Multi-protocol portfolio management | Missing | Existing MVP scope |
| Durable production data service | Planned/scaffolded, not verified | `README.md`, Docker/PostgreSQL notes |

## Meteora integration

The pilot uses the documented Meteora portfolio/open-position API and position P&L route, while selecting current inventory, range and fee fields. The direct-position path reads confirmed public Solana account data, checks the Meteora program and published PositionV2 discriminator, and resolves a documented pool/owner prefix before querying Meteora. Historical event decoding and whole-account inference are intentionally not claimed.

The research package includes a collector, schema validation, phase studies, wallet/account discovery experiments, lifecycle reconciliation, price-source comparisons and valuation audits. Existing findings identify duplicated event aliases, shared transactions, partial withdrawals, sparse history and unresolved cost/valuation semantics.

## Jupiter integration

The pilot calls Jupiter Swap API v2 order quotes without taker, payer or referral fields. It rejects transaction-bearing or schema-inconsistent responses, validates mints and amounts, enforces a requested slippage cap and accepts stricter returned protection. There are no execution, submission or `sendTransaction` calls.

The existing ecosystem assessment distinguishes current quote functionality from historical data and from executable transaction composition. It identifies `/build` as a possible future composition path but notes that signer authority, simulation, landing, account creation, compute limits, failure recovery and Meteora instructions would still be required.

## Data and research infrastructure

The Python package uses HTTP collection, JSON-schema validation, DuckDB/Parquet persistence, raw response retention and checkpointed collection. The repository contains phase-specific research modules for pool collection, historical series, account discovery, RPC transaction sampling, lifecycle analysis, pricing and valuation.

The existing research sample is useful for methodology and limitations, not as a market-size estimate. Prior reports describe a 276-pool study, 24 historical pool series and 20 independently verified LP owner/event links, while explicitly withholding claims of complete net LP return.

## Test and validation evidence

The project documentation reports deterministic tests for official-contract validation, retries, schema failure quarantine, deduplication, resume behavior and persisted artifacts. The pilot manifest exposes unit tests, typecheck, build and browser smoke commands. This audit did not run tests because the mission is research-only and no implementation change was made.

## Existing competitor and demand baseline

The prior competitor landscape covers Meteora Dynamic Terminal, Pool Party, HawkFi, Tidepool, LP Agent, Krystal, Revert, Kamino, DeFiTuna, Orca and GeekLad tools, with documented limitations and source links. The prior opportunity scorecard reports 43 dated public pain-point records across 24 threads and 39 source-qualified handles. It treats GitHub issues as developer friction rather than equivalent customer purchase signals and notes that most records predate current competitors.

These are baseline materials to extend, not final conclusions. In particular, advertised capability is not adoption; a missing feature in one public guide is not proof of market absence; and current quote support does not solve historical accounting.

## Reusable infrastructure for later strategy

1. Read-only Meteora position and inventory lookup.
2. Mint validation and integer/decimal-safe amount handling.
3. Jupiter quote comparison with explicit freshness and protection checks.
4. Raw evidence capture and reproducible DuckDB/Parquet analysis.
5. Position lifecycle and event-alias reconciliation patterns.
6. Existing source-qualified pain-point and competitor datasets.

## Phase 1 conclusion

RANGE has a credible read-only decision-support foundation and unusually explicit evidence limitations. The strongest near-term research question is not whether more LP features can be added, but which workflow has enough current pain and differentiation to justify expansion beyond the existing HOLD/REBALANCE/EXIT brief. Phases 2–8 must therefore test the broader ecosystem against this baseline rather than assume an all-in-one direction.
