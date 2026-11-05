"""Replay REA 6.7.0 against selected inert public client sources.

Uses an already cached official npm CLI; never setup/MCP registration. All
output is research evidence. No target JS is executed and no endpoint invoked.
"""
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone
import json, os, re, shutil, subprocess
from pathlib import Path

BASE=Path(__file__).resolve().parent
OUT=BASE/'evidence'/'rea';OUT.mkdir(parents=True,exist_ok=True)
cache=Path(os.environ['LOCALAPPDATA'])/'npm-cache'/'_npx'
cli=next((p.parent/'scripts/rea.mjs' for p in cache.glob('*/node_modules/rea-agents/package.json') if json.loads(p.read_text(encoding='utf-8'))['version']=='6.7.0'),None)
if not cli:raise RuntimeError('Cache rea-agents@6.7.0 with npm before replay; no unpinned fallback')
CLIENT=BASE/'evidence'/'clients'
JOBS={
 'meteora':(CLIENT/'meteora',['13-index-0ca9d10682004d08.js','09-2394-b61dcf039a706b3b.js']),
 'tidepool':(CLIENT/'tidepool',['00-index-CeqUrI6T.js']),
 'lpagent':(CLIENT/'lpagent',[]),
 'geeklad':(CLIENT/'geeklad',[]),
 'poolparty-historical':(BASE.parents[1]/'data/poolparty_rea/public_assets',['_next/static/chunks/app/layout-5df69c64b00dd100.js','_next/static/chunks/app/beta/page-42cfd90b4f7f8ff1.js']),
}
def selected(root,name):
 ranked=[]
 for p in root.glob('*.js'):
  s=p.read_text(encoding='utf-8',errors='replace')
  terms=['api.lpagent.io','rt.lpagent.io','/api/','getTransactions','withdraw','rebalance','meteora-jupiter','MeteoraDlmm','geckoterminal','lite-api.jup.ag']
  score=sum(min(10,s.count(t)) for t in terms)
  ranked.append((score,p.stat().st_size,p.name))
 return [x[2] for x in sorted(ranked,reverse=True)[:3]]
def run(item):
 name,(root,paths)=item;paths=paths or selected(root,name)
 record={'product':name,'tool':'rea-agents','version':'6.7.0','source_root':str(root),'selected_paths':paths,'started_at':datetime.now(timezone.utc).isoformat(),'target_execution':False}
 cmd=[shutil.which('node'),str(cli),'analyze-javascript-application',str(root)]
 for p in paths:cmd+=['--source-path',p]
 cmd+=['--json'];record['command']=cmd
 try:
  with (OUT/f'{name}.json').open('wb') as stdout,(OUT/f'{name}.stderr.log').open('wb') as stderr:
   result=subprocess.run(cmd,cwd=BASE,stdout=stdout,stderr=stderr,timeout=360)
  record['exit_code']=result.returncode
  result=json.loads((OUT/f'{name}.json').read_text(encoding='utf-8-sig'))
  record['top_level_keys']=list(result)
  # Preserve complete evidence independently; summaries do not imply full coverage.
  record['evidence_id']=result.get('id',result.get('evidence_id'))
  normal=result.get('normalized_result',{})
  record['statistics']=normal.get('statistics',{})
  record['coverage']=normal.get('coverage',{})
 except Exception as e:record['error']=f'{type(e).__name__}: {e}'
 record['completed_at']=datetime.now(timezone.utc).isoformat()
 (OUT/f'{name}.run.json').write_text(json.dumps(record,indent=2),encoding='utf-8')
 print(json.dumps(record),flush=True)
 return record
if __name__=='__main__':
 with ThreadPoolExecutor(max_workers=2) as executor:results=list(executor.map(run,JOBS.items()))
 (OUT/'runs.json').write_text(json.dumps(results,indent=2),encoding='utf-8')
