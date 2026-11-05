# RANGE design audit

Audit before UI edits, 2026-10-20. Scope: existing read-only Next.js pilot. The name is provisional; no trademark or domain availability is claimed.

## Current weaknesses

- The generic arrow mark and light green rounded cards do not express position ranges or a recognizable identity.
- Search is clear, but the oversized marketing headline competes with the task. Invitation access appears after a disabled search without a strong visual connection.
- Inventory, quote output and contextual data have inconsistent numeric typography. Small disclosure text and long card paragraphs slow comparison.
- Position range is only two numbers and bin IDs. Users must mentally locate the current pool price relative to those boundaries.
- Similar rounded boxes and status pills flatten hierarchy. Unavailable full costs deserve stronger placement than tertiary footnotes.
- Mobile stacking works, but long scenarios and the feedback form make a tall page. Clear section numbering and deliberate spacing will improve orientation without hiding financial caveats.
- Loading/error/empty/stale states exist, but lack a shared visual language. Focus styles exist; keyboard and reduced-motion behavior must survive the redesign.

## Implementation direction

Use a dark mineral canvas, rectangular surfaces, quiet hairlines, lime range boundaries and warm amber uncertainty. Set Geist UI and Geist Mono locally with tabular values. Build a boundary symbol and custom vector wordmark, reusable section/status primitives and a range diagram. Distinguish indexed observations, quote receipts and missing cost components through labels, not color alone.

Keep search, position overview, range, scenario controls and three comparable actions in one column of work. No sidebar, new financial model, default recommendation, decorative chart or inferred profitability. The range diagram must show actual supplied boundaries/current price only; missing/invalid values show unavailable, and out-of-range markers must not imply the price lies inside the position.

## Acceptance review

Capture before/after landing and example states, then inspect desktop, tablet and mobile. Exercise keyboard focus and invalid, empty, loading, unsupported/provider failure and stale quote states with labeled fixtures. Run all research, unit and browser/API tests plus production build and secret scan. Record failures and refinements here after implementation. No public deployment or production secret changes.

## Implemented review and refinements

- Introduced token-driven dark surfaces, local Geist/Geist Mono, custom vector symbol/wordmark/favicon, shared icons, section headings and status/range components. No API route, consent schema, pricing rule or financial calculation was changed.
- Reviewed actual rendered desktop landing, position/range and three-action comparison; mobile range/fees/scenario details; tablet full flow; out-of-range, missing-range and stale-quote states. Also captured loading, empty, invalid and provider-error states. [Before/after evidence](pilot/evidence/design/README.md).
- Increased small-type sizing after desktop inspection. Removed the browser's decorative outline around the programmatically focused main landmark while retaining visible focus on all interactive controls and working skip navigation. Enabled tabular lining figures explicitly.
- Set mobile form fields to 16px to avoid focus zoom. Changed the tablet comparison breakpoint to 1000px after the 834px capture showed cramped three-column cost details. Increased control border contrast independently of decorative dividers.
- Moved pilot access before the search so invitation-only users see why access is needed before reaching disabled inputs. The optional usage checkbox remains unchecked; neither consent nor admission behavior changed.
- The range uses decimal-derived percentages solely for drawing, includes outside prices in its domain and falls back to unavailable for invalid data. It never presents an outside price as inside the range. Boundary/price labels are display-rounded; original model quantities remain unchanged.

## Validation and corrected failures

The initial build caught a TypeScript value/type annotation in the new diagram; corrected using the decimal constructor's instance type. The first browser run had two assertion failures: the old headline expectation and a new generic alert selector matching Next's route announcer. Updated the intentional branding expectation and scoped the alert by its message. Existing financial/security assertions were retained. The subsequent run passed all nine browser/API tests.

Research regression suite: **72 passed**. Pilot unit suite: **24 passed**. TypeScript and production standalone build pass. Post-redesign browser secret scan: **14 files**, **11 configured values checked**, **0 matches**, **0 named private artifacts copied**. Financial integrity check: **1,013 protected files unchanged**. The real read-only SOL/USDC browser probe returned HTTP 200 for position/brief, rendered both quotes and recorded zero page errors; no usage consent or tester outcomes were recorded.

## Remaining UX and release limits

This is Chromium viewport and keyboard QA, not a screen-reader certification or physical iOS/Android test. No genuine LP usability sessions have yet been conducted. Long financial caveats and feedback make the mobile flow tall; they remain visible rather than being hidden to improve screenshots. The diagram shows boundaries, not per-bin depth. Quotes still expire, indexed data may lag, and full withdrawal/redeposit/network costs remain unavailable. All previous public-release gates (container/proxy/TLS/persistence rehearsal, production credentials, cleanup and deployment approval) remain; this design sprint does not clear them.

Calculated contrast checks for core pairs: primary text/surface **14.13:1**, muted text/surface **6.37:1**, control boundary/surface **3.06:1**, dark text/accent button **14.22:1**. These limited pair checks are not a complete accessibility audit.
