# Helius wallet discovery check — 2026-11-05

Local read-only checks after configuring Helius mainnet through the existing server-only `SOLANA_RPC_URL`. No application logic, dependency versions, invitation controls, financial calculations or production secrets were changed.

## Observed results

| Public wallet | Meteora indexed open | Helius owner-matched PositionV2 | RANGE hydrated and verified |
| --- | ---: | ---: | ---: |
| BazUUKN4YLpKQ4NNYYUtuzd6CcniPn1jkFjB4FuVMyo7 | 0 | 0 | 0 |
| 8k2KVhVrBWAVov4zbBXciyA3KbVz8Az9uTc7uX8WJP5R | 1 | 1 | 1 |
| 6Gsjssm7u4i4TTbD51nxxmcpuKBN17T1QcpSSbNDwaGc | 2 | 2 | 2 |
| ACUvKyTc7dEwR8oMqUZd5xpj19osaFZoXPauuy52adQM | 1 | 1 | 1 |

All four input accounts were non-executable System Program accounts, consistent with ordinary wallet inputs rather than DLMM position accounts. Each address decoded to a valid 32-byte public key. This does not establish who controls an address.

The first pass observed george/SOL (out of range), FLOAT/SOL and HIGH/SOL (both in range), and SOL/USDC (in range). Indexed and current-account counts agreed; no positions were removed by owner verification and no missing-hydration issues were returned. All four server snapshots reported complete coverage **within supported current owner-matched PositionV2 scope**. This does not establish exhaustive ownership across delegated authorities, legacy layouts or other protocols.

Current principal and separate unclaimed-fee market-reference estimates were available for all four positions during the check. These combine Meteora-indexed inventory with validated current marks; they are not raw-account inventory reconciliation, withdrawal proceeds or historical P&L. Values and range status can change. The empty wallet's $0 represents supported open inventory only, not total wallet net worth.

## Method and evidence

1. Independently read each input with Helius `getAccountInfo`.
2. Query the DLMM program with `getProgramAccounts`, filtering PositionV2 discriminator at byte 0 and wallet owner at byte 40; decode the pool/owner prefix and record the response slot.
3. Read Meteora `/portfolio/open` with bounded pagination (50 pool groups per page, diagnostic cap 10 pages). Every wallet returned one page with no continuation.
4. Authenticate through RANGE's normal local pilot session endpoint with analytics consent false; submit all four wallets through the browser search form. Observe actual `/api/positions` and `/api/portfolio/aggregate` responses and capture screenshots.
5. Compare accounts, counts, hydration results and rendered empty-state copy. Existing app hydration still uses Meteora; Helius supplies account verification and mint checks. Different requests are observations at different slots, not an atomic snapshot.

First-pass raw evidence and four screenshots: `pilot/evidence/helius-wallet-check-2026-11-05T15-13-51-469Z/`. Independent scan slots: 465752025, 465752038, 465752096 and 465752158, respectively. A second run added explicit account-set equality and displayed-error assertions; its separate timestamped directory preserves both runs.

The first pass recorded `apiError: UNSUPPORTED_POSITION_ACCOUNT` for BazU…VMyo7. This is an internal direct-position fallback request after an empty wallet result, not a wallet-discovery error. The UI intentionally suppresses this classification. Its recorded rendered text correctly says no supported positions were returned and does not display the PositionV2 error. The diagnostic now records these expected responses as `directAddressProbe` to avoid misinterpreting network evidence.

## Conclusions and limits

- No missing-position defect reproduced for these four wallets at the observed slots. No application fix is justified by these results.
- Helius is working for the current RPC path, but there is no controlled before/after experiment proving that the subscription alone resolved earlier failures. Prior wallet counts may refer to different dates.
- Zero current owner-matched accounts does not prove no closed positions, legacy positions, delegated positions or other Meteora protocol positions exist. This check did not backfill history or establish closure.
- No missing-index fallback was exercised. A future RPC-only supported account must remain partial until its inventory can be hydrated and validated; do not invent it or silently exclude it from coverage.
- Helius provides access to on-chain evidence, not historical USD prices or a complete DLMM accounting engine. Historical profitability remains unverified.
- No feedback, analytics consent, signing, transaction submission, deployment or subscription changes occurred. Exact billed credits were not measured from the Helius dashboard.

## Reproduction and checks

From `pilot`, with Helius and the existing development invitation configured locally:

```powershell
node --env-file-if-exists=.env.local --import tsx scripts/helius-wallet-check.ts
npm test
npm run typecheck
```

The diagnostic creates a new timestamped evidence directory, never prints RPC URLs or invitation codes, uses documented read-only RPC calls, and retains existing application rate limits/access controls. It is scoped to these small reference wallets; it is not a general large-wallet pagination benchmark. Unit suite: **90 passed, 0 failed**. TypeScript: passed. No application changes required a new production build in this diagnostic-only task.

Next useful experiment: test a wallet with a currently demonstrable index/RPC mismatch, or incrementally ingest a bounded known-position transaction window. Keep historical P&L unavailable until events, costs and timestamp-aligned prices are independently reconciled.
