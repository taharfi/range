"""Reproduce offline opportunity statistics and curated public-request evidence."""
import csv
import hashlib
import json
import math
import statistics as st
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'data/opportunity_validation'

def load(path):
    return json.loads((ROOT / path).read_text(encoding='utf-8'))

# A selected comment is one request, not an independent thread or purchasing decision.
# Problems are analyst paraphrases; raw public posts remain in forum_posts.json.
FORUM = [
 (1011,1,'External charts make range configuration cumbersome','LP requester','decision','addressed in native chart controls'),
 (1011,3,'Wants chart and range selection together','LP requester','decision','same thread; native charts now documented'),
 (1035,1,'Wants to move the liquidity distribution peak','LP requester','decision;automation','custom models exist; exact native peak control unverified'),
 (1153,2,'Requests automatic close swap and reopen with saved settings','LP requester','automation;smart','offered by automation alternatives; no guaranteed returns'),
 (1153,3,'Manually exits too late during further price drops','Self-described LP','automation;decision','TP/SL alternatives now documented'),
 (1153,4,'Manually performs the requested out-of-range conversion','Self-described LP','automation','same author as chart request; alternatives now exist'),
 (1153,5,'Reports losses when absent for the exit swap','Self-described LP','automation;decision','loss claim not verified; alternatives now exist'),
 (1153,7,'Requests an automatic percentage stop loss while away','LP requester','automation','TP/SL alternatives now documented'),
 (1153,8,'Fears out-of-range moves while asleep after manual rebalances','Self-described LP','automation','alternatives now exist'),
 (1153,11,'Reports manual handling leads to losses','Self-described LP','automation','loss claim not verified; alternatives now exist'),
 (1153,13,'Requests a configurable out-of-range swap threshold','LP requester','automation','alternatives exist; exact threshold behavior differs'),
 (1172,1,'Needs hourly and seven-day fee-to-liquidity charts','LP requester','decision;smart','dashboards exist; comparable time-weighted denominator unverified'),
 (2175,1,'Copying forces wallet rotation and causes stress','Self-described experienced LP','smart','negative demand for involuntary copying; causal losses unverified'),
 (2175,11,'Requested copy-bot revenue sharing for source wallets','LP community participant','smart','Tidepool documents creator rewards; not categorically missing'),
 (2175,15,'Reports being copied and harmed around exits','Self-described LP','smart','counterevidence to indiscriminate copy rankings; causal losses unverified'),
 (240,3,'Own LP experience motivated an automated operator request','LP and prospective builder','automation','same author as topic OP; operator tools now exist'),
 (240,6,'Runs Solana bots and wants automated narrow ranges','Bot operator','automation','builder-adjacent; existing automation competes'),
 (240,8,'Requests configurable bot parameters','Community requester','automation;smart','request only; no usage or willingness to pay established'),
 (240,9,'Had wanted to request an LP operator bot','Community requester','automation','same thread; weak specificity; historical demand only'),
 (240,16,'Paused own bot while developing range and pool filters','Builder operating a bot','automation;decision','affiliated builder; not evidence of end-user payment'),
 (3173,1,'Wants price-within-range visualization on portfolio','Portfolio user/requester','decision','2026 request; current native portfolio availability unverified'),
 (702,1,'Requests single-token entry and exit for DLMM','LP requester','automation','native Ape In/Zap Out and third-party zaps now documented'),
 (702,2,'Requests Jupiter routing and converting claimed fees','Tool builder/requester','automation','GeekLad affiliation; claim-and-swap offered by Tidepool'),
 (731,1,'Wants terminal token inventory and weighted purchase price','LP requester','decision','simulator exists; exact per-workflow coverage differs'),
 (731,2,'Requests simulated prices and resulting inventory changes','Tool builder/requester','decision;backtest','GeekLad later implemented simulator; scenario request not historical replay'),
 (843,1,'Needs deposit withdrawal fee records in chosen currency','LP requester','decision;smart','reporting alternatives exist; accounting boundaries differ'),
 (858,1,'Requests range adjustment and one-action compounding','LP requester','automation','native rebalance and third-party compound now documented'),
 (858,2,'Reports inconsistent availability of out-of-range sync','Self-described LP','automation;decision','historical issue; current defect not independently reproduced'),
 (858,3,'Reports losses and repeated manual position closure','Self-described LP','automation','loss claim unverified; automation now exists'),
 (858,4,'Pool rediscovery takes so long the user gives up','Self-described LP','decision;smart','favorites/reinvestment request; current coverage not verified'),
 (873,1,'Current TVL can distort trailing fee ratios','LP requester','decision;backtest','denominator concern corroborated by native definition; corrective tooling unknown'),
]

