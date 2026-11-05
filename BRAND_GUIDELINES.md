# RANGE — brand guidelines

Working name: **RANGE**. Wordmark: **range.** Tagline: **Know your position.** Descriptor: Liquidity intelligence for Meteora LPs, with Jupiter-powered execution analysis. The name is provisional; no domain purchase, trademark search or availability claim has been made. This is an independent pilot, not a claim of Meteora/Jupiter endorsement.

## Identity

The [symbol](pilot/public/brand/range-symbol.svg) uses two price boundaries, a shared horizontal axis and a current-position tick. The [wordmark](pilot/public/brand/range-wordmark.svg) is custom vector lowercase lettering with squared stroke terminals and a small lime terminal dot. Both are paths, with no font dependency. The [favicon](pilot/app/icon.svg) simplifies the symbol on the canvas color and is served by Next's icon route.

Keep the symbol at least 24px tall and the wordmark at least 100px wide. Leave clear space of half a symbol height around the combined mark. Use the full wordmark in the application header and the symbol for compact contexts. Do not stretch, rotate, add shadows/gradients or incorporate ecosystem logos. The UI header uses currentColor; standalone exports are light-on-dark. Use the existing icon geometry: 24-unit grid, 1.5-unit strokes, square ends and no decorative containers. Icons supplement visible labels; they do not replace them.

## Color and typography

| Role | Token | Value |
|---|---|---|
| Canvas | `--color-canvas` | `#101619` |
| Surface | `--color-surface` | `#1B2529` |
| Text | `--color-text` | `#F2F4F1` |
| Secondary text | `--color-muted` | `#9BA8A7` |
| Primary action / boundaries | `--color-accent` | `#C5F27C` |
| Uncertainty / unavailable costs | `--color-warning` | `#E9B86B` |

Geist is the UI face; Geist Mono is for token values, addresses, timestamps and identifiers. Fonts are self-hosted through `next/font/local`; no browser font-service requests are needed. Latin WOFF2 subsets were copied from the installed Next 16.4.2 font assets, with upstream [OFL](https://github.com/vercel/geist-font/blob/main/OFL.txt) and [license notice](https://github.com/vercel/geist-font/blob/main/LICENSE.txt) retained in `pilot/app/fonts/`. No third-party illustrations or generated images are used.

All UI colors, font stacks, text sizes, spacing, radii and transition timing originate in [tokens.css](pilot/app/tokens.css). Use the 4px spacing family, hairline divisions and 3–4px corners. Controls use a stronger boundary token than decorative dividers. Reserve rounded geometry for genuine circular controls/loading indicators. Numeric values use tabular lining figures. Do not animate values or imply market movement with decorative sparklines. Font license copies also ship in `public/brand/GEIST-OFL.txt` and `GEIST-LICENSE.txt` with the standalone application.

## Product grammar

Use three distinct screens: Search, Position and Decision. Decision tabs show one HOLD, REBALANCE or EXIT panel at a time. Core content stays within a 900px maximum width; sources/settings are expandable. No sidebar, stacked dashboard sections or side-by-side analysis cards. Use explicit source/quality labels, sentence-case headings and concise verbs. Lime indicates boundaries/actions, not a profitable recommendation. Amber means a limitation requiring attention; color is always accompanied by text.

The range diagram has a linear price axis, actual supplied boundaries and current pool price. Its domain includes out-of-range prices with padding; it does not clamp an outside price into the range. Legend labels are rounded for display. It is neither a historical chart nor a liquidity distribution. If values are missing/nonfinite/nonpositive or boundaries invalid, show an unavailable state. Monetary calculations are unchanged by this presentation layer.

## Voice and states

Say “indexed inventory,” “quote received,” “conditional estimate” and “unavailable.” Avoid “optimal,” “guaranteed,” “profit” and complete-cost claims without evidence. Current API observations are not described as fully independently observed on-chain balances. Network estimates and withdrawal/redeposit gaps stay separate from quote fees; never show a total with essential missing components.

Loading uses a labeled status with a small spinner. Invalid input/provider failures use an alert; empty results explain that missing indexed positions do not prove zero liquidity. Stale quotes use explicit age and refresh language. Unsupported range data shows an explanation instead of invented geometry. Keyboard controls retain visible focus and a skip-to-search link. Reduced-motion preferences disable transitions/spinners; mobile form fields use 16px text to avoid focus zoom. Optional usage and feedback consents remain unchecked and separate.

## Implementation and review

Reusable identity/range UI lives in [RangeUI.tsx](pilot/app/components/RangeUI.tsx); [Decision.tsx](pilot/app/components/Decision.tsx) owns action tabs, the selected analysis and technical disclosures. Financial behavior remains in the existing adapters. [Current UX changelog](UX_CHANGELOG.md) and [screenshots](pilot/evidence/progressive/README.md) distinguish real-provider observations from synthetic examples and fixtures.
