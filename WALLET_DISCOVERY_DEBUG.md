# RANGE wallet discovery investigation

2026-10-22. Address: `34kjDvJ49xbg9VtX2N1ReQeWtFSAaGZUh6UqFHGPmzaw`. Read-only investigation; no hosting configuration, deployment, dependency installation or transaction submission.

## Conclusion and evidence

No currently open, supported, owner-matched DLMM positions were found at the observed mainnet slots. This is supported by two different discovery paths, not an assumption based on an empty UI. The wallet does have verified **historically closed** DLMM positions. The confirmed product defect was misleading fallback error presentation, not demonstrated loss of active positions for this wallet.

| Check | Actual observation |
| --- | --- |
| Base58 validation | Decodes to exactly 32 bytes |
| Mainnet identity | Official RPC genesis hash `5eykt4UsFv8P8NJdTREpY1vzqKqZKvdpKuc147dw2N9d` |
| Account type at slot 459863825 | System Program owner `11111111111111111111111111111111`, zero data bytes, non-executable: an ordinary funded system account, not PositionV2 |
| Meteora `/portfolio/open?user=…&page=1&page_size=5` | HTTP 200; `totalCount:0`, `totalPositions:0`, `hasNext:false`, `pools:[]` |
| Independent DLMM account scan at slot 459863825 | `getProgramAccounts` with owner memcmp offset 40 returned zero accounts |
| SDK-equivalent PositionV2 + owner scan at slot 459864646 | PositionV2 discriminator and owner offset 40 returned zero accounts |
| Operator / fee-owner scans | IDL-derived offsets 7960 / 8001 returned zero accounts. These are current fixed-layout matches, not a proof about every delegated or external strategy relationship. |
| Positive control | Same RPC owner scan for the existing public research sample returned one account; RPC scans were not universally empty |
| Historical sample | 25 signatures obtained, first 8 transaction records inspected; 5 involved DLMM. Current published IDL event-CPI decoding identified explicit PositionClose events for two distinct positions. |
| Closed-account spot check at slot 459864647 | Both position accounts returned null in `getMultipleAccounts` |

Verifiable closed-position examples:

