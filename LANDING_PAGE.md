# RANGE homepage

The local product homepage is at `http://127.0.0.1:3000/`. **Open App** leads to the existing Search → Position → Decision experience at `/app`. No public deployment was performed.

The homepage is a static server-rendered page: no position requests, analytics, wallet connection or invitation request occurs while browsing it. Live analysis still requires the existing invitation flow. The public introduction does not authorize access to private pilot data.

The composition uses RANGE's existing SVG identity, locally hosted Geist fonts, charcoal and lime tokens. A restrained two-column hero pairs editorial typography with a compact position preview; mobile uses a single column. Three short steps and a disclosure-based methodology footer complete the page.

**Preview data is illustrative, not live.** Its SOL/USDC range and prices are synthetic design examples. No position value, earnings, performance or complete execution cost is advertised. Actual financial calculations, API handlers, rate limits and consent controls are unchanged.

## Implementation

- `pilot/app/page.tsx`: public homepage and illustrative preview.
- `pilot/app/landing.module.css`: scoped responsive styles; existing app styles are preserved.
- `pilot/app/app/page.tsx`: application route wrapper.
- `pilot/app/components/RangeApp.tsx`: existing application moved with relative imports adjusted; behavior unchanged.
- `pilot/e2e/landing.spec.ts`: navigation, keyboard access, narrow layouts, static-page behavior and private API protection.

Run `npm run build`, `npm test` and `npm run test:e2e` from `pilot/`. Start locally with `npm run start -- --port 3000`. Research regression tests run from the repository root with `.venv/Scripts/python -m pytest -q`.

## Validation — 2026-10-21

- Production build passed; `/` and `/app` are prerendered, API routes remain dynamic.
- Research regressions: 72 passed. Pilot unit tests: 29 passed.
- Browser/API tests: 13 passed, including public homepage/private API separation and invitation access.
- Build audit: zero configured secret matches in browser assets; zero private artifacts copied.
- Research integrity check: all 1,013 protected evidence files unchanged.
- Live read-only `/app` check: one position retrieved, exit and rebalance quotes returned, no browser errors. This is integration evidence, not validation of financial advice or complete execution costs.

Desktop, tablet and mobile captures are stored in `pilot/evidence/landing/`. The pre-existing application captures remain in `pilot/evidence/progressive/`.

The homepage preserves the pilot's `noindex` metadata. Branding remains provisional. Official documentation links are references, not endorsement claims. No public deployment, API purchase or production secret change was made.
