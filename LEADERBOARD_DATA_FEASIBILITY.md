# Leaderboard data feasibility

Checked **2026-10-19 UTC**. **Top-100 ranking functionality is documented; authorized programmatic collection is not established. No member sample was collected.** API access findings are in [POOLPARTY_API_AUDIT.md](POOLPARTY_API_AUDIT.md).

## Requested rankings

The [official leaderboard guide](https://lppool.party/guide/leaderboard) describes a top-100 member board with 7-day, 30-day and all-time periods and PnL, fees, deposited volume and win-rate measures. It also offers country/following filters. Ranking eligibility depends on LP activity and sufficiently recent synchronization; others can appear without a numeric rank. These are **Pool Party members**, not a census of Meteora LP wallets.

| Requested cohort | Documented website capability | Authorized top-100 data collection now |
|---|---|---|
| 7-day P&L | 7-day period + PnL measure | Not established; no public API contract/access. |
| 30-day P&L | 30-day period + PnL measure | Same blocker. |
| All-time P&L | All-time period + PnL measure | Same blocker; inception definition unknown. |
| Fees | Claimed plus unclaimed fees; period selector exists | Same blocker; specify period before a future export. |
| Deposited volume | Deposits into pools, not swap turnover | Same blocker; specify period and deposit/redeposit rules. |
| Win rate | Meteora-defined winning-position share | Same blocker; exact denominator, eligibility and minimum count need a contract. |

The guide does not establish machine-readable rank values, tie handling, rolling-window boundaries, timezone, pagination consistency or that every displayed configuration has 100 eligible members. Country win rate is an average of members' rates, which differs from weighting all individual positions. Do not substitute country or following boards for the global member population.

## What a permitted sample must preserve

The following is a **proposed research schema**, not Pool Party's official schema:

| Field group | Required fields / reason |
|---|---|
| Snapshot identity | Local snapshot ID, UTC retrieval time, source-provided generation/as-of time, schema version and response hash. |
| Ranking definition | Global Members scope; metric; currency; 7d/30d/all-time label; exact start/end/timezone when provided; rank, tie rule, sort direction and eligibility. |
| Profile identity | Provider-issued opaque ID and permitted profile URL. Wallet address is absent by default. Never treat a display name as a stable ID. |
| Metric lineage | Original value/precision/unit, missing-versus-zero status, provider definition/version, member-specific last sync, pagination completeness. |
| Cohort continuity | Provider-issued wallet-link version or nonidentifying change flag **only if permitted**. Otherwise longitudinal continuity is unknown. |
| Permission | Applicable access/license reference, allowed retention, deletion/revocation handling and position-visibility scope. |

`data/poolparty_audit/leaderboard_sample.json` records all six requested cohort types with no observations. It contains no invented ranks, profile IDs, wallet addresses or P&L values.

## Feasibility for research uses

| Use | Current assessment | Evidence needed to enable it |
|---|---|---|
| Historical USD P&L reference | Possible **secondary reported outcome**, not verified ground truth; no sample retrieved. | Authorized exact-value export, price lineage, period/cost/fee definitions and applicable positions. |
| Wallet-performance cohorts | Member-performance cohorts may be possible; wallet cohorts are not established. | Authorized opaque IDs plus owner-consented wallet mappings where independently required. |
| Closed-position benchmarks | Potentially useful for validation with opt-in participants. | Explicit position identity/signatures from the owner or a permitted verification workflow; complete histories and unrounded amounts. |
| Pool selection patterns | Conditional, visibility-filtered observations only. | Authorized pool identifiers and appropriately anonymized activity/positions. |
| Repeated leaderboards | Feasible prospectively only after access and retention rights are agreed. | Timestamped complete snapshots; change history; rate quota; stable IDs. Today's board cannot recreate past ranks. |

The [visibility guide](https://lppool.party/guide/privacy) makes missing positions depend on the viewer's relationship/eligibility. Consequently, hidden records must remain missing, not be treated as no activity, zero capital or zero losses. Activity sharing is opt-in and does not retrospectively publish earlier activity, according to the [LP-idea/activity guide](https://lppool.party/guide/lp-ideas).

## Biases to preserve

- Invitation, membership, visibility and survivor selection limit generalization beyond participating members.
- Active users refresh more often than inactive ones; a single board mixes data ages.
- Selecting large absolute P&L or fees can select large capital; win rate alone ignores loss severity and sample size.
- Wallet replacement breaks the assumption that a long-lived profile represents one unchanged strategy or wallet. [Wallet guide](https://lppool.party/guide/wallet).
- Ranking by outcomes and then measuring the same period creates selection bias. Prospectively freeze a cohort and evaluate future periods, accounting for missing members and wallet changes.

## Minimal permitted next experiment

After a documented access grant, request a small provider-supplied global-member snapshot for an explicitly chosen period, without wallet identities. Separately invite owners to volunteer a few already-closed position accounts and transaction signatures for accounting comparison. Match only these consensually supplied records. Retain provider P&L as an attributed reference, compare net flows/costs/price marks, and record disagreements instead of overwriting chain-derived results. No messages, invites, data requests or account operations were performed in this audit.
