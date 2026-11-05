# RANGE — Token-2022 valuation-only support

2026-10-23. A bounded continuation of the Portfolio correctness sprint. No execution support, new module, dependency, subscription, telemetry or deployment.

## Evidence and implemented boundary

Five public mints from the retained portfolio samples were captured through `getMultipleAccounts` at slot **460503700**. [Raw account fixtures](pilot/evidence/token2022/mints.json) include owner, mint address, expected/on-chain decimals, bytes and SHA-256. Four contain only MetadataPointer (18) and TokenMetadata (19). One also contains TransferFeeConfig (1).

A separate [RPC jsonParsed cross-check](pilot/evidence/token2022/rpc-crosscheck.json), at slot **460505714**, agrees on initialization, decimals and extension lists for all five. These are different-slot reads, not an atomic-state claim or an independent security audit. The RPC parser is a different decoding implementation, not an independent blockchain/data source.

The implementation accepts initialized Token-2022 base mints and extended mints containing only the two supported metadata extensions. It rejects unsupported extensions, wrong owners/decimals, invalid authority-option tags, bad mint padding/account types, truncated or duplicate extensions, malformed metadata strings and metadata identifying another mint. Unrecognized layouts fail closed. Limits of 16 KiB per mint, 32 extensions and 128 additional metadata pairs are conservative local resource policies; valid accounts outside those limits may remain unsupported.

Token-metadata strings are checked for structural integrity but never used as verified identity, followed as URLs or rendered from raw mint data. Name/symbol metadata remains mutable and does not establish asset safety.

### Separate eligibility

- `Token.verified` retains the existing classic-SPL conversion gate. It stays **false** for Token-2022.
- New `Token.valuationVerified` permits a validated metadata-only mint to use current reference pricing.
- `Token.valuationMetadata` retains status, extension types, reason, observed slot and retrieval time. The existing mint cache remains 60 seconds.
- Jupiter pricing still requires matching decimals, valid block metadata and a source block timestamp within the existing current-price window. Inventory must also be fresh. No stablecoin peg, pool-price substitution or relaxed timestamp rule is introduced.
- TransferFeeConfig and every other unsupported extension remain excluded when a nonzero component requires a price. Known zero quantities still require no price, consistent with existing accounting.
- Principal and fees remain separate. Market-reference estimates are not liquidation proceeds, actual withdrawal amounts or historical profitability.

The Decision gate and Jupiter quote function still reject Token-2022 conversions. Their explanations now distinguish valuation-only metadata from metadata that could not be validated. No transfer-fee computation, full withdrawal/redeposit simulation, transaction construction or signing was added.

## Official schema sources

Read during this sprint:

- [Token-2022 overview](https://www.solana-program.com/docs/token-2022): program identity, shared base mint layout and extension model.
- [Mint base state](https://github.com/solana-program/token-2022/blob/b6cdfa370dce717f2a96e568086099b04e547365/interface/src/state.rs): base fields, option tags and initialized state.
- [Account type / TLV extensions](https://github.com/solana-program/token-2022/blob/b6cdfa370dce717f2a96e568086099b04e547365/interface/src/extension/mod.rs): padding, account type and extension IDs.
- [MetadataPointer](https://github.com/solana-program/token-2022/blob/b6cdfa370dce717f2a96e568086099b04e547365/interface/src/extension/metadata_pointer/mod.rs): fixed-size fields.
- [TokenMetadata](https://github.com/solana-program/token-metadata/blob/f82a81c8290802a84d24cca6d1d7bdc6e99c3bc5/interface/src/state.rs): Borsh fields and associated mint.

Source revisions observed: token-2022 `b6cdfa370dce717f2a96e568086099b04e547365`; token-metadata `f82a81c8290802a84d24cca6d1d7bdc6e99c3bc5`. This is a new narrow decoder based on public formats; no SDK dependency or competitor implementation was imported.

## Live adapter observations

[Three-wallet adapter audit](pilot/evidence/token2022/after.json):

| Wallet | Supported open accounts | Principal coverage | Fee coverage |
|---|---:|---:|---:|
| `ACUvKyTc7dEwR8oMqUZd5xpj19osaFZoXPauuy52adQM` | 8 | 6/8 | 6/8 |
| `BazUUKN4YLpKQ4NNYYUtuzd6CcniPn1jkFjB4FuVMyo7` | 0 | No supported positions | No supported positions |
| `8k2KVhVrBWAVov4zbBXciyA3KbVz8Az9uTc7uX8WJP5R` | 2 | 2/2 | 2/2 |

The first wallet still had one stale-inventory exclusion and one unsupported-extension exclusion. The source snapshots and wallet counts can change; differences from earlier runs are not all attributable to this code change. The fixtures isolate the actual eligibility improvement: four previously unsupported metadata-only mints can now qualify without enabling conversions. Complete wallet valuation is not guaranteed.

## Verification and reproduction

Six focused unit tests cover real fixture/hash replay, base layout validation, malformed/unknown TLV, metadata identity/encoding, independent valuation-versus-quote gates, and the real wallet adapter path with isolated RPC/API fixtures. A browser regression checks the contextual valuation-versus-conversion disclosure. Full results and actual screenshots are indexed in [the evidence directory](pilot/evidence/token2022/README.md).

Final checks: **72 research tests, 86 pilot unit tests and 36 browser/API tests passed**. Production build and final TypeScript check passed. The build audit checked 15 browser files and 11 configured secrets, with zero matches and zero private artifacts copied. The research validator confirmed 1,013 protected evidence files unchanged.

The normal-UI live check passed with zero page errors, unchanged summary across pagination, refresh verified and 12 screenshots at 1440/834/390/320px without horizontal overflow. Its largest observed response was **12,267 bytes**. A real authenticated read-only brief request for a metadata-only position returned HTTP 200 with both EXIT and REBALANCE explicitly unavailable because conversion eligibility remained blocked. The later UI capture had 6/8 principal and fee coverage, with two stale-inventory and one unsupported-extension reason; exclusion causes overlap. Different snapshots may have different exclusion counts.

```powershell
# From pilot/, with the existing local environment:
node --env-file-if-exists=.env.local --import tsx scripts/token2022-crosscheck.ts
node --env-file-if-exists=.env.local --import tsx scripts/portfolio-coverage-audit.ts after --token2022
node --env-file-if-exists=.env.local --import tsx scripts/portfolio-correctness-browser.ts --token2022
```

`token2022-capture.ts` deliberately refreshes the mint fixtures; archive the previous snapshot before rerunning it. The cross-check reads those fixtures and compares selected fields against a later parsed RPC read. Browser diagnostics use existing invitation access and never export invitation credentials. Prior Portfolio evidence is preserved in its original directory.

## Changed surfaces and remaining limits

New `pilot/lib/mint-metadata.ts`; optional token fields in `models.ts`; metadata attachment in `meteora.ts`; valuation-only gating in `current-prices.ts` and pricing-failure classification in `aggregation.ts`; explanation-only changes to `math.ts` quote gate and `CurrentAnalytics.tsx`; one additional coverage label. Added `tests/token2022.test.ts`, an aggregation browser case, capture/cross-check scripts and an optional separate evidence directory for existing diagnostics.

Transfer fees, hooks, interest-bearing/scaled amounts, confidential balances and unknown extensions remain unsupported. Indexed inventory is still not independently reconstructed from bin shares. Stale inventory, missing marks and incomplete historical accounting remain explicit gaps. Verified historical USD P&L remains unavailable. Persistent hosting/state and real ten-user validation remain separate work; no tester results were invented.
