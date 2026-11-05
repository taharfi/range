# RANGE — three-screen UX changelog

## 2026-10-23 - Summary independent of browser pages

- Server aggregation now owns wallet coverage and range/value totals; five-row cursors replace browser-side accumulation for live wallet requests.
- Independent pending/ready/failed aggregation states preserve explicit partial coverage. Next/previous pages keep the same wallet summary; refresh starts a new snapshot and preserves the active workspace tab.
- Added current reference liquidity/unclaimed-fee analytics, USD/SOL display, pricing timestamps and coverage. Principal excludes fees/rewards; unavailable/stale components do not become complete totals.
- Replaced the aggregated-wallet Performance placeholder with supported current-value analytics. Historical P&L, deposits/withdrawals and realized fee income remain explicitly unverified.
- Added durable, cached selected-position event checkpoints without wallet-wide history scans. Existing invitations, consent controls, quote arithmetic, Position/Decision navigation and read-only behavior remain.
- [Implementation report](PORTFOLIO_AGGREGATION_REPORT.md), [live evidence and screenshots](pilot/evidence/aggregation/README.md).


## 2026-10-22 - Portfolio terminal workspace

- Audited and reused the existing portfolio, position, decision, invitation and quote paths.
- Added a wallet command header, responsive snapshot/accounting coverage, collapsible deterministic attention queue and open-position search/filter/sort with list/card views.
- Added guarded source-reported closed-position pagination and date-grouped position activity with transaction links. Amounts remain token-denominated; current marks and API P&L are excluded. Historical completeness and independent closure verification are never claimed.
- Added source-reported open position age and explicit per-row freshness, with raw inventory and boundaries in expandable facts.
- Added an honest Performance unavailable state. No invented chart, capital-weighted allocation, fee threshold or health score.
- Retained the existing Position -> HOLD / REBALANCE / EXIT workflow, financial caveats, privacy controls and no-deployment boundary.
- Visual review reduced the attention queue to an expandable summary, corrected rendered separators and verified new mobile explorers. [Implementation report](PORTFOLIO_TERMINAL_IMPLEMENTATION.md), [screenshots and verification](pilot/evidence/terminal/README.md).


## 2026-10-22 ? Visual portfolio overview

- Added a responsive SVG ring showing loaded positions by in-range, out-of-range and unknown status. Equal weight per position; no valuation, allocation or performance inference. Unknown observations retain a separate segment; an empty portfolio leaves the ring unfilled.
- Added token-initial monograms (not verified token logos), stronger pair identities, larger range bands and clearer pool-price markers. No external image requests or extra dependencies.
- Kept the compact list, financial limitations, source freshness, pagination, keyboard navigation and existing decision flow. No backend or accounting changes.
- Validation: 51 unit tests and all 25 browser/API tests passed; production build/TypeScript and secret scan passed. Live wallet returned nine positions with no browser errors or overflow at 1440/834/390/320px. Reviewed actual desktop and mobile screenshots. Browser regression now verifies the unknown range segment and accessible count description.
- [Visual captures](pilot/evidence/portfolio-visual/README.md); prior simpler design retained below.

## 2026-10-22 ? A quieter portfolio

- Inspired by the reference's wallet summary and position list, using RANGE's own typography, charcoal/lime palette and geometric identity.
- Three observed counts: loaded open positions, in-range positions and out-of-range positions. Unknown range status is explicit and never counted as inside or outside.
- Compact selectable rows: pair, abbreviated position identifier, range boundaries/status and unclaimed token fees. Removed the repeated unavailable-USD column; one contextual valuation limitation remains visible.
- No invented net worth, profit chart, win rate, historical totals or closed-position tabs. Fees are labeled as token amounts, not profit. Coverage, missing data, stale observations and pagination remain explicit.
- Preserved refresh, accumulated pages, selection/focus/scroll restoration, invitation controls and Position ? Decision navigation. No API, accounting, dependency, consent or security changes.
- Reviewed actual demo and live pages at desktop and mobile sizes. Narrow layouts keep Refresh beside the wallet identifier rather than squeezing the title. Desktop rows reduced from 112px to 84px minimum; mobile rows use a focused two-column layout with a navigation arrow.
- Evidence: [before/after and live captures](pilot/evidence/portfolio-simple/README.md).