- `AFLJGUUTr82cyot6BVCqJkKvv1Bwcy2JUBmRyBxHyVoG`: PositionClose names the supplied wallet as owner at slot 459829550, **2026-10-22 00:20:31 UTC**. [Transaction](https://solscan.io/tx/4eeMYfNEZ9NAfTMKheEnMmdgxa2PSP6kKiSiFUHzRkA7tpwhX5D9YsQEmuxwHKELC3qrsuZA3RebLDPso8swgv5t). A PositionCreate event for the same owner/position was also decoded at slot 459828898.
- `H5BrQQLA1hGVEtnZDZ9kjtTMMCzPvGFo9pf5EGVGBJ8j`: PositionClose names the supplied wallet as owner at slot 459591950, **2026-10-21 10:14:51 UTC**. [Transaction](https://solscan.io/tx/2N3AptTibdHTLgkMraudMVA3oFz1FN3VDfUHrb2jsvJuVrhX3saQLakKUDZXqqdBdiH77zbVmtuzLbuScKvN4CjM).

These conclusions use explicit close events, not withdrawals or empty liquidity as a substitute. ClaimFee and ClaimFee2 emissions are not summed into new financial claims. No profitability was calculated.

## Reproduction and full pipeline

The exact input was submitted through `/app`, invitation entered normally, optional analytics left unchecked. Before the patch:

1. Client validates the address alphabet/length and sends `POST /api/positions` with `kind:"wallet"`.
2. Existing guard, request limits and concurrency gate run. Server validates the decoded address length and queries Meteora's DLMM Data API open portfolio.
3. The provider returns no pools, so no pool enrichment, position normalization, range filtering or mint verification occurs. Nothing was removed by a decoder or supported-position filter for this wallet.
4. Server returns HTTP 200 with empty positions/warnings and no remaining pages.
5. Client probes the same address with `kind:"position"` because the initial result is empty. Official mainnet `getAccountInfo` returns the system-owned wallet account. PositionV2 prefix validation correctly rejects it with HTTP 400.
6. The UI previously attached every fallback 400/404 message to the successful empty wallet response. This produced “No open position found” alongside “not a supported … PositionV2 account.” That conflated a wallet with its optional position probe.

The same misleading copy affected any empty wallet for which the fallback returned 400/404. Provider exceptions were not generally converted into empty portfolios, but per-pool failures/invalid position records could display the same empty headline despite explicit warnings. That ambiguity is also corrected.

Production local-server output had startup information and no application exception for the reproduction; a normal HTTP 400 did not produce a stack trace or provider-request log. No sensitive request logging was enabled. Browser request/response evidence and separate provider/RPC responses supply the trace instead. The server has no custom RPC configured in the diagnostic shell; its existing default is `https://api.mainnet.solana.com`. Independent checks used the official `https://api.mainnet-beta.solana.com` and verified the mainnet genesis hash.

## Comparison with the official SDK

Reviewed [SDK source](https://github.com/MeteoraAg/dlmm-sdk/blob/576919e3e4368e542c402f000b4264724f7f23ec/ts-client/src/dlmm/index.ts) at commit `576919e3e4368e542c402f000b4264724f7f23ec`, plus [account filters](https://github.com/MeteoraAg/dlmm-sdk/blob/576919e3e4368e542c402f000b4264724f7f23ec/ts-client/src/dlmm/helpers/accountFilters.ts). The official [reference](https://github.com/MeteoraAg/docs/blob/main/developer-guides/dlmm/typescript-sdk/reference.mdx) documents both requested methods. The requested developer-guides web root was inaccessible through the research browser; the official documentation repository was accessible.

- `getAllLbPairPositionsByUser` discovers PositionV2 accounts using discriminator + owner memcmp, then processes pools, bins and inventory. The isolated read-only diagnostic reproduced those discovery filters on RPC and got zero accounts, so there were no accounts to enrich. The full SDK was not installed or invoked; this is a discovery-stage comparison, not a claim to have run all SDK processing.
- `getPositionsByUserAndLbPair` uses the same PositionV2 and owner filters plus pool offset 8, then fetches active bin and processed balances. Since the all-pools owner scan was empty, any additional pool filter is a subset. No arbitrary pool was substituted to manufacture a result.
- The downloaded current IDL exposes PositionV2, with `lb_pair` and `owner` as its first fields; current SDK discovery does not promise all legacy account variants. Neither RANGE nor this diagnostic should claim comprehensive legacy discovery. Extended PositionV2 ranges do not change those prefix fields; RANGE's current inventory still depends on the index.
- RANGE deliberately uses the index for balances rather than running the SDK’s bin-array accounting. No installed production SDK or SDK version conflict explains this empty result.

[Solana getAccountInfo](https://solana.com/docs/rpc/http/getaccountinfo) and [getProgramAccounts](https://solana.com/docs/rpc/http/getprogramaccounts) define the independent account-state and filtered-program-account checks. Provider incompleteness remains a general limitation; two agreeing current-state paths and a positive control reduce that concern for this observation without proving every index/RPC always complete.

## Minimal fix

- `pilot/lib/http.ts`: optional safe `PilotError.code` serialized by the existing error response; arbitrary exceptions remain redacted.
- `pilot/lib/meteora.ts`: explicit `UNSUPPORTED_POSITION_ACCOUNT` and `POSITION_ACCOUNT_NOT_FOUND` codes only for those verified classifications. Financial/account decoding, inventory, token checks, API paths and pagination limits unchanged.
- `pilot/app/components/RangeApp.tsx`: suppress only those expected fallback classifications after an otherwise complete empty wallet result. Arbitrary 400/404, indexing errors and timeouts remain failures. Do not fallback while pool/position pages remain. Empty coverage copy explains the index, closed-position exclusion and other protocols; warnings/remaining pages show “Position discovery incomplete” rather than implying absence.
- Focused tests in `pilot/tests/discovery.test.ts`, `pilot/e2e/discovery.spec.ts`; browser project registered in `pilot/playwright.config.ts`. `pilot/e2e/design.spec.ts` updates its incomplete-coverage headline expectation.

## Limits and evidence storage

Evidence is under `pilot/evidence/wallet-discovery/`: `before.json` and `before.png` show the original normal UI; `portfolio.json`, RPC responses, SDK source snapshots archived as `.ts.txt`, current IDL, signatures, raw DLMM transactions and decoded events support the independent checks. Request parameters are preserved in the SDK-equivalent/operator/fee-owner/closed-account/control response files. No invitations, session cookies, RPC credentials or private keys were saved. Public financial evidence belongs to the address supplied for this investigation, not anonymous tester data.

Initial standalone Node external fetches failed with TypeError; a Python urllib provider request without the pilot User-Agent returned HTTP 403. The documented public endpoint subsequently returned HTTP 200 using the same pilot User-Agent as RANGE. Those transport failures are not evidence of an empty portfolio and were not used as such. No authentication restriction was bypassed. The raw before report preserves those failures.

The history sample is bounded, not a full lifecycle or exhaustive count of every historical position. No active owner/operator/fee-owner-matched current DLMM accounts were found, but arbitrary positions owned by another wallet cannot be attributed to this user without evidence. DAMM, vaults, strategy wrappers, tokenized/NFT protocol positions and all legacy variants were not exhaustively enumerated; their absence is not claimed. This remains an open-DLMM pilot. Closed history is diagnostic evidence only and is not exposed as new product functionality.

Build validation initially hit a Windows lock from the existing server, resolved by stopping it. A subsequent typecheck picked up downloaded SDK `.ts` evidence; renaming it to `.ts.txt` resolved the error without changing dependencies or compiler configuration. A build command mistakenly run at the repository root had no build script; the production build was rerun successfully in `pilot`. Final check results are recorded below after completion.

## Final validation

| Check | Actual result |
| --- | --- |
| Research pytest suite | 72 passed |
| Pilot unit suite | 45 passed, including discovery subtests |
| Browser/API suite | 20 passed on final complete run |
| Typecheck | Passed |
| Production build | Passed, including standalone preparation |
| Browser secret/artifact scan | 15 browser files, 11 configured secrets checked: zero secret matches or copied private artifacts |
| Protected research validation | All 1,013 protected files unchanged |
| Copilot research hash comparison | All 39 files unchanged |
| Live UI recheck | Wallet HTTP 200 empty; fallback HTTP 400 correctly typed and omitted from wallet warnings; zero browser errors; no mobile overflow |

The first browser run had 18 passes and two test-assertion failures: an expected old headline and a locator also matching Next's route announcer. These assertions were updated; no financial or security behavior was weakened to make them pass. The final full suite passed, including genuine HTTP access/consent/deletion protections and decision recovery checks.

`after-live.json`, `after-live-desktop.png` and `after-live-mobile.png` capture the actual corrected public-wallet flow, separately from synthetic QA screenshots. Desktop and mobile were visually reviewed. The app remains local at `http://127.0.0.1:3000/app`; no deployment or hosting setup occurred. Existing read-only APIs, limits, financial calculations, quote age gates, principal/fee separation and invitation/consent controls remain in place.
