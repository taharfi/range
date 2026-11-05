# Market gaps: demand evidence, not feature absence

Research checkpoint: **2026-10-21**. Research only; this document authorizes no product work. The current evidence supports testing narrower problems, not committing RANGE to an all-in-one platform.

## What was actually collected

[USER_PAIN_POINTS.csv](USER_PAIN_POINTS.csv) contains **63 dated, publicly authored observations across 39 threads and 55 platform-qualified public handles**. It extends the protected prior 43-record corpus with 20 observations. Each source URL and each author/thread pair occurs once; multiple problems in one post stay in one row. Handles across platforms were not linked into identities. **This is not 63 independent LP customers.**

| Evidence dimension | Count / interpretation |
|---|---|
| Platforms | 49 Meteora governance posts; 9 Meteora SDK GitHub issues; 5 Reddit original posts |
| Audience segments | 43 LP/community requests or reports; 7 builder/operator-adjacent; 9 developer/infrastructure; 3 token issuers; 1 adjacent Jupiter execution user |
| Evidence classes | 18 specific firsthand experiences (A); 36 authored requests/questions (B); 9 firsthand developer reports, indirect for consumer demand (C) |
| Source verification | 58 public forum/GitHub author/date/body matches freshly checked; 5 public Reddit page checks with recorded absolute-day provenance |
| Dates | 28 observations from 2024; 27 from 2025; 8 from 2026; most recent October 12, 2026 |
| Explicit purchase/payment commitment | **0**; willingness to pay remains unknown for every row |
| Hypothesis tags, overlapping | Automation 37; decision support 33; smart/persistence 17; backtesting 8. These are analyst classifications, not votes or market shares. |

The source subset includes real requests, not only reported realized losses. A request's existence is verified; the author's financial amounts, explanations and causal claims are not independently verified. No complaint proves a current reproducible product defect. Issuer requests, SDK bugs and public-support questions have different customers and should not be pooled into a consumer demand score. [Reproducible corpus summary](evidence/demand/corpus_summary.json).

## The strongest current observation

