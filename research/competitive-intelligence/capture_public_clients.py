"""Research-only public HTML/referenced JS collection; no client execution or API calls.

TLS validation stays enabled. No login/cookies, route guessing, map guessing,
private endpoints, transaction construction, or RANGE application changes.
"""
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone
from hashlib import sha256
from html.parser import HTMLParser
import json
from pathlib import Path
import re
from urllib.parse import urljoin, urlparse
from urllib.request import Request, urlopen
from urllib.error import HTTPError
from types import SimpleNamespace

ROOT=Path(__file__).resolve().parent/'evidence'/'clients'
TARGETS={
 'meteora':'https://app.meteora.ag/',
 'poolparty':'https://lppool.party/',
 'hawkfi':'https://www.hawkfi.ag/',
 'tidepool':'https://tidepool.ag/',
 'lpagent':'https://app.lpagent.io/',
 'kamino':'https://app.kamino.finance/',
 'revert':'https://revert.finance/',
 'defituna':'https://app.defituna.com/',
 'geeklad':'https://geeklad.github.io/meteora-profit-analysis/',
 'step':'https://step.finance/',
}
class HTML(HTMLParser):
 def __init__(self):super().__init__();self.scripts=[];self.links=[]
 def handle_starttag(self,tag,attrs):
  a=dict(attrs)
  if tag=='script' and a.get('src'):self.scripts.append(a['src'])
  if tag=='link' and a.get('href') and (a.get('rel')=='modulepreload' or (a.get('as')=='script')):self.scripts.append(a['href'])
  if tag=='a' and a.get('href'):self.links.append(a['href'])
def get(url,max_bytes):
 request=Request(url,headers={'User-Agent':'RANGE-public-research/1.0 (read-only public source inspection)'})
 try:response=urlopen(request,timeout=35)
 except HTTPError as error:response=error
 with response as r:
  body=r.read(max_bytes+1)
  if len(body)>max_bytes:raise ValueError('public response exceeds declared byte budget')
  return SimpleNamespace(status_code=r.status,url=r.url,headers=r.headers),body
def collect(item):
 name,url=item;folder=ROOT/name;folder.mkdir(parents=True,exist_ok=True)
 out={'product':name,'requested_url':url,'accessed_at':datetime.now(timezone.utc).isoformat(),'assets':[],'limits':{'max_referenced_scripts':32,'max_asset_bytes':8_000_000,'total_asset_bytes':32_000_000},'target_execution':False}
 try:
  r,body=get(url,3_000_000);out.update(status=r.status_code,final_url=r.url,html_sha256=sha256(body).hexdigest(),html_bytes=len(body));(folder/'index.html').write_bytes(body)
  if r.status_code!=200:out['limitation']='non-200 page; no asset requests made'
  else:
   h=HTML();h.feed(body.decode('utf-8',errors='replace'));out['public_links']=h.links;urls=list(dict.fromkeys(urljoin(r.url,s) for s in h.scripts));out['referenced_scripts']=len(urls)
   total=0
   for i,asset_url in enumerate(urls[:32]):
    parsed=urlparse(asset_url)
    if parsed.scheme!='https' or not parsed.path.endswith(('.js','.mjs')):continue
    a={'url':asset_url,'html_reference_order':i}
    try:
     response,data=get(asset_url,8_000_000);a['status']=response.status_code
     if response.status_code==200 and 'html' not in response.headers.get('content-type',''):
      if total+len(data)>32_000_000:a['limitation']='total asset byte budget reached';out['assets'].append(a);break
      filename=f'{i:02d}-'+re.sub(r'[^a-zA-Z0-9._-]','_',Path(parsed.path).name);(folder/filename).write_bytes(data);total+=len(data);a.update(file=filename,bytes=len(data),sha256=sha256(data).hexdigest())
    except Exception as e:a['error']=f'{type(e).__name__}: {str(e)[:180]}'
    out['assets'].append(a)
   out['downloaded_bytes']=total
 except Exception as e:out['error']=f'{type(e).__name__}: {str(e)[:240]}'
 (folder/'capture.json').write_text(json.dumps(out,indent=2),encoding='utf-8')
 print(json.dumps({k:out.get(k) for k in ['product','status','referenced_scripts','downloaded_bytes','error']}),flush=True)
 return out
if __name__=='__main__':
 ROOT.mkdir(parents=True,exist_ok=True)
 with ThreadPoolExecutor(max_workers=3) as executor:results=list(executor.map(collect,TARGETS.items()))
 (ROOT/'manifest.json').write_text(json.dumps(results,indent=2),encoding='utf-8')
