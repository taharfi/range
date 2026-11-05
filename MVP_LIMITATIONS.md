# MVP limits, methodology and actual status

## Aggregation and current valuation - 2026-10-23

Wallet summaries now come from server-side wallet-specific discovery, bounded hydration and a filtered owner/PositionV2 RPC scan. UI cursors return at most five rows. Currency values are current Jupiter reference estimates with block-time and decimal validation; liquidity and unclaimed fees stay separate. Incomplete/stale pricing or inventory produces a subtotal or unavailable value, never a complete wallet total. A later 2026-10-23 update adds narrowly validated Token-2022 base/metadata-only mint support for valuation. Transfer-fee and unknown extensions remain excluded, and all Token-2022 conversion quotes remain blocked. This does not establish transfer or withdrawal eligibility. See [exact support boundary and live evidence](TOKEN2022_VALUATION.md).

Historical position events are identity-upserted to durable partial JSON checkpoints under `PILOT_LEDGER_DIR` (local default `pilot/var/ledger`), with five-minute cache reuse. This is not a complete wallet index or financial reconciliation; the upstream endpoint has no documented delta cursor. Historical marks, ownership changes, costs and explicit lifecycle events still block verified P&L. Current-price data is never reused for historical returns. Aggregation jobs/cursors remain bounded process memory and need a persistent worker/cache before ephemeral hosting. See [actual implementation, limits and test evidence](PORTFOLIO_AGGREGATION_REPORT.md).

Earlier notes below document previous phases and may describe superseded unavailable-current-value or browser-accumulation behavior.


## Portfolio terminal update - 2026-10-22

The current local workspace adds documented closed-position and selected-position historical-event reads via the guarded `POST /api/portfolio` endpoint. These are **indexed, unreconciled records**, not independently verified closure/lifecycle evidence or financial performance. All-time source counts differ in scope from the 365-day pool-discovery window. Event lists always have partial coverage; unknown actors/types are retained, conflicts and rejected records are disclosed. No wallet-wide completeness, historical USD P&L or live execution is claimed.

Open position age uses validated source-reported creation timestamps where available. No signing, transaction construction, paid subscription, new analytics or competitor backend was added. Historical UI state resets when leaving the workspace. Currency conversion, significant-fee and capital-weighted exposure checks, profit charts and complete historical accounting remain unavailable. See [implementation and actual verification](PORTFOLIO_TERMINAL_IMPLEMENTATION.md).

The earlier scope description below is retained as the prior pilot baseline; historical indexing statements there do not describe the new partial API explorer.


As of **2026-10-20**. This is a working **local, read-only Next.js concierge pilot**. It contains no wallet connector, signer, transaction construction/serialization, execution endpoint, trading bot, leaderboard or historical-profitability calculator.

## What is integrated live

