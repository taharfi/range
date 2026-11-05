# RANGE — portfolio completeness, valuation and accounting foundation

2026-10-23 (Africa/Casablanca). Local implementation; no deployment, signing, new dependency, paid subscription or historical profitability claim.

## Root cause and verification

The previous wallet route requested `/portfolio/open?page_size=5`. This endpoint paginates **pool groups**, while `totalPositions` describes the wallet's indexed positions. Hydration only visited the returned pool groups. The UI accumulated later pages manually and incorrectly made wallet summary coverage depend on loaded rows. For this wallet, five pool groups each contained one position; another page contained four more groups/positions.

The fresh [independent diagnostic](pilot/evidence/aggregation/discovery-verification.json) reproduced **5 + 4**, with `totalPositions: 9` and `hasNext: true` on page one. All nine records had `isClosed: false` and current-balance data. Official RPC `getMultipleAccounts` at slot **460219806** found each account present, with the published PositionV2 discriminator, DLMM program owner, matching pool and matching wallet-owner prefix. The four second-page accounts were individually checked:

- `7HzFDTuBsc8BR3kg1RsAraLF8ZAFiGKGWPu9dUyKDUmx`
- `F9FB12kjEoNBCwQiMJJp1qqjgXnGfTyEgRyGsNg3noUG`
- `HoHgXwrJThJTTd39EMnXds86WZ29bGaFVMLivfLsG56y`
- `Bpn3BAX9oHDVrYfux3AZtz7jPuJv8WWtdLzcQsabpq3e`

This verifies supported open **account status and identity at that slot**, not raw liquidity inventory or historical accounting. Account existence is never inferred from the provider's count alone, and absence is not promoted into proof of a historical closure.

## Implemented architecture

1. `POST /api/positions` for a fresh wallet lookup starts or reuses a server aggregation. Direct-position lookup remains separate and retains its existing verified mapping and quote safeguards.
2. Discovery follows **that wallet's** indexed pool groups, 50 per page. There is no global Meteora pool catalog crawl.
3. Two workers hydrate wallet positions, 100 per provider page, reusing pool metadata and existing token-mint checks. Three attempts with exponential 500/1,000ms backoff apply to transient provider errors; authentication/rejected requests are not retried. Existing provider pacing and global queues remain in place.
4. A wallet-owner + PositionV2-discriminator `getProgramAccounts` query independently discovers current supported accounts using the official SDK's filtering approach. Returned indexed positions are checked individually against account prefixes. RPC-only addresses with missing indexed inventory produce explicit coverage issues; no balances are invented. Other authorities, legacy layouts and other protocols are outside the supported scope.
5. Duplicate position addresses are retained once. Conflicting repeats, source count changes, unsupported/malformed records, hydration errors, missing current accounts, RPC gaps and stalled pagination prevent complete coverage.
6. `GET /api/portfolio/aggregate?id=<snapshot>&cursor=<opaque cursor>` returns a compact summary and **at most five rows**. Source API pagination is numbered; the stable server snapshot supplies its own opaque next/previous cursors. UI pages replace rows instead of accumulating every position.
7. Indexed rows can appear while summary verification/pricing is pending. They have no quote handles until aggregation finishes; Compare remains disabled during that stage. History requests have their existing independent state. The final summary does not depend on the displayed page, search, filter, view mode or tab.

In-flight wallet requests coalesce, including repeated refresh clicks. Completed snapshots can be reused for 30 seconds; explicit refresh bypasses completed cache and clearly withdraws old totals while a new snapshot is built. Jobs expire after 30 minutes, at most eight are retained, at most two run concurrently, and each aggregation has a 20-minute hydration budget and a 2,000-position ceiling. Hitting any discovery/hydration boundary produces partial coverage. Provider rate limits may make large, fragmented wallets slow; tests with 500 fixtures are not a production-provider throughput claim.

