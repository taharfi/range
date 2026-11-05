# Tester onboarding

You are invited to a small read-only Meteora DLMM pilot. The tool compares current token exposure and conversion estimates for **HOLD**, **REBALANCE** and **EXIT**. It does not trade, connect to your wallet, predict profits or decide for you.

## Before starting

Use only the link and individual invitation code given by your facilitator. A public pilot URL has not yet been approved or deployed. Never enter a wallet private key, seed phrase or signing credential. The invitation code is a pilot access credential, not a wallet credential.

After entering an address and choosing **Analyze**, an invitation prompt appears when required. Optional usage measurement is **off by default**; invited use works without it. If enabled, it records visits and successful lookup/comparison/feedback/payment-interest events under a tester identifier for up to 30 days, subject to daily expiry cleanup. Wallet addresses, token amounts and raw IPs are not attached to analytics. The necessary access cookie lasts up to 24 hours; restarts may require re-entry. The initial search screen makes no session/analytics request.

## Your first session

1. Before viewing the result, tell your facilitator what action you currently intend and which costs you expect. The pilot needs honest feedback, including “this is not useful.”
2. Enter one **public wallet or open Meteora PositionV2 address**, then choose Analyze. Enter the invitation if requested. The app uses documented Meteora/Solana lookups to resolve the address; start with SOL/USDC. Closed positions and unsupported token types are outside this pilot.
3. On **Position**, select the intended position if several are found. Review pair, range, unclaimed fees and valuation limitations. USD value remains unavailable without validated prices; “indexed” does not mean a simulated withdrawal or audited performance result.
4. Choose **Compare options**. On **Decision**, select HOLD, REBALANCE or EXIT; only that action is displayed. Holding requires no immediate transaction. Rebalancing estimates a swap, not a new LP range or redeposit. Exiting estimates conversions conditional on successful withdrawal. Fees/rewards remain separate.
5. Use expandable Comparison settings if needed. Defaults are USDC exit, 50% token X by pool-reference value and 0.5% slippage cap. Changed settings require refreshing quotes. Exact quantities, slippage and sources are under Technical details & assumptions.
6. Check quote age and stale warnings. A quote is not a guaranteed fill. **Full execution cost remains unavailable** when withdrawal/redeposit/claim/network components are missing. Missing cost is not zero; included route fees must not be subtracted again. Back to position returns without starting another search.

The labeled example is synthetic. It is useful for learning the interface and does not count as a live analysis or a tester outcome.

## Optional feedback and follow-up

Feedback has its **own consent checkbox**. The structured form asks whether the comparison was understandable, revealed an overlooked cost, changed your intention, would be useful again, and whether you want to discuss a priced continuation. No payment is collected and no positive answer is expected. Do not submit wallet/private information as feedback; free text is not accepted.

Save your deletion receipt if you submit. It lets you delete that response and linked feedback/payment-interest events. “Sign out & delete usage history” separately removes usage measurements. Tell your facilitator if you want consented interview notes or backup copies erased; keep the deletion receipt private.

If useful, return for another current analysis **at least 24 hours later**, using the same invitation code. A second actual visit matters more than a promise to return. Interest in paying is not treated as a purchase or credible paid commitment without a separate concrete agreement.

## If something fails

- **Rate limit/busy:** wait about a minute and retry. Avoid repeated refreshes; ten people share conservative free-provider capacity.
- **Expired/stale snapshot:** refresh position data before generating a new brief.
- **No supported positions:** check wallet versus position lookup, address, pagination and provider warnings. It does not prove you have no liquidity.
- **Unsupported mint, missing price or provider error:** estimates stay unavailable; no replacement quote or current-for-historical price is invented.
- **Readiness/access failure:** contact the facilitator. Do not enter other credentials or accept a “support” request for your seed phrase.

The experiment seeks ten genuine LPs, six useful new insights, four observed returns and two credible willingness-to-pay signals. These are research hypotheses. There are currently no real tester responses or testimonials.