- Wallet lookup uses Meteora's documented `GET /portfolio/open`, then `GET /positions/{pool}/pnl?user=…&status=open`. The adapter selects only current inventory/range/fee fields and discards the endpoint's historical P&L fields. [Official position API](https://docs.meteora.ag/api-reference/dlmm/positions/get-position-pnl-data-open-and-closed-positions-with-on-the-fly-calculation), [OpenAPI](https://dlmm.datapi.meteora.ag/api-docs/openapi.json).
- A direct position lookup reads confirmed public `getAccountInfo`, checks the DLMM program and published PositionV2 discriminator, and resolves only the documented pool/owner prefix before reading Meteora. It does not decode historical events or infer the whole account from a partial schema. [Meteora accounts](https://docs.meteora.ag/developer-guides/dlmm/program/accounts), [existing pinned IDL](data/evidence/dlmm-idl.json), [Solana RPC](https://solana.com/docs/rpc/http/getaccountinfo).
- Token mint accounts independently check classic SPL ownership, initialization and decimals against the API. Unsupported/mismatched/unavailable mint data prevents quotes. Token-2022 extensions are **not supported for quoted scenarios**. Decimal arithmetic uses integer atomic amounts and 80-digit decimal operations, not floating-point token conversion. Sub-atomic API artifacts are conservatively floored and disclosed.
- Jupiter `GET https://api.jup.ag/swap/v2/order` is called **without `taker`, `payer` or referral fields**, with a requested slippage cap. Any response containing a transaction, mismatching mints/amount, exceeding that cap, or violating its returned minimum-output protection is rejected. Stricter returned tolerance, including JupiterZ 0 bps, is accepted and displayed. There are no `/execute`, `/submit` or `sendTransaction` calls. [Current quote-only documentation](https://developers.jup.ag/docs/swap), [field definitions](https://developers.jup.ag/docs/api-reference/swap/order).
- Consented feedback is written to local persistent files; local secret and ten invitation codes are configured in an ignored file. No user responses have been supplied or created. Separate temp directories are used for tests.
- Public mode requires an invitation session before live provider calls. Optional usage analytics is a separate, unchecked consent; declining it does not prevent invited use. Analytics records only server-issued event references and times under a tester identifier. Structured feedback rejects free text; it never appends lookup wallets/amounts. See [readiness report](PILOT_READINESS_REPORT.md) and [security checklist](SECURITY_CHECKLIST.md).

Actual smoke results and timestamps are in [live-smoke.json](pilot/evidence/live-smoke.json). A public research sample, not a tester wallet or testimonial, exercised wallet lookup, direct-position lookup and current quotes. Sample values become stale immediately and must never be represented as today's executable offer after their timestamp.

The [actual browser smoke](pilot/evidence/browser-live-smoke.json) also returned HTTP 200 for lookup and brief generation, rendered the live comparison and recorded no page errors. [Build/test/integrity results](pilot/evidence/VALIDATION.md) distinguish real upstream probes from synthetic interface tests.

## What is estimated or conditional

| Item | Treatment |
|---|---|
| Position inventory/fees | Indexed current estimates, with API balance timestamp and local retrieval time. These are not a same-slot independent bin reconstruction. |
| Withdrawn principal | Assumed to equal current indexed inventory after a successful full withdrawal. **Immediate withdrawal availability is unverified**: locks, permissions, reserve status and instruction outcomes are not simulated. |
| Pool liquidity | Reported pool TVL shown as context. It is not the user's liquidity entitlement, an inventory reconciliation or proof of available withdrawal liquidity. |
| Unclaimed fees/rewards | Fees displayed separately; all fee/reward claims and conversions excluded from principal scenarios. Claim ownership and costs unverified. Missing fee amount remains unavailable, not zero. |
| Exit | Standalone quotes convert each non-target principal token into SOL, USDC or one of the pair's tokens. No quote for a token already in the target asset. Multi-leg independent quotes may interact if actually executed. |
| Rebalance | One inventory swap targets a user-selected token-X percentage by current pool-mark value. Quoted achieved composition is recomputed after output fees/impact. **A new range, redeposit, composition fees and complete LP rebalance are not simulated.** |
| Holding | No immediate transaction and therefore zero immediate execution spend. Continuing price/inventory/range/protocol risks remain. No future fees predicted. |
| Slippage | User-selected 1–500 bps; 50 bps default. Minimum output uses the provider threshold, or a downward-rounded mathematical bound if omitted. It is not a fill guarantee or an additional known cost. |
| Jupiter fees | Returned fee bps/mint and price impact are displayed. Output already incorporates quote fees; do not subtract again or sum impact and fees as independently observed losses. Negative impact can indicate improvement. The current `priceImpact` field is percentage points; deprecated `priceImpactPct` is a ratio. |
| Network/priority/rent costs | Reported only if usable payer-linked estimates exist. Wallet-free responses commonly contain zero fee fields with null payers; these are **unavailable**, not zero-cost promises. No funded transaction is built solely to estimate gas. |
| Meteora-specific costs | Withdrawal, claims, account setup/closure, bin rent and redeposit costs remain unavailable. Rent refunds are not profits. The app explicitly marks full execution cost as unavailable. |

This pilot therefore compares current exposure and conversion trade-offs; **it does not yet supply all-in exit/rebalance costs**. That gap is visible on each card, not hidden in footnotes or filled with a fabricated fee.

## Freshness, coverage and errors

- API balance timestamps must be present, at most **120 seconds old**, and no more than 30 seconds in the future to request quotes. This is a conservative pilot operational gate, not a revised historical pricing rule or a claim of valuation accuracy. Stale data remains visible with warnings.
- Quotes older than **30 seconds** are labeled stale in the interface. Quote receipt time is local; market observation age cannot be established if no source slot/time is supplied. Requests do not reserve liquidity.
- Snapshot handles expire after two minutes and the process-memory cache is bounded to 200 entries; expired entries are purged on subsequent lookups. The server never accepts browser-provided token balances/decimals. Restarting or switching instances requires a fresh lookup. Multi-instance shared storage is not implemented.
- Wallet discovery shows five pools/page and twenty positions/pool-page. Both next-pool and per-pool position pagination are exposed. Direct-position lookup scans at most five 100-position pages; hitting the bound is reported as incomplete. Failed/unsupported positions produce warnings; they are not silently represented as zero balances.
- Public RPC, Meteora and Jupiter can rate-limit, omit or lag data. Conservative process-wide pacing is used (Meteora 1.1s, Jupiter keyless 2.1s); this is local policy, not a provider SLA. Timeouts and invalid responses fail closed. No auth bypass or substitute price is used.
- Initial live requests exposed an overly strict adapter check: JupiterZ returned 0 bps on firm RFQ quotes despite a requested 50 bps cap. These valid stricter quotes were initially rejected. The adapter now accepts returned tolerance **at or below** the cap, validates the minimum amount, and has a captured-response regression test. [Captured example](pilot/evidence/diagnostic-quote-0.json), [Jupiter's zero-slippage explanation](https://developers.jup.ag/blog/why-you-dont-get-what-you-were-quoted). This is not a promise that a read-only quote will fill or remain available.

## Synthetic mode and validation boundaries

“Explore a labeled example” is entirely **synthetic**, including its 2 SOL/200 USDC inventory, pool price and quotes. It makes no external price claims and cannot submit tester feedback. Browser interaction tests additionally intercept providers with explicitly synthetic fixtures; their screenshots are interface evidence, not financial observations.

Automated checks cover integer/decimal precision, API-field mapping, independent mint checks, stale/missing data, quote identity/slippage, fee separation, cash-flow conservation, consent, tampered receipts, deduplication, cross-origin requests and deletion. Browser checks exercise desktop/mobile layout, multiple-position selection, partial failure and feedback. Passing these checks is not an audit of Meteora/Jupiter or a demonstration that users understand or will pay for the product.

The pre-existing financial pipeline still has **zero verified historical USD P&Ls**. No existing pipeline code, research dataset or financial evidence is intentionally modified by this app. The old 72-test suite is retained. New integration evidence is stored under `pilot/evidence/`, separate from the protected research manifests.

## Costs and deployment blockers

External service spending: **$0**. Package/browser downloads use local storage/network; no paid API, subscription or transaction fee was incurred. An optional free Jupiter developer key can be configured server-side. A 10-person facilitated pilot should begin with the free endpoints; rate/coverage needs remain provider-dependent.

The app runs locally; it is not publicly deployed. The current local configuration is invitation-gated staging. Production preparation adds an HttpOnly session gate, input/origin/rate limits, finite request bodies/queues, a standalone Node artifact, readiness checks and consented usage analytics. This remains a **single-instance** design with process-local sessions/limits. There is no distributed limiter, email delivery or payments. Private persistent storage and daily expiry cleanup are required; ephemeral/serverless filesystem hosting is not sufficient.

The [deployment configuration](DEPLOYMENT_GUIDE.md) recommends a non-root Node container behind Caddy HTTPS with a private named volume. Compose syntax validates, but the workstation's Docker Linux engine is stopped/unavailable, so the Linux container, actual proxy/TLS and volume restore have not been validated. A user-approved domain, fresh production credentials, daily cleanup scheduling and successful host checks remain launch gates. Do not call this a completed public deployment or an unconditionally ready public pilot.

Analytics expire 30 days after consent and are removed on access or the operator's daily purge. Feedback expires 30 days after submission; the same purge removes expired responses. This is not an already-installed scheduler. Usage consent can be revoked and history erased through sign-out; feedback receipts delete responses plus their linked feedback/payment-interest events. Separate facilitator notes/backups need the operator's own consent and retention procedure.

Cheapest next step: run facilitated sessions with the local app, record actual misunderstandings and whether missing full costs make the brief unusable. If users need all-in costs, scope a separate **unsigned instruction simulation** experiment using documented SDKs and a free RPC, with explicit permissions/rent assumptions, before buying data or adding execution. Do not reinterpret the current quote estimates as that simulation.
