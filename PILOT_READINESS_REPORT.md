# LP Exit Intelligence pilot readiness

Validated **2026-10-20**. **Application checks pass locally; the public pilot is not cleared for launch.** No public domain was deployed, transactions executed, subscriptions purchased, or testers recruited. The remaining release gates are listed below.

## Audit and corrections

| Finding | Change and evidence |
|---|---|
| Editing the search address could leave the previous wallet's comparison visible | Clear the prior position and brief on input/type changes; browser regression coverage. |
| Live routes lacked invitation admission and sufficient resource bounds | Signed opaque HttpOnly/SameSite session cookie, invitation-only live access in public mode, origin checks, bounded request bodies/provider responses, timeouts, request limits, two concurrent expensive operations and finite provider queues. Public HTTPS adds Secure cookies. |
| Public hosting could lose feedback/session state or expose credentials | Single persistent Node instance configuration; server-only provider adapters; private volume, runtime-only secrets, placeholder-rejecting readiness, Docker context/tracing exclusions. Sessions intentionally require login again after restart. |
| Free text could accidentally collect sensitive information | Removed the comment field and reject nonempty free text server-side. Feedback contains structured answers and pseudonymous invitation identity, without attaching the searched wallet. |
| Analytics were insufficient for the proposed pilot | Separate unchecked usage consent; deduplicated lookup/comparison/feedback/return/payment-interest events, aggregate operator report, erasure and 30-day expiry/purge tooling. No claim that invitation identifiers prove genuine LP ownership. |
| Zero inventory could incorrectly show a requested rebalance weight as achieved | Show actual achieved weight, or unavailable when no portfolio value exists; unit coverage. |
| Quotes might imply an all-in execution price | Prominent unavailable full-cost warnings; conditional principal-only outputs; separate fees/rewards; output fees never deducted twice. Negative price impact is described as a quoted improvement, not verified savings. |
| Synthetic fixtures could be mistaken for observations | Explicit synthetic labels and no automatic fallback. Example mode cannot produce research feedback or counted comparisons. Live probes use real providers separately. |

The interface now presents a clear search, indexed position summary, comparable HOLD/REBALANCE/EXIT cards, absolute UTC quote receipt times and age, fee/slippage details, cost gaps and structured optional feedback. Mobile checks exercise stacked cards at 320, 390 and 768 pixels. No automation, signing, copytrading, AI agents, or new product scope was added.

## What the values mean

| Classification | Values |
|---|---|
| Live provider data | Meteora indexed principal inventory, range, pool price and available fee fields; independently checked SPL mint decimals; Jupiter read-only quote outputs, fee fields, impact and returned slippage protection. Receipt timestamps are local and do not imply same-slot observations. |
| Conditional estimates | Principal available after a successful withdrawal; conversion outputs from independent quotes; rebalance size/achieved composition valued at the current pool mark. Quotes are neither guaranteed fills nor an atomic withdrawal/swap/redeposit. |
| Unavailable | Verified immediate withdrawal availability; complete withdrawal, fee/reward claim, redeposit/range-change, rent and network costs; full execution cost total; historical USD profitability. No-payer zero fee fields remain unknown. |
| Synthetic | Explicit example mode and intercepted browser fixtures only. They never substitute for provider failures. |

HOLD has zero immediate transaction cost only because it performs no action; it still carries inventory and range risks. No card predicts returns or selects an optimal action. See [MVP limitations](MVP_LIMITATIONS.md).

## Executed quality checks

