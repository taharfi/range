# Pool Party API audit

Checked **2026-10-19 UTC**. Conclusion: **no authorized public data API contract was verified**. The supplied `/api` URL returns HTTP 200 but serves the private-beta application gate. This is not evidence that an API does not exist behind membership or through a partnership.

## Evidence and scope

Ordinary, unauthenticated HTTPS reads retrieved the [supplied API URL](https://lppool.party/api), [guide index](https://lppool.party/guide), and the linked leaderboard, profile, privacy, wallet, pool and LP-idea guides. The supplied page's normally linked beta JavaScript component identifies invite-based membership and sign-in. Its session-check route is an internal authentication dependency, not developer documentation; it was **not called**. The homepage returned the same HTML body hash as `/api`.

No data-route guessing, credential use, account creation, wallet connection, signature, restricted-profile access or leaderboard scraping occurred. Public HTML, extracted text, response timestamps and SHA256 metadata are retained in `data/poolparty_audit/`. The web browsing tool could not open Pool Party pages, but normal HTTP requests returned 200; both observations are recorded rather than treating browser-tool failure as a service outage.

## Access inventory

| Requested capability | Verified finding | Integration status |
|---|---|---|
| Available data endpoints | No published leaderboard/profile/position/pool data route verified in accessible documentation. `/api` is HTML with the beta gate. | No callable public data contract established. |
| Schemas / SDK / versioning | No OpenAPI, JSON Schema, SDK, response examples or stable identifiers linked from inspected public documentation. | Unknown; no inferred schema presented as official. |
| Authentication | Website uses member sign-in and invites; its [privacy policy](https://lppool.party/privacy) describes essential session cookies. | Application authentication is documented; API-key/OAuth/service-account access is not. |
| Free / paid | [Terms §10](https://lppool.party/terms) says the read-only beta is not charged for. | This does not establish free API access, export rights, quotas or a commercial API plan. |
| Rate limits / uptime | No developer request quota, burst limit, retry contract or SLA verified. | The roughly 15-minute active-member sync is data refresh cadence, **not** an API rate limit. |
| Leaderboard | [Guide](https://lppool.party/guide/leaderboard) describes up to 100 ranked members, time selectors and four ranking measures. | Website capability documented; retrieval/pagination API unknown. |
| Historical performance | PnL calendar, period summaries and closed-history views are documented. | Historical snapshot/export access and revisions are unknown. |
| Position / pool analytics | Position results and pool views are documented, subject to member visibility rules. | UI data is not automatically public API data. |
| Exports | [Profile guide](https://lppool.party/guide/profile) describes image sharing/downloads. | No machine-readable CSV/JSON bulk export verified. An image export is not an accounting feed. |
| Pagination | Guides describe ten closed-pool groups per load, eight initially displayed open-pool groups, and a top-100 leaderboard. | These are UI behaviors; no cursor, offset, page-size maximum or consistency guarantee verified. |

## Documented financial semantics

The [profile guide](https://lppool.party/guide/profile) attributes portfolio results to Meteora and includes DLMM activity managed through HawkFi. It combines positions closed during the selected period with still-open positions marked at current value. A period summary is therefore not a closed-position-only realized-return series.

Capital is deposits less withdrawals, while the displayed return percentage uses deposited amounts rather than that net capital. Fees include claimed and unclaimed amounts. USD/SOL denomination is selectable; this is not a buy-and-hold benchmark. The closed list offers 7/30/90-day and one-year windows, initially only 30 days while history loads. Grouped pools can expand to individual outcomes. Source pricing timestamps, fee/cost decomposition and reconciliation proofs are not supplied by the guide.

## Privacy and accounting linkage

The [privacy policy §2/§4](https://lppool.party/privacy) says stored closed histories omit wallet and position addresses, while wallet addresses are not publicly displayed. The [visibility guide](https://lppool.party/guide/privacy) describes owner-controlled position visibility and rounded amounts/hour-level times for other members. This prevents an exact public accounting join from being assumed. Do not infer wallet identities by matching rounded balances, timing, social profiles or pool activity.

The [wallet guide](https://lppool.party/guide/wallet) also permits replacing the wallet attached to an account; associated performance and rank change. A stable member ID alone would not establish a stable wallet cohort.

## Reuse and authorization

[Terms §3/§5/§8](https://lppool.party/terms), updated October 1, 2026, describe a read-only service, prohibit unauthorized access and burdensome scraping, and limit the offered use license. They do not provide an affirmative research-data redistribution license. Automated research access, archival retention, aggregation, commercial comparison and any identity linkage need an explicit applicable API agreement or provider permission. This is an integration prerequisite, not a conclusion that all ordinary viewing is forbidden.

**Sample collected: 0 profiles, 0 leaderboard rows, 0 wallet mappings, 0 position benchmarks. External spending: $0.** See `audit_summary.json` and `leaderboard_sample.json` in the evidence directory. Their empty rows record blocked collection, not an empty leaderboard.

## Questions to resolve with the provider

Request developer documentation, permitted research/export scope, exact authentication, quota and pricing; stable opaque identifiers and wallet-change epochs; ranking windows/timezone/ties; eligibility and sync timestamps; closed-position retention and revision policy; USD/SOL pricing provenance; claimed/unclaimed fee treatment; HawkFi look-through accounting and observable costs; and a consent-based verification option for positions already supplied by their owners. No outreach has been sent.
