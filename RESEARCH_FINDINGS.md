# Initial collection report — 2026-10-19

Run `7a456f2b-e1e7-4d6b-9051-62725f09fbb7` collected **50 unique pools** across two 25-pool pages ordered by `tvl:desc`. Retrieval interval: **2026-10-19 14:48:17–14:48:19 UTC**. Both responses passed the saved official OpenAPI response schema.

| Metric | Sample aggregate in API valuation units | Period |
|---|---:|---|
| TVL | 155,239,119.36 | At each page retrieval |
| Trading volume | 72,673,360.82 | API trailing 24 hours |
| Fees | 103,765.79 | API trailing 24 hours |

These are descriptive aggregates of the selected sample. Currency semantics require reconciliation before labeling them independently verified USD. Fees are not profit. The API reported 138,559 pools, an unverified source count rather than our collected population.

## Artifacts

- `data/research.duckdb`: 50 normalized pool snapshot rows.
- `data/7a456f2b-e1e7-4d6b-9051-62725f09fbb7.parquet`: portable run export.
- `data/7a456f2b-e1e7-4d6b-9051-62725f09fbb7-report.json`: machine-readable summary.
- `data/raw/7a456f2b-e1e7-4d6b-9051-62725f09fbb7/`: exact responses, hashes and request metadata.
- `data/checkpoints/7a456f2b-e1e7-4d6b-9051-62725f09fbb7.json`: next page 3.

## Confidence and stage checks

High confidence in ingestion/schema/persistence for this sample; economic accuracy and source freshness unverified. Four deterministic tests passed, covering contract validation, permanent errors and retries, resume/deduplication, and rejected-schema raw retention. Live API collection succeeded. Docker CLI is installed but its Linux daemon is unavailable, so image builds, container startup and PostgreSQL migration execution were not verified. Compose validation requires POSTGRES_PASSWORD as documented.

No evidence yet establishes loss frequency, out-of-range frequency, rebalance effectiveness, wallet persistence or copytrading returns. All four opportunities remain unranked. Evidence must precede subjective scoring.

## Next steps

1. Test bounded OHLCV and volume series for a small cohort; establish timestamp units, quote orientation, valuation currency, retention, gaps and API/on-chain reconciliation.
2. Establish quality gates, then collect at least 100 pools across liquidity, age and asset cohorts; save the cohort definition before outcome analysis.
3. Connect historical wallet/position discovery through the adapter, recording slot coverage and closed accounts; ingest known-position events and transaction identifiers.
4. Reconcile cash flows, inventory, claims and observable costs against known positions, with incomplete-history flags and a hold benchmark.
5. Add read-only Jupiter quotes after endpoint-schema inspection, then research comparisons, opportunity scoring and dashboard.
