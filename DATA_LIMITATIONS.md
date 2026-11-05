# Data limitations

- Initial collection is a small TVL-ranked convenience sample. Not representative; cannot infer LP loss frequency, alpha or market-wide counts from it.
- Live offset pagination can shift between requests. Deduplication removes repeat addresses but cannot recover omissions or establish a chain snapshot.
- API schema validity does not establish freshness, economic accuracy or on-chain reconciliation. Client timestamps do not establish source update times.
- Timestamp units, pair-price orientation, fee semantics and valuation currencies need independent reconciliation. created_at appears milliseconds even though historical query bounds use seconds.
- No wallet cohort, closed-account index, deposits, withdrawals, costs, price history or position inventory was collected. P&L, drawdown, time in range and copytrading viability are unavailable.
- The discovery interface is an extension point, not a working indexer. Historical coverage and provider costs remain unknown.
- Retries are bounded; checkpoint recovery is local and single-writer. No distributed lock, scheduling, telemetry service, retention policy or PostgreSQL ingestion is implemented. This is a tested first-stage collector, not a claim of production readiness.
- Docker and PostgreSQL runtime verification depends on the local Docker daemon. Do not infer runtime success from configuration alone.
