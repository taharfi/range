# Traction: what is measurable and what is not

Checked **2026-10-21**. A public read-only [DefiLlama protocol-list request](https://api.llama.fi/protocols) was captured at **00:17:09 UTC**; selected raw records and provenance are in [defillama-protocols.json](evidence/landscape/defillama-protocols.json). TVL is an independently published provider estimate, not a signed account balance reconciliation. It measures deployed capital, not unique people, retention, revenue, alpha or dashboard usage. The provider's [methodology](https://docs.llama.fi/) defines its accounting scope and avoids some within-protocol double counts; cross-product comparisons still need care.

## Current capital observations

Rounded only for readability; raw values are preserved. Reported 7-day changes are **USD TVL changes**, which combine marks and flows; they are not measured user growth or LP performance.

| Exact provider entity | TVL USD | 7d TVL change | Scope qualification |
|---|---:|---:|---|
| Raydium AMM | $1,201,800,380 | -1.06% | Provider entity called Raydium AMM; not a count of CLMM interface users |
| Orca DEX | $302,808,624 | +0.08% | Provider lists Solana and Eclipse; not solely the new homepage's scope |
| Meteora DLMM | $164,424,644 | -2.25% | DLMM venue liquidity; neither Dynamic Terminal nor Pool Party adoption |
| Kamino Liquidity | $72,873,320 | +0.48% | Liquidity product; explicitly excludes Kamino Lend's separately reported $1.337bn |
| Arrakis Modular | $60,010,095 | -0.68% | Framework entity across listed EVM chains; not all Arrakis versions added together |
| Gamma | $2,983,753 | -3.10% | Exact Gamma entity; excludes unrelated Gamma Research, Opyn Gamma and GammaSwap matches |
| HawkFi | $825,020 | -2.06% | Tracked liquidity-manager capital; not proof of subscription revenue or automated strategy efficacy |
| DeFiTuna Liquidity | $815,147 | +27.66% | Separate from DeFiTuna lending and AMM; do not add blindly |
| Krystal Auto-Farm Vault | $594,798 | -4.83% | Vault product, not total Krystal user portfolio capital |
| Krystal Community Vault | $293,467 | +3.85% | Separate vault entity; may overlap other ecosystem TVL measures |
| Revert Compoundor | $151,005 | -3.28% | Compoundor deployment; not total analytics users or Revert Lend capital |
| LP Agent | Unavailable/null | Unavailable | Listed as Liquidity Automation, but TVL null; null is not zero usage |

All values above come from the linked raw API capture. Substring-discovery output intentionally retains unrelated matches so exclusions can be audited. We did not aggregate them into a market-size estimate. The CSV maps only exact relevant slugs.

## Adoption and commercial unknowns

For **every inventory row**, active wallets, transaction activity, revenue, retention and independently measured paying users remain unknown unless a source is explicitly supplied. No broad RPC crawl or new data infrastructure was built to manufacture a proxy. This sprint does not claim 35 active products or 35 proven user bases.

| Product group | Other available evidence | Interpretation |
|---|---|---|
| Pool Party; Tidepool; LP Agent | Public product descriptions and workflow docs; LP Agent provider listing | Functionality evidence, not a customer cohort measurement. Public copy/leaderboard numbers were not harvested through internal endpoints. |
| Meteora; Orca; Raydium | Native venue documentation and provider TVL | Underlying venue activity cannot be attributed to a third-party LP tool. |
| HawkFi; Kamino; DeFiTuna; Gamma; Arrakis; Krystal; Revert | Exact provider entities above | Capital adoption exists in specific tracked products; compare like products and risk profiles. |
| GeekLad's two tools | Public code and hosted interfaces | Availability/developer effort, not financial demand. Same creator must not be double-counted as two businesses. |
| Step Finance | [Operator announcement, 2025-11-04](https://stepfinance.medium.com/step-group-changes-342ce7d210b0) says dashboard/API/mobile wind-down | Operator-reported historical usage and market estimates were not independently validated; no current user count is carried forward. |
| Infrastructure C17–C35 | Public documentation and service descriptions | No purchased accounts or benchmark workload; advertised capability is not observed customer usage. |

No comparable daily/weekly wallet or retention series was available in the inspected public sources. No protocol fees were relabeled as software revenue. Price-unadjusted TVL growth, public GitHub stars, follower counts and vendor testimonials are excluded from the demand score. Repository-level implementation evidence belongs in the technical reports and does not substitute for adoption.

## What would improve confidence without unnecessary infrastructure

Request consented workflow interviews and observed repeat use from a narrow LP cohort. Where a candidate partnership supplies aggregate usage, request definitions, observation windows, deduplication and measurement ownership. For capital metrics, re-query exact slugs at a later fixed timestamp before interpreting persistence. These are proposed checks, not tasks executed or evidence already collected.
