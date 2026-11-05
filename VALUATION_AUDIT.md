# Valuation audit — 2026-10-19

## Scope and outcome

Audited **all 82 original pools** with >5% inventory-price/TVL discrepancy, preserving their original observations. **No reported API TVL was changed.** Root causes are not fully resolved; lack of price provenance and differing accounting definitions prevent a universally like-for-like recalculation.

| Evidence category | Pools | What this establishes |
|---|---:|---|
| Zero source token price | 6 | Original inventory-price calculation has a missing/unavailable input; zero must not mean economically worthless |
| Price/accounting definition unresolved | 76 | No proven decimal/mint error; source price timestamp, pricing eligibility and TVL basis remain unknown |
| Proven mint or decimal mismatch | 0 | No correction justified |

All 164 pool-token sides match on-chain mints, mint decimals and reserve mints. Raw integer reserves, explicit decimal scales, source API quantities and source prices are saved per pool in `data/phase3/valuation_audit.json`. The original cohort and its retrieval timestamps remain in `data/phase2/cohort.json`.

## Quantities and accounting definitions

Pool account prefixes are decoded with the official LbPair discriminator and IDL field layout. Token custody balances are parsed independently through finalized RPC. **152/164 token sides (74/82 pools on both sides)** match fresh API token quantities to within one atomic unit **after subtracting the pool's recorded protocol fees from custody reserves**. This is empirical evidence that gross reserve balances and API displayed quantities often have different definitions. It is not proof that protocol fees explain the TVL outliers: the original calculation already used API quantities, not gross custody reserves.

The remaining 12 token-side differences are preserved, not normalized away. RPC account/reserve snapshots and fresh API details were retrieved at different times and slots; asynchronous updates are a hypothesis, not a proven stale-data diagnosis. Do not compare them as a single-slot balance sheet.

Each record contains original inventory × source token prices, reported original TVL, fresh TVL, gross chain reserve valuation at fresh API prices, and reserve valuation less protocol fees at those prices. The latter two are **diagnostics**, not corrected TVLs. Repricing old quantities with current Jupiter prices would be a different observation period and is deliberately not used as a correction.

## Price provenance and time

Exact observable source: Meteora's `token_x.price` and `token_y.price` in `/pools`, preserved with request URL and retrieval time. **The upstream provider and token-price update timestamp are not supplied in the inspected schema/response.** Retrieval time is not price time; no record is labeled stale solely because its valuation differs. All 82 records retain price timestamp as unavailable.

