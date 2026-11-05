"""Offline QA for research deliverables; no collection or profitability calculation."""
import csv
import hashlib
import json
import re
from datetime import datetime
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
def read(path): return json.loads((ROOT/path).read_text(encoding='utf-8'))

def main():
    reports=['COMPETITOR_LANDSCAPE.md','ECOSYSTEM_INTEGRATION_MAP.md','OPPORTUNITY_SCORECARD.md','FUNDING_PATHWAYS.md','PRODUCT_RECOMMENDATION.md']
    for name in reports:
        text=(ROOT/name).read_text(encoding='utf-8')
        assert len(text)>1000 and '2026-10-20' in text, name
        assert re.search(r'\]\(https://',text),name
        for dest in re.findall(r'\]\(([^)]+)\)',text):
            if not dest.startswith(('https://','http://','#')):assert (ROOT/dest).exists(),(name,dest)
    with (ROOT/'USER_PAIN_POINTS.csv').open(encoding='utf-8') as f: rows=list(csv.DictReader(f))
    assert len(rows)>=30
    assert len({x['source_url'] for x in rows})==len(rows)
    assert len({x['evidence_id'] for x in rows})==len(rows)
    for x in rows:
        assert all(x.values()),x['evidence_id']
        assert datetime.fromisoformat(x['date'].replace('Z','+00:00')).date()<=datetime(2026,10,20).date()
        assert (ROOT/x['evidence_file']).exists(),x['evidence_file']
    inputs=read('data/opportunity_validation/score_inputs.json')
    assert abs(sum(inputs['weights'].values())-1)<1e-12
    scores={name:round(sum(values[k]*v for k,v in inputs['weights'].items())*20,1) for name,values in inputs['scores'].items()}
    scorecard=(ROOT/'OPPORTUNITY_SCORECARD.md').read_text(encoding='utf-8')
    for value in scores.values():assert str(value) in scorecard
    stats=read('data/opportunity_validation/offline_analysis.json')
    assert stats['requests']['records']==len(rows)
    assert stats['quantitative']['fee_history_pools']+stats['quantitative']['all_zero_fee_history_pools']==24
    protected=read('data/phase5/evidence_manifest.json')
    changed=[x['path'] for x in protected if not (ROOT/x['path']).exists() or hashlib.sha256((ROOT/x['path']).read_bytes()).hexdigest()!=x['sha256']]
    assert not changed,changed
    result={'status':'passed','dated_records':len(rows),'threads':len({x['thread_id'] for x in rows}),
      'deliverables':len(reports)+1,'scores':scores,'protected_evidence_files_unchanged':len(protected),
      'external_links':'citation syntax checked; not a claim every remote endpoint is reachable',
      'scope':'offline research QA; not proof of market demand or competitor execution reliability'}
    (ROOT/'data/opportunity_validation/qa_results.json').write_text(json.dumps(result,indent=2),encoding='utf-8')
    print(json.dumps(result,indent=2))

if __name__=='__main__':main()
