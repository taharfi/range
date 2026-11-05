# RANGE — Portfolio correctness sprint

2026-10-23. Completed the narrow Phase-0 sprint in [the V2 roadmap](RANGE_V2_IMPLEMENTATION_ROADMAP.md). No new module, dependency, telemetry, signing, purchase or deployment.

## Actual findings

The original nine-versus-five pagination defect remains fixed. Fresh observations now differ from the older nine-position capture; they must not be forced to match it.

The [after audit](pilot/evidence/portfolio-correctness/after.json) captured:

| Public wallet | Indexed / hydrated / independently discovered | Principal valued | Fee balances valued |
|---|---|---|---|
| `ACUvKyTc7dEwR8oMqUZd5xpj19osaFZoXPauuy52adQM` | 8 / 8 / 8 | 4 / 8 | 4 / 8 |
| `BazUUKN4YLpKQ4NNYYUtuzd6CcniPn1jkFjB4FuVMyo7` | 0 / 0 / 0 | No supported open positions | No supported open positions |
| `8k2KVhVrBWAVov4zbBXciyA3KbVz8Az9uTc7uX8WJP5R` | 1 / 1 / 1 | 1 / 1 | 1 / 1 |

These are supported, current owner-matched PositionV2 observations, not claims about all authorities/protocols or closed histories. The third wallet had two supported positions in the [before capture](pilot/evidence/portfolio-correctness/before.json), and one in the later capture. No closure or cause for that change was inferred. Each artifact retains timestamps and verification slots.

The eight-position wallet had **four positions with unsupported mint programs affecting nonzero components** (observed Token-2022 program owners), plus **one stale inventory observation**. Causes overlap. Zero quantities do not need prices; principal and fees can therefore have different coverage within a position. The [component matrix](pilot/evidence/portfolio-correctness/coverage.csv) records actual eligibility and reasons. Unsupported programs, unverified metadata and failed pricing requests are now separate conditions.

Code inspection found a reproducible defect: malformed fee quantities invalidated otherwise valid principal, and malformed principal invalidated valid fees. Synthetic regressions demonstrate and verify its correction. This is **not claimed to explain the live wallet's missing values**. Principal and fee quantities now validate independently. Aggregate-backed page summaries also flag future-dated inventory consistently with the existing freshness policy.

## Implementation

- Stable codes distinguish missing/invalid prices, provider failure, decimal mismatch, unknown price time, stale prices, unsupported/unverified mint metadata, invalid quantities, missing fees and stale/unknown/future inventory times.
- Per-position `valuationCoverage` records component-specific reasons on requested rows. Only five rows reach the browser; the complete diagnostic matrix stays server-side.
- `valuation.reasonCounts` counts affected positions once per reason across the wallet snapshot. Reasons overlap and are not amounts of money or tokens.
- Portfolio has a collapsed **Valuation coverage for this page** disclosure. Performance has **Why some values are unavailable**, covering the wallet snapshot. Existing layout and page-scoped attention rules remain intact.
- Coverage describes the valuation-time observation. Existing expiry still removes financial figures; refresh withdraws old aggregate values while replacements load. Paging does not reprice or change wallet totals.
- Provider failures are not reported as absent mint prices. No historical P&L, complete cost total or missing price was invented. Current/historical freshness policies and quote restrictions are unchanged.

No Token-2022 decoder was added. RANGE's existing gate validates classic SPL mint layouts. Token-2022 metadata support and extension-aware execution eligibility need separate validation; copying indexer decimals cannot establish either.

## Verification

| Check | Final result |
|---|---|
| Python research suite | **72 passed**, using the existing `.venv` |
| Pilot unit tests | **80 passed**, including six new coverage tests |
| Browser/API tests | **35 passed**, including coverage/refresh regression |
| Production build and TypeScript | **Passed** |
| Build audit | 15 browser files, 11 configured secret values; **0 matches, 0 private artifacts copied** |
| Protected research integrity | **1,013 evidence files unchanged** |
| Normal-UI live smoke | **Passed**; unchanged pagination summary, refresh checked, **0 page errors** |
| Responsive capture | **12 screenshots** at 1440, 834, 390 and 320px; no horizontal overflow |
| Compact live responses | Maximum **12,346 bytes**; at most five position rows |

The [browser run](pilot/evidence/portfolio-correctness/browser.json) used the normal invitation-controlled search path and real providers. It was later than the adapter audit: eight supported accounts, principal coverage 4/8 and fee coverage 5/8, with two stale-inventory and four unsupported-program reasons. Such differences are retained rather than attributed to code improvements. No transaction was executed and no historical profitability was verified. Tests with 100/500 fixtures are not production throughput benchmarks. Adapter diagnostic durations include an extra discovery-page probe; they are not p95 aggregation latency measurements.

Visually reviewed desktop Portfolio, mobile current analytics and narrow-mobile expanded coverage. Address wrapping and existing typography/layout remained usable; no redesign was necessary. See [screenshots and reproduction](pilot/evidence/portfolio-correctness/README.md).

Initial failures and resolutions: system Python lacked DuckDB, so the existing virtual environment was used without installing packages; the running local server locked build output on Windows, so it was stopped for the build and then restarted; one new test incorrectly inherited a synthetic demo program while expecting an unknown-program code, so its fixture was corrected. All final checks above passed.

## Files changed

- `pilot/lib/current-prices.ts`, `aggregation.ts`, `models.ts`: coverage contract, independent quantity checks, provider-failure classification and per-row results.
- `pilot/app/portfolio.ts`: future timestamp consistency.
- `pilot/app/valuation-coverage.ts`, `components/Portfolio.tsx`, `components/CurrentAnalytics.tsx`: shared labels and contextual disclosures.
- `pilot/tests/valuation-coverage.test.ts`, `pilot/e2e/aggregation.spec.ts`: regressions.
- `pilot/scripts/portfolio-coverage-audit.ts`, `portfolio-correctness-browser.ts`: reproducible read-only checks.
- This report, README and new `pilot/evidence/portfolio-correctness/` artifacts. Existing research and screenshots were preserved.

## Remaining limits

Token-2022 support, stale indexed inventory and missing marks still prevent complete valuation. Current account discovery cannot prove historical closure or exhaustive delegated-authority coverage. Historical ledger upsert is not financial reconciliation; verified historical USD P&L remains unavailable.

Aggregation jobs remain process-memory state. Remote hosting still requires validation of persistent runtime/state, existing access/rate controls, ledger storage, TLS and origin settings. This sprint did not perform or authorize deployment, and it did not record real tester outcomes.

Next review: evaluate Token-2022 **metadata-only valuation support** against observed mint fixtures and official extension schemas, independently from quote/withdrawal eligibility. Then run the existing ten-user workflow experiment after access/operating requirements are satisfied. Explore, Intelligence and Lab remain outside this sprint.
