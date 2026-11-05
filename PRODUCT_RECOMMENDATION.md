# Product recommendation: validate a cost-aware LP decision brief

Research date: **2026-10-20**.

**Recommendation: test a narrow LP Decision Engine through a manual, read-only pilot. Do not commit to a full product or another data-infrastructure phase.** Its 66.5/100 score narrowly exceeds automation's 65.0; that difference disappears under a small scoring change. None of the four opportunities is yet shown to be fundable or to have paying demand. [Evidence and scoring](OPPORTUNITY_SCORECARD.md).

## 1. Strongest supported problem

Active LPs report difficulty deciding and acting when inventory moves out of range: they manually rebalance, miss exits while away and struggle to interpret token outcomes. This is supported by dated first-person accounts, rather than inferred from marketing. The reported losses are **not** independently verified. [Manual handling discussion](https://proposals.meteora.ag/t/auto-swap-when-out-of-range/1153), [inventory outcome request](https://proposals.meteora.ag/t/token-balance-at-liquidity-thresholds/731).

The present unmet problem is less certain: these requests are mostly from 2024–25 and automation already exists. The research supports **the historical pain**, not a claim that users currently lack solutions. An especially concrete analytical concern is interpreting trailing fees divided by changing current liquidity. [User request](https://proposals.meteora.ag/t/suggestion-to-upgrade-dlmm-ui-chart-of-tvl-fees-volume-changes-over-time-periods/873/1). Our sampled concentration and fee variability corroborate the need for context, not a purchase decision. [Offline results](data/opportunity_validation/offline_analysis.json).

## 2. Target user

An active, self-directed Meteora DLMM LP who already manages several positions, can show a recent exit/rebalance decision, and wants to retain signing control. Start with opt-in SOL/USDC users to constrain token valuation and liquidity risks. **This is a recruitment hypothesis**, not an identified customer cohort or market-size estimate. Avoid initially targeting passive users who are already satisfied with a managed vault, or users seeking guaranteed yield.

## 3. Existing alternatives

Meteora Dynamic Terminal provides charts, native range management and entry/exit tools. HawkFi offers automated models and Laboratory comparisons; Tidepool offers Jupiter-powered position actions; LP Agent offers automated/copy workflows and transaction checks for closed copies. Pool Party offers performance-oriented profiles. Revert, outside Meteora, demonstrates explicit hold/cost accounting. [Verified feature/pricing comparison](COMPETITOR_LANDSCAPE.md).

Buying or learning an existing tool may be the best user outcome. A generic pool dashboard, wallet leaderboard, zap bot or HODL chart would duplicate documented functionality.

## 4. Specific candidate missing capability

A single **evidence-backed exit/rebalance brief** that makes the user's actual token objective explicit and compares:

- Keep the present inventory/range, with no promised future fees.
- Withdraw to the two tokens, showing claimable fees separately.
- Withdraw and convert to the chosen token using a current amount-specific Jupiter quote.
- Rebalance only when its additional conversions, network costs and capital requirements are disclosed.

Every amount should distinguish observed balances, quoted proceeds, uncertain costs and unavailable historical information. Show quote timestamp, remaining token mix, fee/rent treatment, and links supporting each observed transaction. Label any fee-recovery horizon as a scenario using an explicitly assumed fee rate, never a forecast.

**This bundle is not confirmed absent across competitors.** Tidepool already documents swap/gas/rent visibility in its review flow. [Docs](https://tidepool.ag/docs). LP Agent explicitly describes incomplete arbitrary-wallet attribution while documenting stronger checks for its own copied positions; that is a scoped coverage limitation, not proof that its accounting is poor. [Methodology](https://docs.lpagent.io/data-methodology). Test existing alternatives with each participant before treating the brief as a differentiated capability.

## 5. Why Jupiter and Meteora could benefit

Jupiter contributes amount-specific executable conversion choices, rather than a logo or generic USD price. Meteora contributes the actual position/range/inventory context. Better decisions could reduce confusing entry/exit experiences and eventually produce appropriate, user-approved swaps. Neither retention improvement nor incremental volume is measured yet. Current Jupiter quotes cannot establish past profitability. [Integration map and transparent volume scenario](ECOSYSTEM_INTEGRATION_MAP.md).

## 6. Smallest MVP that tests demand

Run a **two-week concierge experiment with ten opt-in active LPs**, using a spreadsheet or written brief and existing research utilities. No frontend, autonomous execution, new indexer, paid API or open-ended historical backfill. This describes the next experiment; nobody was contacted or enrolled in this research task.

1. Ask participants to show one recent decision and reproduce their current process in Meteora plus their preferred existing tool. Record what is missing, the time spent and whether a brief changes their understanding. Do not lead with the four product names.
2. Prepare two timestamped briefs per participant for current decisions. Use user-provided position/signature information and supported current observations. If reliable inputs are missing, disclose the gap; do not expand the infrastructure to fill every case.
3. Ask which alternative they would use, why they would return, and whether they would commit to a paid continuation. A proposed **$20–50/month** price range is an experiment assumption, not market pricing evidence. Payment collection would require a separate authorized setup.
4. Pre-register a provisional continuation gate: at least **5/10 request a second brief without prompting**, **3/10 commit to a specific paid pilot**, and **7/10 can correctly distinguish fees, inventory changes and quoted conversion costs** after using it. These are decision thresholds, not statistically representative validation.
5. Measure preparation time and cases blocked by unreliable inputs. If fewer than 7/10 current positions can be explained from existing tools/public data, first determine whether the users value that coverage enough to justify any further data work.

## 7. Evidence that invalidates the idea

- Most participants already obtain the same decision in a trusted existing tool without meaningful friction.
- Users want reliable automatic execution but do not value or revisit a read-only brief.
- Fewer than three commit to a defined paid continuation, despite using the brief twice.
- Historical accounting uncertainty dominates decisions and cannot be resolved within the value users place on the answer.
- Any claimed benefit depends on assuming future fees, ignoring failed execution costs or inventing historical USD P&L.
- Native improvements or competitor features eliminate the candidate gap.

If invalidated, stop this wedge. Automation may merit an integration/partnership experiment with an existing operator, but do not start a new execution stack solely because it scores second. Smart-LP rankings and full historical backtesting remain lower-priority hypotheses given competition and evidence gaps.

## Funding and next action

No open, broadly applicable Jupiter/Meteora grant was verified. Recent hackathon submission windows are closed; contributor awards, referral incentives, investments and grant proposals are different categories. [Current funding pathways](FUNDING_PATHWAYS.md). The immediate milestone is repeat demand and a concrete buyer commitment, followed by an ecosystem feedback discussion if warranted—not another pool or wallet collection milestone.

This research created **43 request/report records**, reviewed **12 product offerings with activity/access qualifications**, and recomputed existing-data pain indicators. It did not establish net LP profitability, product-market fit, paying customers or funding approval. All **1,013** protected financial-evidence files match the pre-existing manifest. [Reproduction output](data/opportunity_validation/offline_analysis.json).
