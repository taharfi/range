# Phase 3 findings — 2026-10-19

## Actual results

| Evidence gate | Result |
|---|---:|
| Closed positions discovered | 10 |
| Selected / creation-to-closure histories retrieved | 10 / 10 |
| Funded LP positions / never-funded account closures | 9 / 1 |
| Token cash-flow reconciliations passing | 10 |
| Trustworthy historical USD net P&Ls | **0** |
| Valid USD hold benchmarks | **0** |
| Original valuation outliers audited | 82 |
| Historical TVL corrections supported | **0** |
| External data-service spend | **$0** |

The closed-account and token-reconstruction work succeeded for this bounded sample. **The USD P&L milestone is not complete.** No product idea was selected, no frontend built and no transactions submitted.

## Discovery evidence and coverage

Two frozen contiguous windows cover finalized slots **458874016–458874143**, from 2026-10-19T14:55:08+00:00 through 2026-10-19T14:55:36+00:00. The second window was declared after the first returned eight closures. Scanned **128 produced blocks**, **141478 total transactions**, and **2204 DLMM-referencing transactions**. Scan errors: 0; event decoder errors: 0. Raw responses, plans and schema hashes are retained under `data/phase3`.

Event counts across the discovery interval: {'Swap': 489, 'Swap2Evt': 489, 'IncreasePositionLength': 2, 'AddLiquidity': 18, 'Rebalancing': 15, 'RemoveLiquidity': 19, 'ClaimFee': 25, 'ClaimFee2': 25, 'PositionClose': 10, 'CompositionFee': 9, 'PositionCreate': 9}. PositionClose is independent of RemoveLiquidity; all ten selected closures also have zero position post-balance. This is a closure-window cohort, not an estimate of average LP outcomes or a random sample. It includes a never-funded account and does not establish protocol-wide historical coverage.

## Valuation findings

- All 164 token sides passed mint, decimal and reserve identity checks.
- Six original outliers contain a zero source token price. These are missing/unavailable inputs, not proof the token is worthless or TVL is wrong.
- The other 76 discrepancies remain unresolved between price timing/eligibility and accounting definitions. Meteora's upstream price provider and exact price-update timestamp are absent from the inspected API.
- Normalized gross custody reserves differ from API quantities in part because protocol fees are held separately in the pool state. Subtracting those recorded fees matches fresh API quantities within one atomic unit on 152/164 token sides and both sides of 74/82 pools. This supports the quantity-definition distinction; **it does not adjudicate TVL correctness**.
- Current Jupiter prices were captured as a second source, not applied to original observations. No evidence-supported historical TVL correction was made.

See VALUATION_AUDIT.md for all 82 pools, original retrieval times, examples and unresolved causes.

## Economics and remaining blockers

Token deposits, withdrawals, fee claims, rebalances, embedded composition fees, rent-before-close and successful-transaction network fees are retained separately. Alias fees are not doubled. Missing reward claims are not manufactured. Observed payer/context and ambiguous costs prevent automatic full transaction-cost attribution. Historical pair candles and Meteora event `totalUsd` estimates do not establish timestamp-aligned token/USD prices; therefore net economic P&L and hold benchmarks remain unavailable.

No RPC/indexer limitation prevented these ten recent lifetimes. Older/longer-lived positions may exceed the public endpoint's retention, capacity or four-page safety budget; reaching that budget must be reported as incomplete, not exhaustive. For larger backfills, use archival getBlocks/getBlock and per-position signature histories with known retention and versioned instruction/event coverage.

Actual external spend was $0; local CPU/network/storage were not billed or metered as service charges. Archived response bodies total **434.84 MiB** across 190 distinct captured RPC request shapes (including protocol-version errors and cached replay) and the API responses. RPC method counts: {'getBlock': 128, 'getBlocks': 2, 'getMultipleAccounts': 4, 'getTransaction': 46, 'getSignaturesForAddress': 10}. These are cache artifacts, not a billing log of retries. Current [Helius credit docs](https://www.helius.dev/docs/billing/credits) list ordinary historical RPC methods at one credit each; the [free plan](https://www.helius.dev/docs/billing/plans) lists 1M monthly credits and 10 RPC requests/s. A similar bounded read workload is within that published allowance before provider-specific limits/eligibility; no account or paid plan was provisioned. Unlimited protocol backfill costs remain unmeasured.

## Recommended next experiment

Use the nine funded closed positions as a reconciliation fixture, not a wallet-success leaderboard. Obtain documented mint/USD historical prices with source timestamps at every deposit, withdrawal, claim and cost event; reject forward-looking or stale prices. Ask Meteora to clarify price provenance, TVL inclusion rules and zero-price treatment. Then add failed-transaction costs, payer attribution, rent and hedge/swap policy before calculating net P&L and an explicitly funded hold counterfactual. Expand the closure-window cohort only after these financial gates pass.

## Reproducible outputs

- `CLOSED_POSITIONS.csv`: ten rows, identities, timestamps, atomic cash flows, closure signatures and Solscan links; unavailable USD fields are blank.
- `POSITION_LIFECYCLES.parquet`: exact decoded position events, atomic payload JSON, slots, instruction indexes, raw bytes and Solscan links.
- `data/phase3/position_lifecycles.json`: all transactions, unassigned events, aliases, transfer reconciliation, source estimates, historical pair-price attempts and completeness gates.
- `data/phase3/valuation_audit.json`: every original valuation outlier and independent reserve/mint checks.
- `data/phase3/audit_manifest.json`: verified response hashes and current/used IDL equality.

Run the phase-3 commands in README.md, followed by `python -m pytest -q`. Real-sample replay tests are separate from clearly synthetic financial edge cases.