Four LP-authored posts in the September–October 2026 **DAMM v2** Dynamic Terminal feedback thread describe specific workflows. One asks for Jupiter route exclusions when zapping to avoid expensive pool routes, together with pool share and claimed/unclaimed fee clarity. Another describes clutter, difficult slippage controls and repeated deposits. Another wants deposit defaults, discovery and batch management, while explicitly naming existing third-party alternatives. These are fresh and concrete; **they are not proof of the same unmet need for DLMM users**. [Route-control request, September 28](https://proposals.meteora.ag/t/3390/3), [workflow feedback, September 29](https://proposals.meteora.ag/t/3390/4), [management feedback, October 12](https://proposals.meteora.ag/t/3390/8).

The team acknowledges these themes in the same thread, including routing controls and less emphasis on charts. Do not describe them as ignored or permanently missing; implementation status after the acknowledgment was not established by this demand capture. The team-relayed feedback from another user is **excluded from the counted corpus**, because it is secondhand. [Acknowledgment](https://proposals.meteora.ag/t/3390/5), [secondhand feedback excluded](https://proposals.meteora.ag/t/3390/6).

## Candidate problems and falsification tests

| Candidate problem | Demand evidence | What alternatives already do | Remaining question / confidence | Smallest demand test, not implementation approval |
|---|---|---|---|---|
| Understand the consequences and real costs of exiting/rebalancing | Historical DLMM manual-exit accounts U04–U11; current DAMM routing/slippage requests U54–U55; small-position cost questions U62–U63; failed-transaction experience U43 | Tidepool documents zap out, rebalance, swap/gas/rent review and a best-effort automatic exit. Jupiter already provides swap estimates. | Can an independent cross-check expose a consequential, otherwise overlooked cost? **Medium** for problem existence; **low** for distinct paid demand and DLMM transfer of fresh DAMM feedback. | Observe 10 consenting DLMM users completing the same task in their existing tool and RANGE; record correct understanding, incremental insight and repeat use. If existing tools answer the question equally clearly, differentiation fails. |
| Separate earned fees, inventory changes and trustworthy performance | U26/U46/U47/U50 request bookkeeping and USD PnL; U31/U48/U49 question fee/current-TVL ratios; U13/U15 object to involuntary copying | Competitors already show PnL, fee history and rankings. HawkFi explicitly documents Pair HODL, drawdown and simulated strategy results. | Are reproducible accounting boundaries and uncertainty labels useful enough for a buyer? **Medium** for interpretation difficulty; **low** for willingness to pay or a universally missing accounting feature. | Ask users to reconcile a real multi-flow position using current exports; inspect disagreement and whether they voluntarily return for an independently explained reconciliation. RANGE still lacks verified historical USD PnL. |
| Reduce attention needed for out-of-range positions | U05/U07/U09 describe missed/manual handling; U52 requests templates and vault management | Automation, stop-loss, rebalance and delegated strategy products already exist; a 2024 request cannot establish a 2026 gap | Reliability, permission comprehension and all-in realized cost may distinguish implementations, but **no comparative reliability measurement** was made. **Medium** historical demand, **low** unsatisfied niche evidence. | Interview current users of automation about an actual failure/recovery episode and alternatives. If they want an existing executor rather than advice, the standalone brief hypothesis weakens. |
| Coordinate several positions with less UI friction | U30 pool rediscovery; U45 portfolio navigation; U56 batch handling/discovery; U47 portfolio inventory | U56 itself names Metvisor and Dammit Pro as useful partial alternatives | **Low–medium**, segment-specific. Native DAMM interface iteration is active. Not evidence for building a universal terminal. | Observe users with multiple active positions; count repeated steps and compare current batch tools before defining any new feature. |
| Test DLMM strategies rigorously before funding | U25 concerns scenario inventory; U31/U48/U49 concern time-series metric quality; SDK reports expose technical friction | HawkFi documents a DLMM backtesting laboratory with hold comparisons and replay | **Low** direct end-user demand for paid historical replay; existing records do not validate a backtesting subscription | Ask experienced LPs for an actual strategy decision they cannot test with available tools. A hypothetical desire or historical chart request is insufficient. |

Source links for historical examples: [manual exits](https://proposals.meteora.ag/t/1153), [position PnL](https://proposals.meteora.ag/t/843/1), [portfolio charts](https://proposals.meteora.ag/t/1873/1), [time-weighted metric discussion](https://proposals.meteora.ag/t/696), [copying objections and revenue sharing](https://proposals.meteora.ag/t/2175), [automated templates](https://proposals.meteora.ag/t/2871/1), [small-position costs](https://www.reddit.com/r/solana/comments/1ra4yie/), [failed swap costs](https://www.reddit.com/r/solana/comments/1nbvw9b/).

Competitive capability sources: [Tidepool public workflows](https://tidepool.ag/docs), [HawkFi Laboratory documentation](https://hawkfi.gitbook.io/whitepaper/hawkfi-laboratory/liquidity-providing). These confirm documented capability, not an independently audited execution engine or simulated-result accuracy. They expressly weaken any claim that zaps, exit tools, hold benchmarks or DLMM simulation are categorically absent from the market.

## Counterevidence and limits

- Existing tooling has improved materially since the majority of requests. Historical unmet demand is not current competitive whitespace.
- Copying demand is contested. Two firsthand copying-harm accounts and a request for source-wallet compensation counter an assumption that unrestricted wallet copying is universally welcome. Reported harm remains unverified. [Discussion](https://proposals.meteora.ag/t/2175).
- The four freshest detailed workflow requests are about DAMM v2, while RANGE currently analyzes DLMM. Expanding protocols without validation would add scope, not prove product fit.
- No paying subscriber cohort, retention experiment, trustworthy customer unit economics or credible price acceptance is established by this corpus. Public governance budget support is not an end-user software purchase.
- A few author/requester identities are also builders. Public handles are not verified humans or statistically independent respondents. Forum self-selection and discussion clustering dominate the sample.
- No private LP Army/Discord messages, private profiles, wallet identity enrichment or contact information were collected. X did not provide accessible first-hand dated material suitable for this sweep. Reddit JSON's prior HTTP 403 was respected; public readable pages/search were used without restriction bypass.
- Direct public HTTP capture successfully retrieved all 27 targeted Discourse topics, but public topic JSON may return only an initial batch. `posts_count` and `captured_posts` are both retained, and no exhaustive community coverage is claimed. Nine targeted SDK issues were freshly fetched; this is not every GitHub report.
- The forum thread on issuer liquidity locking includes project promotion. Only the explicit mechanical request is summarized and it is isolated as issuer demand. It does not support the consumer opportunity score by itself.

## Reproduce and audit

Run from the existing research repository, without touching app routes, transaction logic or protected datasets:

```powershell
.venv/Scripts/python -X utf8 research/competitive-intelligence/evidence/demand/capture_forum.py
.venv/Scripts/python -X utf8 research/competitive-intelligence/evidence/demand/capture_issues.py
.venv/Scripts/python -X utf8 research/competitive-intelligence/evidence/demand/assemble_demand.py
```

The first two commands perform public unauthenticated reads. The third assembles analyst-coded rows and checks unique URLs, unique author/thread pairs, public status, dates and author matches. Reddit reading notes are manual evidence with day precision, not reproducible JSON API output. Source capture files contain only necessary public authored evidence; long public addresses/signatures are redacted in the new Discourse capture.

[Forum capture manifest](evidence/demand/forum_capture_manifest.json), [GitHub capture manifest](evidence/demand/issue_capture_manifest.json), [Reddit notes and exclusions](evidence/demand/reddit_read_notes.json). The original root `USER_PAIN_POINTS.csv` and historical financial evidence remain intact.