Validation for the compact portfolio: **72 research tests, 51 unit tests and 25 browser/API tests passed**. Production build and secret scan passed. Live lookup returned nine positions with zero browser errors; checked 1440/834/390/320px widths with no overflow.

## Previous three-screen redesign

Implemented locally, 2026-10-20. Replaced the long dashboard architecture; no public deployment or production-secret changes.

- **Search:** wordmark, one wallet/position field, Analyze and Try Demo. No session/analytics request or controls before user intent. The existing invitation/optional-consent gate opens after Analyze when required, then resumes the pending lookup. It remains server-enforced.
- **Position:** one selected position, optional position selector, pair/range status, USD-value availability, unclaimed fees and compact range diagram. No raw inventory, bin IDs, pool TVL, technical metadata or action panels. Compare options opens a separate screen.
- **Decision:** HOLD / REBALANCE / EXIT tabs render exactly one action panel. Switching actions uses the cached brief without new quote requests. Back to position preserves the selection. Raw quotes, slippage, metadata, settings, assumptions and feedback start collapsed.
- Removed the previous overview/settings/card stack, onboarding controls and duplicated page sections. Replaced accumulated dashboard CSS with a screen-based layout using the existing tokens, Geist fonts, vector identity and a 900px maximum content width.
- Automatic address lookup uses the existing wallet endpoint first. Only a successful, empty, warning-free result tries the verified PositionV2 endpoint. Upstream failures stay errors; unsupported-account responses remain explicit coverage warnings. No backend API schema or accounting logic changed.
- USD value remains unavailable because the adapter supplies no independently validated USD mark. No dollar value is inferred from pool TVL or a stablecoin symbol. Fees/rewards remain separate from principal; quotes retain full precision internally and in details/exports.
- Action-specific missing costs, stale data and material data-quality restrictions stay visible. HOLD's zero immediate transaction cost applies only to doing nothing. Swap outputs are estimates, not guaranteed fills; essential missing components prevent a complete execution-cost total.
- Default live settings remain USDC exit, 50% token X by pool value and 50 bps slippage cap. Edited settings are marked unapplied until quotes refresh. Source timestamps and exact minimums are retained in technical details.
- Preserved invitation codes, HttpOnly sessions, consent/deletion, rate/input/origin limits, provider proxies and read-only behavior. Feedback remains optional and has separate storage consent. No addresses or new preferences are persisted in browser storage.

Before/after and desktop/mobile evidence: [screenshots](pilot/evidence/progressive/README.md). The prior UX changelog is archived beside the captures.

**Validation: 72 research tests, 29 unit tests and 11 browser/API tests passed; production build, TypeScript, secret scan and 1,013-file evidence integrity check passed.** Real wallet and direct-position browser probes both returned data and quoted both actions with zero page errors. Desktop and mobile screenshots were visually reviewed; the default Position CTA fits the 900px desktop viewport.  Initial QA found a React sibling-key collision that duplicated the action panel on timestamp updates; distinct keys fix it and a delayed single-panel assertion covers it. An erasure assertion now waits for the completed logout response before reading isolated fixture storage.

Remaining limits: no validated USD mark, full execution-cost total, withdrawal simulation or historical profitability. Physical-device/screen-reader and genuine-LP usability testing remain outstanding. Expanded technical/feedback sections and large portfolios may scroll; default screens target one viewport. Prior public-release operational gates remain unchanged.


## 2026-10-22 ? Open portfolio entry point (Phase 1)

Wallet lookup now opens a compact portfolio before position detail. Pool/position pages accumulate with deduplication and scoped coverage; previously displayed observations and their matching handles are retained until an explicit refresh. Rows show token pairs, range status, unclaimed fees and a compact diagram. USD values remain unavailable. Returning from detail restores rows, selection, keyboard focus and scroll. Direct position input, demo labeling, invitation controls and existing Decision analysis remain. Expired position handles recover on Compare with explicit update copy. Closed positions, history, lifecycle replay and P&L are deferred. See PORTFOLIO_PHASE1.md for validation and evidence.
