BEGIN;
CREATE TABLE IF NOT EXISTS schema_migrations (version INTEGER PRIMARY KEY, applied_at TIMESTAMPTZ DEFAULT now());
CREATE TABLE IF NOT EXISTS ingestion_runs (
    id UUID PRIMARY KEY, started_at TIMESTAMPTZ NOT NULL, completed_at TIMESTAMPTZ,
    source TEXT NOT NULL, selection JSONB NOT NULL, coverage JSONB NOT NULL DEFAULT '{}'
);
CREATE TABLE IF NOT EXISTS raw_responses (
    id BIGSERIAL PRIMARY KEY, run_id UUID REFERENCES ingestion_runs(id),
    url TEXT NOT NULL, observed_at TIMESTAMPTZ NOT NULL, sha256 TEXT NOT NULL,
    object_path TEXT NOT NULL, status INTEGER NOT NULL, schema_sha256 TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS pool_snapshots (
    run_id UUID REFERENCES ingestion_runs(id), address TEXT NOT NULL,
    observed_at TIMESTAMPTZ NOT NULL, payload JSONB NOT NULL,
    raw_response_id BIGINT REFERENCES raw_responses(id), PRIMARY KEY (run_id,address)
);
INSERT INTO schema_migrations(version) VALUES (1) ON CONFLICT DO NOTHING;
COMMIT;