| Check | Actual result |
|---|---|
| Research regression suite | **72 passed** |
| Pilot unit suite | **24 passed**, including precision, quote validation, zero inventory, consent/deletion, finite limits and public configuration rejection |
| Browser/API suite | **7 passed** on isolated standalone servers; invitation denial/acceptance, optional analytics, deduplication/erasure, headers, body limits, cross-origin errors, feedback, partial failures and mobile overflow checks |
| Production Next.js standalone build | **Passed**, including TypeScript validation and browser asset packaging |
| Browser artifact secret check | **11 files scanned; 11 configured private values checked; 0 matches; 0 named private artifacts copied**. This is a targeted check, not proof against every possible leak. |
| Production dependency audit | **0 reported vulnerabilities** from `npm audit --omit=dev`; not a penetration test |
| Health/readiness | HTTP 200 locally; all staging configuration and writable-path checks true. Upstreams explicitly not probed by health. |
| Live SOL/USDC wallet/direct position/brief | **HTTP 200 / 200 / 200**; one open position; no lookup warnings; exit and rebalance quoted |
| Live browser | Lookup and brief HTTP 200, comparison rendered, **0 page errors** |
| Mobile | **320 / 390 / 768 px** overflow assertions passed; inspected captured 390 px layout. Layout fixtures are synthetic. |
| Financial evidence preservation | **1,013 protected files unchanged** against the existing manifest |
| Compose syntax | `config --quiet` passed with the placeholder template; this does not validate credentials or runtime |
| Docker runtime | **Blocked:** Docker CLI exists but the Linux engine named pipe `dockerDesktopLinuxEngine` is unavailable. Image build/runtime, Caddy/TLS and persistent-volume restore were not exercised. |

There are no failing automated assertions in the completed suites. Container/proxy/restore validation is incomplete, not a passing check. No actual phone hardware, internet-facing load test, external security review or real-user comprehension test was performed.

Real provider evidence: [API output](pilot/evidence/live-smoke.json), [browser output](pilot/evidence/browser-live-smoke.json), [live screenshot](pilot/evidence/live-interface.png). The sample position is [BrVyh2…QtZp](https://solscan.io/account/BrVyh2knHr83iQB4yPCHd6q5KRbJDPjqXpeAgfjeQtZp), in SOL/USDC pool `5rCf1DM8LjKTw4YqhnoLcngyZYeNnQqztScTogYHAS6`. The API probe began at **2026-10-20T13:25:10.621Z** and the browser probe at **13:25:41.371Z**. Captured values are test-time observations, not current executable offers. Usage consent was off; the existing public research sample is not a recruited tester.

## Recommended deployment and release gates

Use the supplied **single Node 24 standalone instance behind Caddy HTTPS**, with one private persistent volume. Avoid ephemeral serverless hosting and replicas for this pilot. Loopback bindings are the default. [Deployment guide](DEPLOYMENT_GUIDE.md), [production environment template](pilot/.env.production.example), [security checklist](SECURITY_CHECKLIST.md).

Before public testing:

1. Restore a working Linux Docker engine/approved host and rehearse image startup, reverse proxy, HTTPS/Secure cookies and canonical-origin behavior. Record/pin release image digests.
2. Verify private volume survival, permissions and backup restore; install and verify daily retention cleanup. These are operational gates, not completed by writing configuration.
3. Configure a fresh strong production secret, ten production-format random invitations and an approved HTTPS hostname. Local staging codes are not production credentials.
4. Obtain the user's approval before public domain/listener deployment. No approval is implied by this report.
5. Repeat read-only live, mobile, consent/erasure and rate-admission checks through the actual deployed proxy before inviting LPs.

No application-level critical defect remains identified by the completed review, but the untested production boundary prevents an unconditional safety claim. Local facilitated testing can continue with the cost limitations explained. Public testing remains blocked until the gates above pass.

## Pilot measurement status

Actual stored feedback: **0**. Consenting usage identifiers: **0**. Verified LP testers, useful-insight responses, return visits and credible paid commitments: **0**. Automated fixtures and live sample probes are excluded. Explicit survey willingness to pay is recorded separately from evidence of a paid commitment. Thresholds remain hypotheses: 10 genuine LPs, 6 useful insights, 4 returns and 2 credible willingness-to-pay demonstrations.

External service spending: **$0**. Hosting has not been provisioned, so no validated hosting bill or capacity guarantee is available. Free-provider rate limits remain an availability risk; no subscription is required by the current implementation. Use [tester onboarding](TESTER_ONBOARDING.md) after release checks, and follow [PILOT_PLAN.md](PILOT_PLAN.md) without inventing responses.
