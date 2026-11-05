# Live archival recovery evidence

This folder contains public on-chain research observations for an existing fixture. No key, private environment file, user feedback or verified USD performance is included.

- `sync-summary.json`: actual two-page importer result, fixed interval and transaction links.
- `checkpoint.json`: sample copy of the durable Helius checkpoint, 13 transactions. Runtime checkpoints live in the ignored private ledger directory.
- `decoded-events.json`: reproducibly generated using the existing pinned DLMM IDL. 21 events, including one target PositionCreate and one target PositionClose, with zero decode errors. Includes all observed events and explicit limitations.

Read [scope, reproduction, financial limits and implementation](../../../HELIUS_HISTORY_FOUNDATION.md).

This evidence establishes bounded archival access and target creation/closure event observations. Query exhaustion is not a certification of lifetime completeness. It does not establish reconciled deposits, claimed fees, allocated costs, historical USD P&L or an exhaustive wallet-wide history.