A current Jupiter Price V3 comparison was fetched for the affected mints; returned `usdPrice`, `blockId` and decimals are retained, with raw responses and retrieval metadata. Those observations establish a second current source, not historical execution-time USD valuations. Omitted prices remain missing. [Jupiter price documentation](https://developers.jup.ag/docs/price) documents both derivation and missing-token behavior.

The documented Meteora multi-address OR filter returned empty pages for known pool addresses. Those responses were retained; single-pool GET requests successfully retrieved all 82. This is a concrete list-filter compatibility issue, not evidence the pools disappeared. [Meteora API overview](https://raw.githubusercontent.com/MeteoraAg/docs/main/developer-guides/dlmm/api-reference/overview.mdx) now documents a 30-RPS rate ceiling; our detail requests were throttled below it.

## Every affected pool

All mint/decimal/reserve-identity checks below passed. The linked on-chain pool account and exact source metadata/atomic quantities allow manual follow-up. Reported TVL and diagnostic inventory valuation use original API values. No source timestamp or upstream provider is invented.

| Pool / chain account | Reported TVL | Inventory × API prices | Relative discrepancy | Evidence category | API retrieval time |
|---|---:|---:|---:|---|---|
| [GENE-USDC](https://solscan.io/account/CFNevGc4ors4WzVpDU7BUzwbk1JYuGxQWAGAPn94tv3R) | 980.696 | 2,522.29 | 157.19% | unresolved_price_or_accounting_definition | 2026-10-19T14:56:58.406776+00:00 |
| [SOLID-SOL](https://solscan.io/account/8FAxxWLX7pTUsNReHDvuh6xXuJPkp2xVUEd1mHdEyuP4) | 959.866 | 0.0520909 | 99.99% | unresolved_price_or_accounting_definition | 2026-10-19T14:56:58.406776+00:00 |
| [BANX-USDC](https://solscan.io/account/GKKxzCMv76Tsda4hoBJ9xXePD6tcDBYmgz46QmosfK5S) | 92,503.8 | 217.776 | 99.76% | unresolved_price_or_accounting_definition | 2026-10-19T14:56:57.298108+00:00 |
| [suwi-SOL](https://solscan.io/account/HYLCZLkAkmPoPDoGr2xJdj52YKjsiT5mjY4nFGjsEbKV) | 383.725 | 1.75326 | 99.54% | unresolved_price_or_accounting_definition | 2026-10-19T14:57:04.907093+00:00 |
| [MAX-SOL](https://solscan.io/account/5YWpyvV8Fs8C2UaFtrnftoGGyWynVstCh2T7RvttcUtU) | 157.368 | 1.09859 | 99.30% | unresolved_price_or_accounting_definition | 2026-10-19T14:57:00.865253+00:00 |
| [AIOS-SOL](https://solscan.io/account/79D2j7KDiNavW8oQVw3RFwEP7x6CfaLPijJghYh2ow4y) | 1,145.34 | 10.5862 | 99.08% | unresolved_price_or_accounting_definition | 2026-10-19T14:57:00.865253+00:00 |
| [BALL-SOL](https://solscan.io/account/AzJess61YaK8bmYFYqc1z2aKoxbgZCMxpQ4JzwjfgjAN) | 668.609 | 13.8390 | 97.93% | unresolved_price_or_accounting_definition | 2026-10-19T14:57:00.865253+00:00 |
| [wDOG-USDC](https://solscan.io/account/6Vr54DtNwBBxpU54QrZVXEzL5LbFJUnQ2dJLCuC1akAZ) | 240.847 | 6.91549 | 97.13% | unresolved_price_or_accounting_definition | 2026-10-19T14:57:04.907093+00:00 |
| [SHDW-USDC](https://solscan.io/account/EbyhuvETrBtYj4JbjtUK9Ex174Ab3rvpCit8qKv48ezF) | 23,765.8 | 1,243.58 | 94.77% | unresolved_price_or_accounting_definition | 2026-10-19T14:57:02.709205+00:00 |
| [Mog-USDC](https://solscan.io/account/5Tx6A2Av3gDZHLd7KtSgPuferytJuLuSKej9MS6sDK8e) | 304.721 | 20.4111 | 93.30% | unresolved_price_or_accounting_definition | 2026-10-19T14:57:04.907093+00:00 |
| [MAJOR-SOL](https://solscan.io/account/dQhQBXJFtPyTdKY32CczyscpfLM1Hu2Ah62WGGPc68x) | 259.481 | 27.9728 | 89.22% | unresolved_price_or_accounting_definition | 2026-10-19T14:57:04.907093+00:00 |
| [URANUS-SOL](https://solscan.io/account/B8gaXBnU1SSLisCFJvDUq1eN7YfMAx8quwtvzCwntwjB) | 999.712 | 112.486 | 88.75% | unresolved_price_or_accounting_definition | 2026-10-19T14:56:58.406776+00:00 |
| [DMC-SOL](https://solscan.io/account/8x1UB1HZvGdQTt9QFMAyKCKgr3dh5DMdNTD5N1fbMq4w) | 164.682 | 18.6417 | 88.68% | unresolved_price_or_accounting_definition | 2026-10-19T14:57:00.865253+00:00 |
| [DTF-SOL](https://solscan.io/account/2wtBcbDF78Qtm8nih19ff7khKeDGcm9oq17UynXd5XSy) | 334.655 | 41.4426 | 87.62% | unresolved_price_or_accounting_definition | 2026-10-19T14:57:00.865253+00:00 |
| [ATLAS-USDC](https://solscan.io/account/39xa6kb1tUu1NVNGy6EmUtHyFP3mfYoppXS6tPsvPx6u) | 1,217.31 | 154.419 | 87.31% | unresolved_price_or_accounting_definition | 2026-10-19T14:57:04.907093+00:00 |
| [LIBRA-SOL](https://solscan.io/account/13jW1a4xRjpG8Fx9HsBuHzCkBRThsFgzGoThc5LbmjUD) | 973.229 | 132.323 | 86.40% | unresolved_price_or_accounting_definition | 2026-10-19T14:56:58.406776+00:00 |
| [VIN-USDC](https://solscan.io/account/Cbo6UrvL81rWjcc9dBpQazNctGLuFKS1RGXs13VY2KUz) | 400.430 | 56.3914 | 85.92% | missing_or_nonpositive_source_price | 2026-10-19T14:57:02.709205+00:00 |
| [REPLY-SOL](https://solscan.io/account/ZBFbBJhsXmSivEorWfVWeBn52yoKEnmmjdukcCz66bY) | 220.150 | 31.5946 | 85.65% | unresolved_price_or_accounting_definition | 2026-10-19T14:57:04.907093+00:00 |
| [Mecha-SOL](https://solscan.io/account/BzLWuqNLFsawZKyoRcNJLGP4tWNN2LSFCCvo66mrVtQU) | 120.950 | 18.0658 | 85.06% | unresolved_price_or_accounting_definition | 2026-10-19T14:57:00.865253+00:00 |
| [SHARK-USDC](https://solscan.io/account/HpyywhKutTpop2Lrf8yEzJwS8vuRowY9fyvHx7peDMkD) | 25,192.7 | 4,144.14 | 83.55% | unresolved_price_or_accounting_definition | 2026-10-19T14:57:02.709205+00:00 |
| [UPT-USDC](https://solscan.io/account/9pdoDV7m4brB6Pboz6oeoNVNkrRGL4t6M4BqhKcVB4Ju) | 165.780 | 28.9209 | 82.55% | unresolved_price_or_accounting_definition | 2026-10-19T14:57:02.709205+00:00 |
| [HNT-USDC](https://solscan.io/account/1koYvNEJ5gWXZ6V3re8xwXDHrEpHf4vNYrNGv4bhrqK) | 126.608 | 23.3231 | 81.58% | unresolved_price_or_accounting_definition | 2026-10-19T14:57:02.709205+00:00 |
| [TrackedBio-SOL](https://solscan.io/account/8uetohWFthFrvQS4FKVbTeRktCnpykkZFzP53zbSGzSm) | 950.478 | 177.377 | 81.34% | unresolved_price_or_accounting_definition | 2026-10-19T14:56:58.406776+00:00 |
| [POPCAT-SOL](https://solscan.io/account/EqH9g8yz1HWfbuME97NSRShzYRh8emMsdGmmnfm84Q9C) | 968.872 | 213.528 | 77.96% | unresolved_price_or_accounting_definition | 2026-10-19T14:56:58.406776+00:00 |
| [CLIPPY-SOL](https://solscan.io/account/37GaodabZCeV8Mu3wyiJ46y8tBa5wsbKbpv5ZcYxMXsX) | 338.443 | 76.9618 | 77.26% | unresolved_price_or_accounting_definition | 2026-10-19T14:57:00.865253+00:00 |
| [SOL-USDC](https://solscan.io/account/3WHNf55iBawfL7U1cC4Htj11KKmC8hvrrbdM31yPUr4C) | 739.969 | 1,305.28 | 76.40% | unresolved_price_or_accounting_definition | 2026-10-19T14:57:02.709205+00:00 |
| [POPCAT-SOL](https://solscan.io/account/Bvhs6xjm4p4BWwDCayprqkVhPePYx29whue7pGG41CYX) | 982.998 | 234.666 | 76.13% | unresolved_price_or_accounting_definition | 2026-10-19T14:56:58.406776+00:00 |
| [ANT-SOL](https://solscan.io/account/AdyqYUBESStZYSoKXRYKCqaXVaHZHaQbiKZkNEeuRKRS) | 233.327 | 56.7050 | 75.70% | unresolved_price_or_accounting_definition | 2026-10-19T14:57:00.865253+00:00 |
| [USDC-TRUMP](https://solscan.io/account/9RrL3knuK8WCVnt2dBYDXGkLFN8ei6Uk6PbdLpq1FU1b) | 7,638.85 | 1,965.26 | 74.27% | unresolved_price_or_accounting_definition | 2026-10-19T14:57:03.784901+00:00 |
| [MLD-SMA](https://solscan.io/account/A5VgSZpNds154Aar6n6sS4U4VnWbZMCCmSzCtWh6q9Lx) | 1,514.70 | 390.250 | 74.24% | missing_or_nonpositive_source_price | 2026-10-19T14:57:00.865253+00:00 |
| [BUU-SOL](https://solscan.io/account/83tSKLAfnbV4GSyTBGZTJ6gRUPibxV4WnhiGm2Z4QDPn) | 377.812 | 101.812 | 73.05% | unresolved_price_or_accounting_definition | 2026-10-19T14:57:04.907093+00:00 |
| [ZEX-USDC](https://solscan.io/account/3JtPcdkVt67tAHXTPCy82G1C3natX1wZtXqB5RjxXJtr) | 108.671 | 30.4484 | 71.98% | unresolved_price_or_accounting_definition | 2026-10-19T14:57:04.907093+00:00 |
| [BRAINLET-SOL](https://solscan.io/account/8T7j1Xh5Zx3eYhUBQSVZQLSyHnu2R4LgJxBTPcNz5TrR) | 315.045 | 90.3973 | 71.31% | unresolved_price_or_accounting_definition | 2026-10-19T14:57:04.907093+00:00 |
| [ZORA-SOL](https://solscan.io/account/3LxKhPQNQ4ovrFybWn2rZJYxQqNufVrFcvDBiNijpsE6) | 827,091 | 242,087 | 70.73% | unresolved_price_or_accounting_definition | 2026-10-19T14:57:07.066149+00:00 |
| [WEN-SOL](https://solscan.io/account/6GtSA5EVvxW9x8hUT8AieJTaqEVg7we8mFQ7dAfokp2i) | 1,021.07 | 298.885 | 70.73% | unresolved_price_or_accounting_definition | 2026-10-19T14:57:00.865253+00:00 |
| [$RIF-SOL](https://solscan.io/account/GhMVWMuZ9Xykveavxx2VQ4vy1etexCUnHCw4K27iDZDw) | 951.324 | 298.956 | 68.57% | unresolved_price_or_accounting_definition | 2026-10-19T14:56:58.406776+00:00 |
| [wibwob-SOL](https://solscan.io/account/CcqA1dr5UT5Ap1C9aHuuuauDSPnPEYZR2bfMTkth8HHK) | 1,267.65 | 420.372 | 66.84% | unresolved_price_or_accounting_definition | 2026-10-19T14:57:04.907093+00:00 |
| [SONIC-SOL](https://solscan.io/account/EbD5UJg88ya6aWtsbEKfT9C2BaWRWjE6ZWoLWAptqmNn) | 439.584 | 149.782 | 65.93% | unresolved_price_or_accounting_definition | 2026-10-19T14:57:00.865253+00:00 |
| [LEAN-SOL](https://solscan.io/account/H9qrAiQ5m7UFZhZ86WdAz1n4nTqTWidsJZpznCca1SnF) | 302.595 | 104.688 | 65.40% | missing_or_nonpositive_source_price | 2026-10-19T14:57:04.907093+00:00 |
| [PINO-SOL](https://solscan.io/account/4t2wGSsfAyKkLwx3FLtgewgSrdS1JH1EVKzSHqK21CpH) | 10,391.9 | 3,742.30 | 63.99% | unresolved_price_or_accounting_definition | 2026-10-19T14:57:04.907093+00:00 |
| [RENDER-USDT](https://solscan.io/account/D7HTEuTX1KEjuPZTWU7h3Snzc9xnhMFLYyXMhnYb7LUQ) | 993.010 | 358.661 | 63.88% | unresolved_price_or_accounting_definition | 2026-10-19T14:56:58.406776+00:00 |
| [LOYAL-USDC](https://solscan.io/account/A5gCuLCbtg6vR4mKz5fM9iQsT7qRnbBHbWh4DbBfR3EA) | 348.247 | 128.304 | 63.16% | unresolved_price_or_accounting_definition | 2026-10-19T14:57:00.865253+00:00 |
| [coby-SOL](https://solscan.io/account/AfJsV3hENSgzdiNHFMmYWFSkw777GHCcTFQwk2MsQnuC) | 981.587 | 377.070 | 61.59% | unresolved_price_or_accounting_definition | 2026-10-19T14:56:58.406776+00:00 |
| [KIRAI-SOL](https://solscan.io/account/HhhQL6DH1uG558jr9UYgRa7wiYRXiPmgsgqVT9gFmGPh) | 279.149 | 112.400 | 59.73% | unresolved_price_or_accounting_definition | 2026-10-19T14:57:04.907093+00:00 |
| [Bonk-USDC](https://solscan.io/account/79QjN1uZ8hnwxRzswUX28ivspxbB5wPsooaUgfkkpMGq) | 2,978.52 | 1,225.44 | 58.86% | unresolved_price_or_accounting_definition | 2026-10-19T14:57:00.865253+00:00 |
| [ANSEM-USDC](https://solscan.io/account/EDfJVXxibB78qc4s8dLqYpF6PVPYX4mGKu1uehsfyGQj) | 215.048 | 89.5163 | 58.37% | unresolved_price_or_accounting_definition | 2026-10-19T14:57:00.865253+00:00 |
| [ZORA-USDC](https://solscan.io/account/Djz6kty93GnVyWnaD5aSLZf2Jpr4uxnS3oKKkUn5cN4L) | 96,516.9 | 40,421.7 | 58.12% | unresolved_price_or_accounting_definition | 2026-10-19T14:56:57.298108+00:00 |
| [MF-SOL](https://solscan.io/account/5iD46Cmd43d6Mcg61wTUZRH7tAbnftHTun1ibNBappDE) | 978.067 | 411.643 | 57.91% | unresolved_price_or_accounting_definition | 2026-10-19T14:56:58.406776+00:00 |
| [BITCONNECT-SOL](https://solscan.io/account/AmY4251LS2iWAd54Cc5Q5AoRj48uNUD5UHUUcnoMZjX9) | 1,519.35 | 670.414 | 55.87% | missing_or_nonpositive_source_price | 2026-10-19T14:57:04.907093+00:00 |
| [FEETCOIN-SOL](https://solscan.io/account/DvAQXVoLiLHK55Ed8qpRQcG9x8TBPdtTa5K1qxMMHWcr) | 989.174 | 444.288 | 55.08% | unresolved_price_or_accounting_definition | 2026-10-19T14:56:58.406776+00:00 |
| [pep-SOL](https://solscan.io/account/46wU93tUZX7nYaLXxyKFZXZKRVVHHBHqAVWLGosyzhXy) | 674.640 | 308.196 | 54.32% | unresolved_price_or_accounting_definition | 2026-10-19T14:57:00.865253+00:00 |
| [Italianrot-SOL](https://solscan.io/account/7BygxHAy1pUPV1z6wdY1YDSh8QdhDh27T1Nfan4i8PEb) | 1,800.78 | 849.977 | 52.80% | unresolved_price_or_accounting_definition | 2026-10-19T14:57:00.865253+00:00 |
| [vneet-SOL](https://solscan.io/account/83FhrDHnKUhvuTbAx9VW589CeeX9Qqv6thKezAeDfcB1) | 1,334.33 | 650.358 | 51.26% | missing_or_nonpositive_source_price | 2026-10-19T14:57:01.582287+00:00 |
| [Bonk-USDC](https://solscan.io/account/jKzkEPEnoGkrR7QQqzsTDQ1MuGDSyHM3yCgYpNKwREm) | 3,207.56 | 1,770.21 | 44.81% | unresolved_price_or_accounting_definition | 2026-10-19T14:57:02.709205+00:00 |
| [UPONLY-SOL](https://solscan.io/account/9DTp6uAqfkPmgBTSfb4kCVTjjHzzmPoJLY9VND6tVLVW) | 147.888 | 82.3574 | 44.31% | unresolved_price_or_accounting_definition | 2026-10-19T14:57:00.865253+00:00 |
| [GECKO-SOL](https://solscan.io/account/2CGE2va5XEmHHEhoKRdiXBsqDD76qbbWTsoNTMHR2w2G) | 435.131 | 245.231 | 43.64% | unresolved_price_or_accounting_definition | 2026-10-19T14:57:02.709205+00:00 |
| [MEF-SOL](https://solscan.io/account/CCcuNtjKAghHiXYSfmM8CK5NcGgPBiT7JqVDq4H4Zkpm) | 508.111 | 305.231 | 39.93% | unresolved_price_or_accounting_definition | 2026-10-19T14:57:04.907093+00:00 |
| [mockMEME-USDC](https://solscan.io/account/HFrirYebDWSGatA89dzRtJxhvZXs856Pa7zSqX5NKV4k) | 5,487.39 | 3,340.67 | 39.12% | unresolved_price_or_accounting_definition | 2026-10-19T14:57:02.709205+00:00 |
| [MET-USDC](https://solscan.io/account/4bwjWCjAAbbcCU8ZEmwGiV2UWCzy8r7HjrWGXLTHc393) | 961.947 | 588.513 | 38.82% | unresolved_price_or_accounting_definition | 2026-10-19T14:56:58.406776+00:00 |
| [JUP-USDC](https://solscan.io/account/7HR1ouGwPsCyPScUCx4WJCPyktXMoLitrGkLczd7Vabx) | 277.369 | 169.752 | 38.80% | unresolved_price_or_accounting_definition | 2026-10-19T14:57:03.784901+00:00 |
| [Swarm-SOL](https://solscan.io/account/Fg4qDyrfJzytPU5J3yFk9o1MsKo2rqa9zx5QKua8QU5c) | 2,247.66 | 1,400.23 | 37.70% | unresolved_price_or_accounting_definition | 2026-10-19T14:57:00.865253+00:00 |
| [AFC-SOL](https://solscan.io/account/Csz3Go1xa7e1YfLX3SrcSmdUt6UBzamWLjnai71CQzMC) | 85,350.6 | 58,094.7 | 31.93% | unresolved_price_or_accounting_definition | 2026-10-19T14:56:57.298108+00:00 |
| [DARK-USDC](https://solscan.io/account/BwkUm4PuMXNZpahjMWEVnsmH6dWDhTBgqsNZwkuGehQv) | 141.176 | 182.699 | 29.41% | unresolved_price_or_accounting_definition | 2026-10-19T14:57:02.709205+00:00 |
| [BIO/ACC-SOL](https://solscan.io/account/Hv13QDCUCBxni1B5FhzDcZv8HZM7tsyVJgnRv3xA23V5) | 164.823 | 117.894 | 28.47% | unresolved_price_or_accounting_definition | 2026-10-19T14:57:04.907093+00:00 |
| [MIRAI-SOL](https://solscan.io/account/569F8RKjyCtM1fYtunay8xExZC4hhJNc9b4zcpVazj68) | 87,169.6 | 62,860.4 | 27.89% | unresolved_price_or_accounting_definition | 2026-10-19T14:56:57.298108+00:00 |
| [Mustard-SOL](https://solscan.io/account/5jbVpn2U2oH8tnDZR3E3Wt6HHdYd8CXahkZivwCo2d6Q) | 981.031 | 715.387 | 27.08% | unresolved_price_or_accounting_definition | 2026-10-19T14:56:58.406776+00:00 |
| [NIGGOLAS-USDC](https://solscan.io/account/4GtXMPcHDqWBQWkqc1iMC8qFZXg4j3UjdYoGoYZc6Qkj) | 2,314.14 | 1,771.38 | 23.45% | unresolved_price_or_accounting_definition | 2026-10-19T14:57:04.907093+00:00 |
| [RENDER-SOL](https://solscan.io/account/6qMThaYCUFUuDh3XCLHrkCyrD7945JcCYhXwhq3cdfiF) | 254.782 | 204.191 | 19.86% | unresolved_price_or_accounting_definition | 2026-10-19T14:57:02.709205+00:00 |
| [JUP-SOL](https://solscan.io/account/FpjYwNjCStVE2Rvk9yVZsV46YwgNTFjp7ktJUDcZdyyk) | 526.149 | 622.575 | 18.33% | unresolved_price_or_accounting_definition | 2026-10-19T14:57:03.784901+00:00 |
| [XONA-SOL](https://solscan.io/account/2ze8bxoasL829UwCp1HUNqGm15qXZ9Z688psxACPFdPu) | 979.008 | 800.336 | 18.25% | unresolved_price_or_accounting_definition | 2026-10-19T14:56:58.406776+00:00 |
| [PENGU-SOL](https://solscan.io/account/AvgZvXqoZMCDphb7PmVdXKkxsZJfQKKTKKrP3PeoouCN) | 997.401 | 831.513 | 16.63% | unresolved_price_or_accounting_definition | 2026-10-19T14:56:58.406776+00:00 |
| [arc-USDC](https://solscan.io/account/DW2QC5ychRKmA3YpY6eWetxt1YdMK8hir3vNjNjRW6i9) | 7.80608e+6 | 6.51273e+6 | 16.57% | unresolved_price_or_accounting_definition | 2026-10-19T14:56:56.156308+00:00 |
| [SWS-dNd10](https://solscan.io/account/3gnPQWpWrZWXZed41PfQEUdfBvbpRkeY1F2ThBPzserG) | 906.253 | 766.140 | 15.46% | missing_or_nonpositive_source_price | 2026-10-19T14:57:00.865253+00:00 |
| [M3M3-SOL](https://solscan.io/account/WimP21rGWJ19os6i5gPAxWEKCa9n3s63jrnnagSCxUv) | 969.619 | 821.444 | 15.28% | unresolved_price_or_accounting_definition | 2026-10-19T14:56:58.406776+00:00 |
| [JUP-USDC](https://solscan.io/account/GhZtugCqUskpDPiuB5zJPxabxpZZKuPZmAQtfSDB3jpZ) | 1,294.76 | 1,152.79 | 10.97% | unresolved_price_or_accounting_definition | 2026-10-19T14:57:02.709205+00:00 |
| [cbBTC-USDC](https://solscan.io/account/5CdNGRJDzWpX8rWzoumvDkkVwHUczaxqEYT9iBJfBKRZ) | 121.724 | 109.804 | 9.79% | unresolved_price_or_accounting_definition | 2026-10-19T14:57:03.784901+00:00 |
| [WEFT-SOL](https://solscan.io/account/95zNQQ8juGpu8odzpbp63ZNtXuTnnBeBsHovUjpe32d8) | 85,713.6 | 93,974.4 | 9.64% | unresolved_price_or_accounting_definition | 2026-10-19T14:56:57.298108+00:00 |
| [COMPUTE-SOL](https://solscan.io/account/6o59SycG85bY81wEd8Tf2S8ETj2N6CcHU1XXyPLo59eZ) | 105,915 | 115,403 | 8.96% | unresolved_price_or_accounting_definition | 2026-10-19T14:57:01.582287+00:00 |
| [GTA6-SOL](https://solscan.io/account/5A15QUc6kMxw9dsVpVUv6ZdTTBeyWBN2scyy1MEQJFQs) | 91,157.0 | 97,593.3 | 7.06% | unresolved_price_or_accounting_definition | 2026-10-19T14:56:57.298108+00:00 |
| [baton-SOL](https://solscan.io/account/BN7CfsGm6Vq9w8NibLZXRGW2tp5y2axwXuLAs85NGakf) | 465,518 | 492,906 | 5.88% | unresolved_price_or_accounting_definition | 2026-10-19T14:57:07.066149+00:00 |
| [ASH-SOL](https://solscan.io/account/ATdyYqv8XNMpq2cuYQYgPQcLWFbPZfciKsJh1YpB1KEP) | 980.846 | 927.677 | 5.42% | unresolved_price_or_accounting_definition | 2026-10-19T14:56:58.406776+00:00 |
| [USDC-SOL](https://solscan.io/account/GY9inD1bJ1P96N9fWZWV2v8UWgKK7ad38kSPyNwR2ZLt) | 174.210 | 183.103 | 5.10% | unresolved_price_or_accounting_definition | 2026-10-19T14:57:03.784901+00:00 |

## Examples and next checks

- SOLID–SOL has tiny source inventory-price value versus reported TVL despite matching mint/decimal checks. Its raw quantities and prices are retained; no trustworthy price timestamp exists to adjudicate the difference.
- GENE–USDC has source inventory-price value well above TVL. This could reflect valuation eligibility or timing differences, but API TVL is not declared wrong.
- MLD–SMA and five other pools have a zero token price in the original response. Replacing zero with a later price would fabricate a historical correction.

Ask Meteora for the token-price provider/update timestamp, TVL valuation policy (including unpriced-token handling), and reserve/fee inclusion rules. Then test synchronized account snapshots and source prices against that contract. No evidence-supported historical correction is available yet.
