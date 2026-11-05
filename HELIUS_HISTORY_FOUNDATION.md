# Bounded historical recovery — 2026-11-05

## Implemented

A server-side, operator-run Helius archival adapter now recovers one bounded transaction page per invocation. It uses the configured server-only mainnet RPC and the documented `getTransactionsForAddress` method. There is no wallet-wide scan on page load and no new browser endpoint, telemetry, signing or deployment.

- Fixed public account and explicit `[from, until)` Unix-second interval, finalized commitment, ascending order, full JSON transactions, transaction versions through v1, and failed transactions retained.
- At most 100 transactions per call, ten successful pages / 1,000 stored transactions per scope. Three attempts maximum for explicitly transient HTTP failures, paced with bounded backoff.
- Durable scope-keyed JSON checkpoints under `PILOT_LEDGER_DIR/archival`, atomic replacement and same-process serialized writes. Resume the saved provider cursor after restart; completed queries reuse the checkpoint without another provider request.
- Signature deduplication. Conflicting observations, looping cursors, non-progressing pages, foreign transactions, invalid timestamps, malformed responses and exhausted budgets stop without advancing the checkpoint.
- Status remains `query-only-unreconciled`, including when the provider's continuation token is exhausted. This is neither a complete-wallet index nor a financial ledger.
- Existing offline DLMM IDL decoder is reused through a new reproducible diagnostic script. All decoded observations are retained, including other-position and unknown events. Position boundaries are separately matched to the requested account.
- Browser build audit now also checks the configured Helius API key for accidental exposure; only counts are printed.

No application screens, wallet discovery, current valuation, quote logic, invitation controls, feedback or existing indexed-history ledger were replaced. This step does **not** make the 990 source-reported closed positions complete or verified.

## Actual archival experiment

Reused the existing public closed-position fixture `BFj5cELThtyrcTkuX5PftKmbnbg5Ezo2zgYudG9v5dsN`; this is not a newly discovered position or an increase in the research cohort. The indexed timestamps were used only to choose an initial bounded interval, not as proof of lifetime completeness.

- Requested interval: Unix `1792601558 <= blockTime < 1792678863` (600 seconds before indexed creation through 600 seconds after indexed closure).
- Two successful provider pages: 13 transactions, then zero additional transactions and no continuation token.
- 13 unique transactions retained; no failed transactions or missing metadata returned for this sample.
- Observed transaction slots: 459706312 through 460064315.
- Decoder: 21 events, zero decode errors using existing pinned IDL SHA-256 `045c0f4af044be046b6a14b350077e4242e8ac026b64a855803dab30fcdd8b35`.

| Decoded event | Count |
| --- | ---: |
| PositionCreate | 1 |
| Rebalancing | 6 |
| CompositionFee | 1 |
| RemoveLiquidity | 6 |
| ClaimFee | 3 |
| ClaimFee2 | 3 |
| PositionClose | 1 |

Creation and closure events explicitly identify the target position and owner `ACUvKyTc7dEwR8oMqUZd5xpj19osaFZoXPauuy52adQM`. The event counts are observations from the retrieved transactions; they must not be added as cash flows without understanding event overlap (including claim variants).

[Creation transaction](https://solscan.io/tx/5bNCY4padHPBYJCVuvj3vX2PU9Yt6o2qG4SRerSezBBeqQNVXCyBdnaLad445rTURQqNcJLCXgpHBdQdX7taWsJk) and [closure transaction](https://solscan.io/tx/4JT9CwjSPPJvWr1fmDgS1HupjBVtoaut48yzNev7hcWKVH6ALcxu7rBXUyrvp39FbXmhT29vmiL7JHnDafMTQ4gD) are supplied for manual verification; event evidence was decoded from Helius RPC transaction data, not independently fetched from Solscan.

Public sample outputs: [summary](pilot/evidence/helius-history-2026-11-05/sync-summary.json), [checkpoint snapshot](pilot/evidence/helius-history-2026-11-05/checkpoint.json), [all decoded events and limitations](pilot/evidence/helius-history-2026-11-05/decoded-events.json).

## Reproduction

From `pilot`, with the Helius URL already configured locally:

```powershell
node --env-file-if-exists=.env.local --import tsx scripts/helius-history-sync.ts BFj5cELThtyrcTkuX5PftKmbnbg5Ezo2zgYudG9v5dsN 1792601558 1792678863
```

Repeat identical arguments to resume one page at a time. Do not delete checkpoints merely to repeat calls. The CLI prints signatures, interval, query status and observed transaction fees; it never prints provider URLs or keys. Stored transaction fees may cover multiple positions/actions and are not yet allocated to the target.

For the committed public evidence snapshot, run from the repository root:

```powershell
.venv/Scripts/python.exe scripts/decode_archival_history.py pilot/evidence/helius-history-2026-11-05/checkpoint.json pilot/evidence/helius-history-2026-11-05/decoded-events.json
```

Private operational checkpoints remain under the ignored ledger directory. The evidence copy is limited to this already-public research fixture. This single-node implementation is not cross-process locked and must not run concurrent CLI processes against the same scope.

## Financial and operational limits

No deposits/withdrawals, claimed-fee totals, transaction-cost allocations, historical USD P&L or hold benchmarks were newly calculated. Failed transactions cannot contribute successful events. A decoder's successful parse does not independently prove complete history or absence of account reuse beyond the selected dates. JSON numeric balance fields are not certified lossless; raw instruction/event integer amounts are required for financial reconstruction. No frontend status is promoted by this diagnostic.

The local IDL is pinned existing research evidence, not automatically refreshed from a current program deployment. Unknown/new event layouts remain visible as decode errors and must block financial certification until researched. Transaction payloads remain server-side rather than being returned to the portfolio browser.

At the documented 10-credit minimum per successful history call, the two-call experiment is estimated at **20 credits**. Actual billed usage was not independently measured in the dashboard. Do not extrapolate from this one small position to 990 positions or 1,000 active wallets without measuring transaction density and coverage. [Helius method and credit semantics](https://www.helius.dev/docs/rpc/gettransactionsforaddress), [credit schedule](https://www.helius.dev/docs/billing/credits).

## Next bounded implementation

Reconcile this fixture's event identities, underlying token transfers, rebalancing deposits, partial withdrawals, claim variants and closure against the existing Python accounting logic. Expand the initial time window if boundary evidence requires it. Attribute observable costs carefully; keep unknown costs and historical prices unavailable. Only then consider a verified-history status on individual Closed rows. Existing 990 all-time source count must remain explicitly source-reported until scope and ownership are independently established.

## Executed quality checks

- Research regression suite: **72 passed**.
- Pilot unit suite: **94 passed**, including four new archival tests covering durable resume/deduplication, checkpoint preservation on failures/conflicts, cursor stalls, a ten-page budget, independent scopes, invalid/foreign records and failed-transaction retention.
- Browser/API regression suite: **38 passed**, including mobile, historical pagination/error states, invitation, consent and financial warning checks.
- Production build and TypeScript: passed.
- Browser build audit: 15 browser files, 12 configured secret values checked, **zero matches and zero private artifacts copied**.
- Rebuilt local `/app` and `/api/health?ready=1`: HTTP 200. Requests made before the restarted server was ready timed out; subsequent health checks passed. No deployment occurred.

An exhausted query checkpoint is currently cached rather than periodically revalidated against late provider indexing. This operator foundation must gain an explicit revalidation policy before it can support any certification of historical coverage. Existing app telemetry and human pilot-validation status were not changed.