GITHUB = [
 (283,'Position operator initialization fails with seed mismatch','automation'),
 (268,'Observed wide position conflicts with client assumptions','backtest;smart'),
 (255,'Own swap fails despite configured slippage','automation'),
 (247,'Indexer account deserialization fails after schema changes','smart;backtest'),
 (245,'Fetching certain wallets fails during fee computation','smart;decision'),
 (234,'Position creation returns signature without expected wallet changes','automation'),
 (221,'Copied IDL fails in own Anchor integration','backtest;smart'),
 (219,'Python client cannot read mint decimals','automation;backtest'),
 (218,'Own Python swap quote fails on numeric encoding','automation'),
]

def requests():
    posts=load('data/opportunity_validation/forum_posts.json')
    issues=load('data/opportunity_validation/dlmm_sdk_issues.json')
    rows=[]
    for topic, number, problem, user_type, hypothesis, resolution in FORUM:
        p=next(p for p in posts if p['topic_id']==topic and p['post_number']==number)
        assert not p['hidden']
        direct='Self-described' in user_type or (topic,number) in [(240,3),(240,16),(1153,4),(2175,11)]
        rows.append(dict(source_url=p['url'],date=p['date'],source='Meteora public governance',
          thread_id=f'meteora:{topic}',public_author=p['username'],problem=problem,user_type=user_type,
          evidence_quality='A: specific firsthand experience' if direct else 'B: authored feature request',
          hypothesis=hypothesis,evidence_direction='counterevidence to unrestricted copying' if (topic,number) in [(2175,1),(2175,15)] else 'request/problem',
          current_resolution=resolution,date_provenance='Discourse created_at',
          evidence_file='data/opportunity_validation/forum_posts.json'))
    for number,problem,hypothesis in GITHUB:
        i=next(i for i in issues if i['number']==number)
        assert 'pull_request' not in i
        rows.append(dict(source_url=i['html_url'],date=i['created_at'],source='Meteora public GitHub',
          thread_id=f'github:dlmm-sdk:{number}',public_author=i['user']['login'],problem=problem,
          user_type='SDK integrator; not necessarily a paying LP',evidence_quality='C: firsthand developer report; indirect product demand',
          hypothesis=hypothesis,evidence_direction='implementation friction',
          current_resolution=f"Issue {i['state']} at capture; report not independently reproduced; closed does not prove fix",
          date_provenance='GitHub issue created_at',evidence_file='data/opportunity_validation/dlmm_sdk_issues.json'))
    for ident,date,author,problem,hypothesis in [
      ('1ad47zy','2024-01-28','Longjumping-Device28','Own WEN/SOL inventory changed; does not understand withdrawal outcome','decision'),
      ('1doiab9','2024-06-25','Ok_Bar_8192','Deposited funds but cannot find how to withdraw','decision;automation'),
      ('1nbvw9b','2025-09-08','Ok_Expression_748','Automated swap fees make wallet balance differ from spreadsheet','automation;decision'),
    ]:
        rows.append(dict(source_url=f'https://www.reddit.com/r/solana/comments/{ident}/',date=date,
          source='Reddit public web page',thread_id=f'reddit:{ident}',public_author=author,problem=problem,
          user_type='Self-described LP' if ident!='1nbvw9b' else 'Automated Jupiter swap user; adjacent to LP execution',
          evidence_quality='B: firsthand self-report; amounts/causes not verified',hypothesis=hypothesis,
          evidence_direction='request/problem',current_resolution='historical report; present issue and willingness to pay unverified',
          date_provenance='Public page Top Posts day; not relative age; day precision',
          evidence_file='data/opportunity_validation/reddit_read_notes.json'))
    for n,r in enumerate(rows,1): r['evidence_id']=f'U{n:02d}';r['checked_as_of']='2026-10-20'
    fields=['evidence_id','source_url','date','source','thread_id','public_author','problem','user_type','evidence_quality','hypothesis','evidence_direction','current_resolution','date_provenance','evidence_file','checked_as_of']
    with (ROOT/'USER_PAIN_POINTS.csv').open('w',encoding='utf-8',newline='') as f:
        w=csv.DictWriter(f,fieldnames=fields);w.writeheader();w.writerows(rows)
    return dict(records=len(rows),threads=len({r['thread_id'] for r in rows}),
      public_authors=len({(r['source'],r['public_author']) for r in rows}),
      by_source=dict(Counter(r['source'] for r in rows)),
      by_year=dict(sorted(Counter(r['date'][:4] for r in rows).items())),
      by_hypothesis_overlapping=dict(Counter(h for r in rows for h in r['hypothesis'].split(';'))))

