# Data dictionary

Source for all pool fields: `GET https://dlmm.datapi.meteora.ag/pools`, verified against the saved official schema. Values are API-reported aggregates, not direct chain observations. Source fields not normalized remain available in immutable raw response files.

| Stored field | Definition | Observation period / units |
|---|---|---|
| run_id | Local collection UUID | One paginated collection run |
| address | Pool account address | At observation |
| name | API pool name | At observation |
| token_x, token_y | Token mint addresses | At observation |
| observed_at | Client UTC retrieval timestamp | Retrieval, not block time |
| bin_step | pool_config.bin_step | Source integer |
| created_at_raw | API created_at without conversion | Appears milliseconds; schema says timestamp without units |
| tvl | API total value locked | Point-in-time, source valuation; USD interpretation needs reconciliation |
| volume_24h | volume['24h'] | API trailing 24-hour window at retrieval |
| fees_24h | fees['24h'] | API trailing 24-hour window; not LP net profit |
| current_price | API pair price | Point-in-time; orientation to be reconciled before USD valuation |
| raw_path, raw_sha256 | Response provenance and body digest | Exact response bytes |

JSON metadata adds request URL/parameters, status, response headers and schema digest. Reports sum the selected sample only, never the protocol. Floating-point aggregates are suitable for descriptive research, not precise token accounting; future cash-flow ledger requires integer atomic amounts/decimal valuations. PostgreSQL payload stores full JSON; analytical DuckDB table stores the columns above.

## Phase 2 exports

`POOL_STATISTICS.csv` has one row per selected pool and links to full source payloads through `data/phase2/cohort.json` and its metadata. `_api` suffix means source valuation, not independently reconciled USD. Ratios and correlations use API observations at different retrieval times, not slot-consistent balances.

| Fields | Definition / period |
|---|---|
| strata, category | Frozen purposive query memberships; mint-allowlist pair category, not token investment quality |
| tvl_api, volume_24h_api, fees_24h_api | Same point-in-time TVL and trailing 24-hour source metrics as stage 1 |
| volume_tvl_24h, fees_tvl_24h | Trailing metric divided by current TVL; null when TVL zero |
| is_blacklisted | Source blacklist flag, retained for exclusion sensitivity |
| age_days_ms_interpretation | Retrieval minus created_at/1000; null for implausible/zero creation timestamp |
| token_x_decimals, token_y_decimals | Source decimal scales, independently compared to finalized mint data |
| inventory_valuation_relative_error | abs(X amount × X token price + Y amount × Y token price − TVL) / TVL; null at zero TVL |
| pair_price_vs_token_usd_ratio_relative_error | abs(pair price − X token price / Y token price) / (X token price / Y token price); orientation diagnostic only |
| daily_log_return_std_api | Sample standard deviation of consecutive positive close daily log returns; no annualization, no missing-day substitution; requires >=2 returns |
| history_close_count | Positive completed-day close rows available, not necessarily continuous |
| quality_flags | Pipe-separated validation concerns; absence does not certify accuracy |

`historical_series.parquet` / DuckDB `historical_series`: pool address, kind, timestamp (seconds), timestamp_str, OHLC, volume, fees and protocol_fees. Nonapplicable values are null (OHLC for volume rows; fees for OHLCV rows). Actual API end-boundary rows remain in export. All statistics use the frozen plan's completed-day range. There is no historical TVL column populated from estimates.

`tvl_observations.parquet`: actual phase-1 and phase-2 retrieval observations with source labels; no interpolation. `verified_wallet_links.csv`: wallet, position, pool, signature, slot, decoded owner-event type and public explorer link. `account_discovery.json` contains current-account proof, source-valued cash-flow subtotals, completeness flags and null P&L. RPC event amounts stay atomic integer strings; API event amount units are not assumed interchangeable without reconciliation.
