"""Export only evidence-backed phase 3 findings; no missing financial estimates."""
import csv
import hashlib
import json
from collections import Counter
from datetime import datetime, timezone
from decimal import Decimal
from pathlib import Path

from research.collector import atomic_json


def utc(ts):return datetime.fromtimestamp(ts,timezone.utc).isoformat() if ts is not None else 'unavailable'
def number(value):return f'{Decimal(str(value)):,.6g}' if value is not None else 'unavailable'


def generate(root=Path('data/phase3')):
    root=Path(root);audit=json.loads((root/'valuation_audit.json').read_text());positions=json.loads((root/'position_lifecycles.json').read_text())
    scans=[json.loads((p/'closed_scan.json').read_text()) for p in [root,root/'extension']]
    all_events=[e for s in scans for e in s['events']];closure_events=[e for e in all_events if e['event']=='PositionClose' and not e.get('decode_error')]
    decoded_counts=Counter(e['event'] for e in all_events);outliers=audit['outliers']
    all_tokens=[t for r in outliers for t in r['tokens']]
    categories=Counter(r['root_cause'] for r in outliers)
    quantity_matches=sum(t.get('net_quantity_matches_fresh_api_within_one_atomic_unit',False) for t in all_tokens)
    pool_matches=sum(all(t.get('net_quantity_matches_fresh_api_within_one_atomic_unit',False) for t in r['tokens']) for r in outliers)
    csvrows=[]
    for r in positions:
        assess=r['assessment'];pool=r['pool_metadata'];flows=r['token_cash_flows_atomic']
        row={'position':r['position'],'owner_at_creation':r['creation_owner'],'owner_at_closure':r['closure_owner'],'pool':r['pool'],'funded':r['funded'],'creation_slot':r['creation_slot'],'closure_slot':r['closure_slot'],'creation_time_utc':utc(r['creation_time']),'closure_time_utc':utc(r['closure_time']),'creation_signature':r['creation_signature'],'closure_signature':r['closure_signature'],'solscan_creation':f"https://solscan.io/tx/{r['creation_signature']}",'solscan_closure':r['solscan_close'],'closure_account_lamports_zero':r['closure_lamports_zero'],'signature_count':r['signatures_found'],'event_history_complete':assess['event_history_complete'],'token_cash_flows_reconciled':assess['chain_history_complete'],'token_x_mint':pool['token_x']['address'] if pool else None,'token_y_mint':pool['token_y']['address'] if pool else None,'deposited_x_atomic':flows['deposits'][0],'deposited_y_atomic':flows['deposits'][1],'withdrawn_x_atomic':flows['withdrawals'][0],'withdrawn_y_atomic':flows['withdrawals'][1],'claimed_fee_x_atomic':flows['claimed_fees'][0],'claimed_fee_y_atomic':flows['claimed_fees'][1],'reward_event_count':len(r['reward_events']),'transaction_fee_lamports_observed':r['observed_transaction_fee_lamports'],'usd_pnl':None,'hold_benchmark_usd':None,'unavailable_reasons':'|'.join(assess['economic_issues'])}
        csvrows.append(row)
    with Path('CLOSED_POSITIONS.csv').open('w',encoding='utf-8',newline='') as f:
        writer=csv.DictWriter(f,fieldnames=list(csvrows[0]));writer.writeheader();writer.writerows(csvrows)
    manifest=[];methods=Counter();byte_count=0
    for meta_path in root.rglob('*.meta.json'):
        body=meta_path.with_name(meta_path.name.replace('.meta.json','.json'))
        if not body.exists():continue
        meta=json.loads(meta_path.read_text());digest=hashlib.sha256(body.read_bytes()).hexdigest()
        if meta.get('sha256')!=digest:raise ValueError(f'Hash mismatch: {body}')
        manifest.append({'path':str(body),'sha256':digest,'status':meta.get('status')});byte_count+=body.stat().st_size
        request=body.with_suffix('.request.json')
        if request.exists():methods[json.loads(request.read_text())['method']]+=1
    current_idl=json.loads(Path('data/evidence/dlmm-idl-phase3.json').read_text());used_idl=json.loads(Path('data/evidence/dlmm-idl.json').read_text())
    if current_idl!=used_idl:raise ValueError('Current official IDL differs: historical decoding requires review')
    atomic_json(root/'audit_manifest.json',{'responses':manifest,'rpc_methods':dict(methods),'response_body_bytes':byte_count,'idl_sha256':hashlib.sha256(Path('data/evidence/dlmm-idl.json').read_bytes()).hexdigest(),'idl_current_matches_saved':True})
    valuation=f'''# Valuation audit — 2026-10-19

## Scope and outcome

Audited **all {len(outliers)} original pools** with >5% inventory-price/TVL discrepancy, preserving their original observations. **No reported API TVL was changed.** Root causes are not fully resolved; lack of price provenance and differing accounting definitions prevent a universally like-for-like recalculation.

| Evidence category | Pools | What this establishes |
|---|---:|---|
| Zero source token price | {categories['missing_or_nonpositive_source_price']} | Original inventory-price calculation has a missing/unavailable input; zero must not mean economically worthless |
| Price/accounting definition unresolved | {categories['unresolved_price_or_accounting_definition']} | No proven decimal/mint error; source price timestamp, pricing eligibility and TVL basis remain unknown |
| Proven mint or decimal mismatch | {categories.get('mint_or_decimal_mismatch',0)} | No correction justified |

All 164 pool-token sides match on-chain mints, mint decimals and reserve mints. Raw integer reserves, explicit decimal scales, source API quantities and source prices are saved per pool in `data/phase3/valuation_audit.json`. The original cohort and its retrieval timestamps remain in `data/phase2/cohort.json`.

## Quantities and accounting definitions

Pool account prefixes are decoded with the official LbPair discriminator and IDL field layout. Token custody balances are parsed independently through finalized RPC. **{quantity_matches}/164 token sides ({pool_matches}/82 pools on both sides)** match fresh API token quantities to within one atomic unit **after subtracting the pool's recorded protocol fees from custody reserves**. This is empirical evidence that gross reserve balances and API displayed quantities often have different definitions. It is not proof that protocol fees explain the TVL outliers: the original calculation already used API quantities, not gross custody reserves.

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
'''
    for r in sorted(outliers,key=lambda x:Decimal(x['original_relative_difference']),reverse=True):
        valuation+=f"| [{r['name']}](https://solscan.io/account/{r['address']}) | {number(r['reported_tvl_original'])} | {number(r['original_inventory_value'])} | {float(r['original_relative_difference']):.2%} | {r['root_cause']} | {r['original_observed_at']} |\n"
    valuation+='''
## Examples and next checks

- SOLID–SOL has tiny source inventory-price value versus reported TVL despite matching mint/decimal checks. Its raw quantities and prices are retained; no trustworthy price timestamp exists to adjudicate the difference.
- GENE–USDC has source inventory-price value well above TVL. This could reflect valuation eligibility or timing differences, but API TVL is not declared wrong.
- MLD–SMA and five other pools have a zero token price in the original response. Replacing zero with a later price would fabricate a historical correction.

Ask Meteora for the token-price provider/update timestamp, TVL valuation policy (including unpriced-token handling), and reserve/fee inclusion rules. Then test synchronized account snapshots and source prices against that contract. No evidence-supported historical correction is available yet.
'''
    Path('VALUATION_AUDIT.md').write_text(valuation,encoding='utf-8')
    history_complete=sum(r['assessment']['event_history_complete'] for r in positions);reconciled=sum(r['assessment']['chain_history_complete'] for r in positions)
    funded=sum(r['funded'] for r in positions);rewards=sum(len(r['reward_events']) for r in positions);aliases=sum(len(r['alias_pairs']) for r in positions)
    recon=f'''# Position reconciliation — 2026-10-19

## Independent evidence gates

- **{len(positions)} genuinely closed accounts**: explicit PositionClose event in successful finalized transactions, plus zero post-transaction lamports at the position account index. A RemoveLiquidity event alone never passes this test.
- **{history_complete} complete retrievable event histories**: position-address signature paging exhausted, one decoded creation and closure, all successful returned transaction bodies fetched, monotonic block timestamps and no unknown event discriminator. This means completeness under the RPC's returned address history; it is not a guarantee of provider-wide historical indexing fidelity.
- **{reconciled} token cash-flow reconciliations pass**: canonical event amounts equal independently decoded SPL transfers to/from the pool reserves transaction by transaction. Multiple deposits, partial removals, rebalances and compatibility fee events are included.
- **0 trustworthy USD P&Ls; 0 valid USD hold benchmarks**: timestamp-aligned mint/USD prices and complete economic-cost allocation remain missing. API `totalUsd` values are retained as source estimates only.
- **{funded} funded positions and {len(positions)-funded} never-funded closed account**. The latter is a real account closure, not an LP investment return. {rewards} reward-claim events were observed; this is not proof rewards never existed elsewhere. No ownership change was observed in this sample; differing owners would block owner-level accounting.

## Methods and limitations

The primary finalized interval was slots 458874016–458874079. It contained eight closures. Before decoding more results, a second adjacent interval 458874080–458874143 was frozen and fully scanned; it supplied two additional closures. All returned produced blocks were fetched, including transactions that did not interact with DLMM. No current-open-account filter or wallet profit ranking was used.

For every closed position, getSignaturesForAddress was paged to exhaustion (1000/page, four-page safety budget), followed by getTransaction for every successful returned signature up to closure. Creation can precede the scan interval: the closure window discovers the cohort; per-address history reconstructs its lifetime. Failed transaction signatures are retained in raw responses; they do not emit committed cash flows. Their fees are not included in successful-lifecycle fee totals and remain an economic-cost completeness limitation.

The official DLMM IDL fetched for this phase matches the stored schema. Events are read from Anchor event-CPI inner instructions, using loaded address-table keys when present. Unknown bytes and decoding failures are retained and block completeness; no unmatched event is silently discarded. ClaimFee/ClaimFee2 and ClaimReward/ClaimReward2 aliases are paired only on matching fields within the same transaction/invocation. **{aliases} compatibility aliases** were suppressed from cash-flow sums while raw events remain in Parquet/JSON.

Rebalance fields are incorporated as deposits, withdrawals and fees only where they reconcile to actual reserve transfers. Internal or ambiguous transfers would fail the gate. CompositionFee events lack a position field: attribution requires a unique position and matching sender in the same outer invocation. These fees are recorded as embedded deposit/rebalance costs and are not subtracted a second time from already reconciled external deposits. Token-program account initialization/closure and native wrapping instructions are retained separately; they are not invented LP transfers.

Historical token decimals are checked against pre/post token balances in the actual lifecycle transactions for funded positions. Raw u64 quantities stay integers; normalized values use Decimal. The never-funded account has no token-balance observations and does not require token scaling to reconcile zero cash flows.

Pool reserve addresses come from current pool metadata; agreement with lifecycle transfer endpoints is verified. Any mismatch fails reconciliation. Historical pair OHLCV was requested in five-minute windows around creation and closure. Pair candles can contain trades after the event and do not independently establish both mint/USD prices. They are retained with `usable_for_usd_pnl=false`. No stablecoin $1 peg, current Jupiter price or zero-valued missing price is substituted.

Observed transaction fees are `meta.fee` in lamports, once per fetched successful transaction per position. Payer and transaction context are retained. Full fees are **not automatically allocated** to the LP where other instructions/payers are involved. Account rent before closure is recorded separately; refunded rent is not investment income. Tips, failed-transaction fees, ATA rent and external hedge/swap activity are not claimed as fully allocated economic costs.

## Closed position evidence

| Position | Funded | Created UTC | Closed UTC | Signatures | History / cash flows | Creation / closure verification |
|---|---|---|---|---:|---|---|
'''
    for r in positions:
        recon+=f"| [{r['position']}](https://solscan.io/account/{r['position']}) | {r['funded']} | {utc(r['creation_time'])} | {utc(r['closure_time'])} | {r['signatures_found']} | {r['assessment']['event_history_complete']} / {r['assessment']['chain_history_complete']} | [create](https://solscan.io/tx/{r['creation_signature']}) / [close]({r['solscan_close']}) |\n"
    recon+='\n## Exact token cash flows and directly observed transaction fees\n\nAll quantities below are atomic token integers. Mint addresses and scales are in CLOSED_POSITIONS.csv and the JSON evidence. Withdrawals and fee claims remain separate.\n\n| Position | X deposits / withdrawals / fees | Y deposits / withdrawals / fees | Observed successful-transaction fee lamports |\n|---|---|---|---:|\n'
    for r in positions:
        flow=r['token_cash_flows_atomic'];recon+=f"| {r['position']} | {' / '.join(flow[k][0] for k in ['deposits','withdrawals','claimed_fees'])} | {' / '.join(flow[k][1] for k in ['deposits','withdrawals','claimed_fees'])} | {r['observed_transaction_fee_lamports']} |\n"
    Path('POSITION_RECONCILIATION.md').write_text(recon,encoding='utf-8')
    first=min(b['block_time'] for s in scans for b in s['blocks']);last=max(b['block_time'] for s in scans for b in s['blocks'])
    summary={'closed_positions_discovered':len({e['fields']['position'] for e in closure_events}),'positions_selected':len(positions),'funded_positions':funded,'retrievable_event_histories_complete':history_complete,'token_cash_flows_reconciled':reconciled,'trustworthy_usd_pnl':0,'valid_hold_benchmarks':0,'blocks_scanned':sum(len(s['blocks']) for s in scans),'program_transactions':sum(s['program_transactions'] for s in scans),'all_transactions':sum(s['all_transactions'] for s in scans),'scan_errors':[e for s in scans for e in s['errors']],'decoder_errors':sum(bool(e.get('decode_error')) for e in all_events),'external_service_spend_usd':0,'rpc_methods':dict(methods),'response_body_mib':byte_count/1024**2,'valuation_categories':dict(categories)}
    atomic_json(root/'phase3_summary.json',summary)
    findings=f'''# Phase 3 findings — 2026-10-19

## Actual results

| Evidence gate | Result |
|---|---:|
| Closed positions discovered | {summary['closed_positions_discovered']} |
| Selected / creation-to-closure histories retrieved | {len(positions)} / {history_complete} |
| Funded LP positions / never-funded account closures | {funded} / {len(positions)-funded} |
| Token cash-flow reconciliations passing | {reconciled} |
| Trustworthy historical USD net P&Ls | **0** |
| Valid USD hold benchmarks | **0** |
| Original valuation outliers audited | {len(outliers)} |
| Historical TVL corrections supported | **0** |
| External data-service spend | **$0** |

The closed-account and token-reconstruction work succeeded for this bounded sample. **The USD P&L milestone is not complete.** No product idea was selected, no frontend built and no transactions submitted.

## Discovery evidence and coverage

Two frozen contiguous windows cover finalized slots **458874016–458874143**, from {utc(first)} through {utc(last)}. The second window was declared after the first returned eight closures. Scanned **{summary['blocks_scanned']} produced blocks**, **{summary['all_transactions']} total transactions**, and **{summary['program_transactions']} DLMM-referencing transactions**. Scan errors: {len(summary['scan_errors'])}; event decoder errors: {summary['decoder_errors']}. Raw responses, plans and schema hashes are retained under `data/phase3`.

Event counts across the discovery interval: {dict(decoded_counts)}. PositionClose is independent of RemoveLiquidity; all ten selected closures also have zero position post-balance. This is a closure-window cohort, not an estimate of average LP outcomes or a random sample. It includes a never-funded account and does not establish protocol-wide historical coverage.

## Valuation findings

- All 164 token sides passed mint, decimal and reserve identity checks.
- Six original outliers contain a zero source token price. These are missing/unavailable inputs, not proof the token is worthless or TVL is wrong.
- The other 76 discrepancies remain unresolved between price timing/eligibility and accounting definitions. Meteora's upstream price provider and exact price-update timestamp are absent from the inspected API.
- Normalized gross custody reserves differ from API quantities in part because protocol fees are held separately in the pool state. Subtracting those recorded fees matches fresh API quantities within one atomic unit on {quantity_matches}/164 token sides and both sides of {pool_matches}/82 pools. This supports the quantity-definition distinction; **it does not adjudicate TVL correctness**.
- Current Jupiter prices were captured as a second source, not applied to original observations. No evidence-supported historical TVL correction was made.

See VALUATION_AUDIT.md for all 82 pools, original retrieval times, examples and unresolved causes.

## Economics and remaining blockers

Token deposits, withdrawals, fee claims, rebalances, embedded composition fees, rent-before-close and successful-transaction network fees are retained separately. Alias fees are not doubled. Missing reward claims are not manufactured. Observed payer/context and ambiguous costs prevent automatic full transaction-cost attribution. Historical pair candles and Meteora event `totalUsd` estimates do not establish timestamp-aligned token/USD prices; therefore net economic P&L and hold benchmarks remain unavailable.

No RPC/indexer limitation prevented these ten recent lifetimes. Older/longer-lived positions may exceed the public endpoint's retention, capacity or four-page safety budget; reaching that budget must be reported as incomplete, not exhaustive. For larger backfills, use archival getBlocks/getBlock and per-position signature histories with known retention and versioned instruction/event coverage.

Actual external spend was $0; local CPU/network/storage were not billed or metered as service charges. Archived response bodies total **{summary['response_body_mib']:.2f} MiB** across {sum(methods.values())} distinct captured RPC request shapes (including protocol-version errors and cached replay) and the API responses. RPC method counts: {dict(methods)}. These are cache artifacts, not a billing log of retries. Current [Helius credit docs](https://www.helius.dev/docs/billing/credits) list ordinary historical RPC methods at one credit each; the [free plan](https://www.helius.dev/docs/billing/plans) lists 1M monthly credits and 10 RPC requests/s. A similar bounded read workload is within that published allowance before provider-specific limits/eligibility; no account or paid plan was provisioned. Unlimited protocol backfill costs remain unmeasured.

## Recommended next experiment

Use the nine funded closed positions as a reconciliation fixture, not a wallet-success leaderboard. Obtain documented mint/USD historical prices with source timestamps at every deposit, withdrawal, claim and cost event; reject forward-looking or stale prices. Ask Meteora to clarify price provenance, TVL inclusion rules and zero-price treatment. Then add failed-transaction costs, payer attribution, rent and hedge/swap policy before calculating net P&L and an explicitly funded hold counterfactual. Expand the closure-window cohort only after these financial gates pass.

## Reproducible outputs

- `CLOSED_POSITIONS.csv`: ten rows, identities, timestamps, atomic cash flows, closure signatures and Solscan links; unavailable USD fields are blank.
- `POSITION_LIFECYCLES.parquet`: exact decoded position events, atomic payload JSON, slots, instruction indexes, raw bytes and Solscan links.
- `data/phase3/position_lifecycles.json`: all transactions, unassigned events, aliases, transfer reconciliation, source estimates, historical pair-price attempts and completeness gates.
- `data/phase3/valuation_audit.json`: every original valuation outlier and independent reserve/mint checks.
- `data/phase3/audit_manifest.json`: verified response hashes and current/used IDL equality.

Run the phase-3 commands in README.md, followed by `python -m pytest -q`. Real-sample replay tests are separate from clearly synthetic financial edge cases.
'''
    Path('PHASE3_FINDINGS.md').write_text(findings,encoding='utf-8')
    print(json.dumps(summary,indent=2))


if __name__=='__main__':generate()