def quantitative():
    with (ROOT/'POOL_STATISTICS.csv').open(encoding='utf-8-sig') as f: pools=list(csv.DictReader(f))
    def values(field): return [float(p[field]) for p in pools if p[field] and math.isfinite(float(p[field]))]
    tvls=sorted(values('tvl_api'),reverse=True)
    history=load('data/phase2/histories.json'); daily=[]
    # Fixed original 30-day UTC interval, exclusive end. Boundary day is not included.
    start,end=1789776000,1792368000
    for address,h in history.items():
        v=[r for r in h['volume'] if start<=r['timestamp']<end]
        fees=[float(r['fees']) for r in v]
        if len(fees)==30 and st.mean(fees)>0:
            daily.append(dict(address=address,days=len(fees),fee_cv=st.pstdev(fees)/st.mean(fees),
              largest_day_fee_share=max(fees)/sum(fees),zero_fee_days=sum(x==0 for x in fees)))
    positions=load('data/phase4/position_lifecycles.json')
    raw_events=Counter(e['event'] for p in positions for e in p['events'])
    events=Counter(e['event'] for p in positions for n,e in enumerate(p['events'])
                   if n not in {a['compatibility_event'] for a in p['alias_pairs']})
    tx={t['signature'] for p in positions for t in p['transactions']}
    result=dict(pools=len(pools),sample_tvl=sum(tvls),top10_tvl_share=sum(tvls[:10])/sum(tvls),
      hhi=sum((x/sum(tvls))**2 for x in tvls),median_tvl=st.median(tvls),
      volume_tvl_median=st.median(values('volume_tvl_24h')),
      volume_tvl_above_one=sum(x>1 for x in values('volume_tvl_24h')),
      volume_tvl_denominator=len(values('volume_tvl_24h')),
      fees_tvl_median=st.median(values('fees_tvl_24h')),
      fee_history_start_utc='2026-09-19T00:00:00Z',fee_history_end_exclusive_utc='2026-10-19T00:00:00Z',
      fee_history_pools=len(daily),all_zero_fee_history_pools=len(history)-len(daily),
      fee_cv_median=st.median(x['fee_cv'] for x in daily),
      fee_cv_min=min(x['fee_cv'] for x in daily),fee_cv_max=max(x['fee_cv'] for x in daily),
      median_largest_day_fee_share=st.median(x['largest_day_fee_share'] for x in daily),
      fee_history_by_pool=daily,position_count=len(positions),unique_transactions=len(tx),
      transactions_per_position=[len(p['transactions']) for p in positions],position_events=dict(events),
      raw_position_events_including_aliases=dict(raw_events))
    return result

def integrity():
    manifest=load('data/phase5/evidence_manifest.json');changed=[]
    for r in manifest:
        p=ROOT/Path(r['path'])
        if not p.exists() or hashlib.sha256(p.read_bytes()).hexdigest()!=r['sha256']:changed.append(r['path'])
    return dict(protected_files=len(manifest),changed_or_missing=changed)

if __name__=='__main__':
    result=dict(as_of='2026-10-20',requests=requests(),quantitative=quantitative(),financial_evidence_integrity=integrity())
    OUT.joinpath('offline_analysis.json').write_text(json.dumps(result,indent=2),encoding='utf-8')
    print(json.dumps({k:v if k!='quantitative' else {a:b for a,b in v.items() if a!='fee_history_by_pool'} for k,v in result.items()},indent=2))
