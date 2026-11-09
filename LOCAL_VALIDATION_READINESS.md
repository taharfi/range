# RANGE local validation

Client date: 2026-11-09. The user confirmed that no LP testers are ready and requested local preparation. This is engineering rehearsal, not user-demand evidence. No deployment, new telemetry, signing, execution or subscriptions were added.

## What to try locally

1. From `pilot/`, run `npm start` after a successful production build. Open `http://127.0.0.1:3000/app` on this computer. Use the existing local invitation; never share the environment file or publish access codes.
2. Analyze the public sample wallet `ACUvKyTc7dEwR8oMqUZd5xpj19osaFZoXPauuy52adQM`. Its positions change over time; it is not a recommendation or proof that you own it. Portfolio discovery and valuation happen on the server. Rows are paginated independently of the wallet summary.
3. Open an available supported position. Check its range, principal and unclaimed fees. Individual USD estimates now use the same decimal-aware arithmetic and eligibility/freshness gates as portfolio values. A missing nonzero token price makes that position's principal estimate unavailable; an independently priceable fee component can remain available. Fees are never added to principal.
4. Expand **Valuation sources** to inspect Jupiter Price V3 source times. These are market references, not liquidation proceeds or historical profitability. Neither a stablecoin peg nor a current price is used to manufacture missing historical values.
5. Let the observations expire. An expired reference becomes unavailable; **Refresh position** requests fresh inventory and prices and issues new server-owned quote handles. A failed price request cannot erase an otherwise valid position or leave its previous USD estimate presented as current.
6. Choose **Compare options**. HOLD does not execute anything. REBALANCE estimates a token-mix swap, not a full DLMM range migration. EXIT quotes conversion of the available inventory. Network, withdrawal, claim, redeposit and other excluded costs remain explicitly unavailable where unobserved. A quote is not a complete execution-cost total.
7. Switch actions, refresh an expired decision and return to the portfolio. Check that selection is preserved and old observations are not silently relabeled as fresh.
8. Try **Demo** separately. It remains synthetic, with no live position valuation. Do not submit invented feedback as a participant or enable optional measurement merely to generate counts.

Keep automatic measurement off during personal rehearsal unless you intentionally consent. No new manual study records should be stored until the privacy responsibilities in [the measurement specification](PILOT_MEASUREMENT_SPEC.md) are approved. Real study notes, wallets, contact mappings and recordings do not belong in GitHub.

## Technical changes

- Current portfolio marks are attached compactly to each returned position, rather than fetching all wallet data in the browser or requesting each token price per row. Each position carries at most its two token marks.
- Direct lookups and refreshes acquire fresh marks and replace both the valuation and server-owned snapshot handle. Pricing failure leaves coverage reasons instead of inventing a value.
- Source-slot timestamps are resolved in RPC chunks of at most ten. One failed chunk only removes freshness validation from that chunk. Shuffled JSON-RPC replies are mapped by ID within each chunk. The existing provider pacing remains unchanged.
- The ten-item bound follows [Helius historical batch documentation](https://www.helius.dev/docs/billing/rate-limits), checked for this continuation. Freshness still requires the existing 120-second observation window and 30-second future tolerance; neither was relaxed.
- Position facts now distinguish historical performance from current valuation. Historical USD P&L remains unavailable without validated cash flows, historical prices and allocated costs.

## Reproducible checks

From `pilot/`:

```powershell
npm test
npm run build
npm run test:e2e
npm run audit:build
# Requires the local server and configured private environment:
npm run pilot:preflight -- 2026-11-09
```

From the repository root:

```powershell
.\.venv\Scripts\python.exe -m pytest -q
python -m unittest scripts/test_safe_github.py -q
```

Synthetic browser screenshots are under ignored `pilot/var/local-validation/`; live preflight output is under ignored `pilot/evidence/pilot-preflight-2026-11-09/`. Synthetic screenshots validate rendering and interactions, not real prices, participants or outcomes. Runtime outputs and credentials remain local.

## Executed results

- 99 pilot unit tests passed. The four new pricing tests also passed after the final provider-failure classification change.
- All 41 browser/API tests passed. The position-value browser regression passed again against the final production build after the typography correction.
- 82 research regression tests and six publishing-safety tests passed.
- Final production build and TypeScript checks passed. Browser build audit scanned 15 files against 12 configured secret values: zero matches and zero copied private artifacts.
- Live read-only preflight passed on the final build. It found one indexed, owner-matched SOL/USDC position (verification slot 467365303), refreshed it, and returned live EXIT and REBALANCE quotes. The captured principal reference was approximately $196.44 and separate unclaimed fees $3.62, rounded down for display. These are point-in-time market-reference estimates, not current promises, realized earnings or net P&L. Both price marks had source timestamps and passed the existing freshness checks at capture.
- Twelve live screenshots covered Search, Portfolio, Position and all three decision tabs at 1440/390 pixels. Zero page errors or horizontal overflows were observed. Position render checks also covered 834/320 pixels. Desktop/mobile images were visually inspected; the current-value text was enlarged to match the financial hierarchy.
- Usage measurement stayed off and feedback remained unsubmitted. Neither automated test activity nor these sample-wallet figures count toward genuine LP validation.

## Gates that remain open

There are no newly recruited testers or genuine interviews in this continuation. Use [the existing facilitator pack](PILOT_FACILITATOR_PACK.md) when testers become available: ten genuine LPs; proposed thresholds of eight unaided useful comparisons, six useful new insights, four voluntary useful returns and two credible priced commitments. Those are hypotheses, not results. Keep unsupported cases and nonresponses visible.

Explore, Intelligence and Lab remain deferred until the relevant user-demand and data-quality gates are met. One reconciled closed-position evidence view is not a complete historical index, validated historical backtest or trustworthy USD profitability series. Remote hosting still requires a reviewed persistent single-process operating model, privacy approval, runtime/TLS/storage rehearsal and explicit deployment authorization.