The summary includes indexed count, supported hydrated count, independently discovered count/slot, verification count, range counts, issue count and valuation coverage. At most 20 detailed issues and 50 price-provenance records are returned; full positions stay server-side. Existing invitation, input, origin, rate and concurrency protections remain. Status reads enforce invitation access, and existing consented successful-lookup measurement retains the same deduplicated event kind.

## Current valuation

The [official Jupiter Price documentation](https://developers.jup.ag/docs/price) specifies current USD marks, mint decimals, source block IDs and batches of up to 50 mints. These are reference prices, not amount-specific executable quotes or historical prices. The [Meteora API specification](https://dlmm.datapi.meteora.ag/api-docs/openapi.json) exposes current conversion prices too, but those fields lack sufficient per-mark source/timestamp provenance for this adapter's freshness policy. They are not substituted as a fallback.

- Prices come from Jupiter Price V3 using the existing server-side key when configured; keyless requests retain conservative pacing. Solana `getBlockTime` resolves price observation timestamps. Unknown timestamps, absent marks, nonpositive/invalid prices or decimal mismatches cannot create a usable mark.
- Mint metadata must pass the existing independent classic SPL mint verification. Token-2022 conversion support is **not newly implemented**; unsupported mint programs remain unpriced. This is a technical coverage limitation, not evidence that the asset has zero value.
- Current marks and inventory observations must be within 120 seconds, with a 30-second future tolerance, matching the current-position freshness boundary. This is explicitly a **current reference valuation** policy; the earlier 60-second historical pricing rules are unchanged.
- Normalized token quantities are validated against 6/9/18-decimal atomic precision and multiplied by USD marks with existing 80-digit Decimal arithmetic. Amounts are not normalized twice. A price is never assigned from the token symbol, a presumed USDC peg, pool TVL, pool spot ratio or a current-price substitution for historical data.
- Principal inventory and unclaimed fees have separate sums and separate coverage counts. A position contributes to a subtotal only when **all its nonzero components** can be priced. Unknown fees never become zero. Fees and rewards are not added into liquidity principal.
- A complete wallet value requires complete supported discovery/hydration **and** complete current valuation coverage. Otherwise the UI says **priced subtotal** or unavailable. SOL display additionally requires a fresh SOL/USD reference mark. Current reference values are not guaranteed liquidation proceeds.
- Display expiry follows the earliest accepted underlying price/inventory expiry, not browser retrieval time. Stale totals become unavailable; pagination does not silently reprice a snapshot.

## Performance implemented

For aggregated wallets, Performance now contains current liquidity and unclaimed-fee analytics, independent position coverage, USD/SOL display and expandable source timestamps/status. It distinguishes these from deposits/withdrawals, claimed income, realized P&L, unrealized P&L and net performance, which remain unavailable until historical reconciliation is supported.

There is no synthetic value series or P&L curve. Unclaimed fees are not described as realized income. The direct-position and demo flows retain their prior honest unavailable/synthetic classifications.

## Historical feasibility and durable foundation

The [official Meteora Data API overview](https://github.com/MeteoraAg/docs/blob/main/developer-guides/dlmm/api-reference/overview.mdx) documents selected-position add/remove/fee/reward history. It does **not** establish complete creation, closure, transfer, cost or wallet-wide histories. Current account discovery cannot recover deleted closed accounts.

The normalized ledger keeps position, pool, actor, mint-denominated amounts, transaction signature, instruction index, event type, block time, slot, source and quality. Identity is transaction + instruction + type + position. Source times are normalized separately from position creation timestamps. Unknown actors/types stay visible; invalid records are counted. Exact duplicates do not create new flows. Conflicts are quarantined permanently until independently reviewed, including conflicts detected within one provider response.

`syncPositionLedger` persists atomic JSON checkpoints under `PILOT_LEDGER_DIR` (local default `pilot/var/ledger`), outside the build. It stores observed low/high slots, source time, accepted records, conflicts and partial-coverage metadata. Concurrent requests for the same position coalesce; reads within five minutes use the durable checkpoint. A failed fetch/write does not advance it or turn stale history into fresh data. Checkpoints survive ordinary process restart, with a 10,000-record per-position limit.

**Incremental means identity upsert, not a falsely claimed provider delta cursor.** Meteora's selected-position history has no documented since-slot cursor or completeness watermark. After cache expiry that position may be fetched again; only new identities are added. No wallet-wide rescan runs on search or page navigation. The checkpoint is an observed-event boundary, not a fully scanned slot interval. A durable wallet scheduler/backfill index is not implemented.

| Accounting requirement | Evidence and remaining work |
| --- | --- |
| Position opened/closed | Existing research decoder already verifies explicit IDL PositionCreate/PositionClose events; `phase4_cohort.py` checks explicit closure. The new API ledger does not fabricate these from add/remove events. Live integration needs archive enumeration and decoding with authority changes preserved. |
| Deposits/withdrawals/fees/rewards | Indexed token flows are cached and deduplicated. Independently decoded transfers/events and wallet balances are required before reconciliation or financial totals. Multiple CPI events sharing an instruction remain a schema limitation; conflicts are not summed. |
| Current inventory changes | Current API snapshots and RPC account identity are available. Prefix checks do not independently reconstruct bin-share inventories. Timestamped validated snapshots or official SDK bin/account decoding are needed for a trustworthy historical inventory series. |
| Historical USD prices | `historical_prices.py` and `onchain_prices.py` preserve prior freshness/source policies. Jupiter Price V3 has no historical endpoint. Missing historical marks remain unavailable. |
| Transaction/network costs | Official RPC `getTransaction` exposes `meta.fee`, payer, block time and balance changes. Existing `phase4.py` reconciles these and detects native payment/reserve differences. Shared transaction costs must be allocated once, not once per event/position; account rent is not automatically an expense. This new ledger does not invent or allocate costs. |
| Financial reconciliation | Future stages: independently decode → reconcile token deltas/account ownership → reconcile costs and rent → attach timestamp-aligned historical marks → calculate cash flows and a consistent hold benchmark. Any unresolved stage blocks verified P&L. Existing offline evidence is preserved, not automatically generalized to arbitrary wallets. |

## Files changed

- Server: `pilot/lib/aggregation.ts`, `current-prices.ts`, `ledger.ts`; wallet-specific helpers in `meteora.ts`; transient-error classification in `http.ts`; optional aggregation metadata in `models.ts`; `app/api/positions/route.ts`, new `app/api/portfolio/aggregate/route.ts`, historical route wiring in `app/api/portfolio/route.ts`; conflict identifiers in `terminal.ts`.
- UI: `RangeApp.tsx`, `Portfolio.tsx`, `PortfolioHistory.tsx`, new `CurrentAnalytics.tsx`, `app/portfolio.ts`, and scoped CSS.
- Tests: aggregation and durable-ledger unit suites, aggregation browser/API suite, Playwright match list; reproducible live smoke script.
- Runtime privacy: local starter sets a stable external ledger directory; `.gitignore`, tracing exclusions and build audit exclude `var`. This changes no production secrets and deploys nothing.
- Documentation/evidence: this report, README/limitations/changelog updates, and `pilot/evidence/aggregation/`.

## Remaining limits

Aggregation jobs and cursors are bounded process-memory state, suited to the existing local Node pilot. They are not restart-durable or suitable for an ephemeral serverless request lifecycle; hosting would need a persistent worker/cache. Only the event ledger is durable. Cross-provider reads are not atomic snapshots. API/RPC disagreements remain partial.

Token-2022 metadata/pricing coverage, stale inventory observations, missing price marks, delegated/legacy authorities and incomplete historical transactions/prices/costs remain explicit gaps. No additional paid service is necessary to demonstrate the current-value subset; a pricing subscription alone would not solve these accounting or ownership gaps.

Actual live values, payload sizes, screenshots and final test outcomes are recorded in [the evidence index](pilot/evidence/aggregation/README.md). Counts and market estimates are point-in-time observations, never profitability results.
