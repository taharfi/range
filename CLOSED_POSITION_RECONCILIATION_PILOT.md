# One reconciled closed-position pilot — 2026-11-09

Finished daily GitHub reliability and added a narrow closed-position evidence workflow. A collapsed **Saved on-chain evidence** section in Closed loads operator-generated, wallet-scoped reports on demand. It does not backfill history on page load, add the sample to indexed counts or verify every indexed closure.

The existing `/api/portfolio` POST route accepts `{ "kind": "reconciliation", "address": "PUBLIC_WALLET" }` behind the same invitation, origin, validation, rate-limit and concurrency controls. It reads at most five private cached reports, validates identities, gate flags, atomic/display units, transfer/balance sums and transaction-fee sums, then omits raw accounting payloads. No cache means `not-indexed`, explicitly not proof of no closed positions. Invalid caches return errors.

## Actual financial evidence

Position: `BFj5cELThtyrcTkuX5PftKmbnbg5Ezo2zgYudG9v5dsN`.

Owner: `ACUvKyTc7dEwR8oMqUZd5xpj19osaFZoXPauuy52adQM`.

Pool: `7ZvTsPCzoypD1x4cwGDhWCLG61GbMCF18TXwcMPsYLxg`. Current metadata calls the pair Kimchi / SOL; mint identity and decimals, rather than mutable symbols, determine accounting. X mint is `CSocnzcRpgSCr1naKcNTieWZUxb6rABe45j844m7pump` (6 decimals); Y is wrapped SOL (9 decimals).

- All 13 archived transactions match 13 unique signatures from a separate finalized `getSignaturesForAddress` query (limit 100, returned 13). These are two methods at **the same provider**, not independent-provider agreement.
- The current position account is absent. Its decoded PositionClose transaction leaves the position account with zero lamports; the creation/closure events identify the same account and owner. Liquidity removal alone is not closure.
- Pool-prefix mint/reserve addresses agree with Meteora metadata. All **26 token-side checks** (13 transactions × 2 tokens) match event flows against SPL transfers and raw-string reserve pre/post token balances.
- Three ClaimFee / ClaimFee2 compatibility pairs count once. Composition fees remain embedded in reconciled deposits/rebalances. Non-transfer setup/sync/close instructions are retained; their costs are not assumed zero. Unsupported or unmatched events block reconciliation.
- Event discriminators/type definitions in the pinned IDL matched the current official SDK IDL inspected during the run. No SDK/dependency version changed.

| Token-denominated flow | X token | SOL |
| --- | ---: | ---: |
| Deposited | 1090.007341 | 0.299999992 |
| Withdrawn principal | 2180.032122 | 0 |
| Claimed fees | 55.590854 | 0.012046774 |

These are **flows, not profit**. More units of one token alongside fewer units of another do not establish economic profitability. No nonzero reward event was observed in this supported sample; unsupported reward attribution would block certification.

Observed transaction fees total **1,339,067 lamports (0.001339067 SOL)**. This is not a complete position execution cost: owner native balances, rent, tips and unrelated instruction costs have not been fully allocated. Historical USD P&L and hold benchmarks remain unavailable. The new view displays exact units rather than rounding these small amounts to three decimals.

One atomic X-token unit separates the observed fee total from the older indexed sample's display amount. The evidence view preserves the reconciled result separately; indexed rows are not overwritten and no assumption is made that the API is wrong.

[Creation transaction](https://solscan.io/tx/5bNCY4padHPBYJCVuvj3vX2PU9Yt6o2qG4SRerSezBBeqQNVXCyBdnaLad445rTURQqNcJLCXgpHBdQdX7taWsJk) · [Closure transaction](https://solscan.io/tx/4JT9CwjSPPJvWr1fmDgS1HupjBVtoaut48yzNev7hcWKVH6ALcxu7rBXUyrvp39FbXmhT29vmiL7JHnDafMTQ4gD).

## Try locally

Analyze the owner above in `/app`, then **Closed → Saved on-chain evidence → Load saved evidence**. Expand Kimchi / SOL. This saved evidence is separate from whichever Meteora pool page is currently loaded.

Rebuild the private cache from the repository root:

```powershell
.venv/Scripts/python.exe scripts/reconcile_archival_position.py pilot/evidence/helius-history-2026-11-05/checkpoint.json data/evidence/closed-pool-verification.json --output pilot/var/ledger/reconciled
```

Use the configured ledger directory if different. The five-position manifest is a pilot bound, not a wallet-wide index. Use one operator at a time; multi-process writer coordination is not implemented.

Public reproduction fixtures: `data/evidence/closed-pool-verification.json` and `data/evidence/closed-position-reconciliation.json`. Runtime caches and screenshots remain under ignored `pilot/var/`. No API key, invitation or feedback is in these fixtures.

## Actual QA and limitations

The local live browser walkthrough loaded one reconciled report / 13 transactions, with zero page errors, no consented tracking or feedback submission, and no overflow at 1440px/390px. Screenshots under `pilot/var/reconciliation-pilot/browser/` were visually reviewed. Review caught overly aggressive rounding of small costs; exact units replaced that formatting.

The scheduled GitHub rehearsal returned exit code **0**, scanned the unchanged snapshot and explicitly created no empty commit. Authentication prompts are disabled and commands have time limits. The 20:00 Casablanca task requires the signed-in local computer.

This reuses an existing research fixture, without increasing previous cohort counts or claiming the source-reported 990 closed positions are reconciled. No public deployment, signing, execution or historical USD profitability was introduced. Genuine tester demand, retention and payment intent remain unproven.

Next: three assisted LP sessions with the existing facilitator pack, then address only evidenced workflow/accounting gaps.

Sources: [Solana signature-history method](https://solana.com/docs/rpc/http/getsignaturesforaddress), [Meteora SDK IDL](https://github.com/MeteoraAg/dlmm-sdk/blob/main/idls/dlmm.json), [Helius history method](https://www.helius.dev/docs/rpc/gettransactionsforaddress). These document retrieval/schema semantics; reconciliation outcomes come from the executed local pipeline.

Final executed checks: **82 research tests, 95 pilot unit tests, 40 browser/API tests and 6 publishing-safety tests passed**. Production build/TypeScript passed. Browser audit checked 15 files against 12 configured secret values, with zero matches or private artifacts. The final live walkthrough passed after exact-unit formatting and settled closed-index loading; both desktop and mobile were reviewed again. Publishing uses staged/history secret scanning, with private runtime caches and screenshots excluded.
