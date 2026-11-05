"use client";
import { useEffect, useRef, useState } from "react";
import type { Brief, Lookup, Position } from "../../lib/models";
import { amount, qualityNotes } from "../presentation";
import { Brand, Icon, RangeDiagram, RangeStatus } from "./RangeUI";
import { ActionAnalysis, ActionTabs, TechnicalDetails, type Action } from "./Decision";
import { PilotAccess, type Access } from "../PilotAccess";
import { Feedback } from "./Feedback";
import { DataCoverage } from "./DataCoverage";
import { refreshedSelection } from "../recovery";
import { Portfolio } from "./Portfolio";
import { mergePortfolio,replacePortfolioPosition } from "../portfolio";

const SOL="So11111111111111111111111111111111111111112",USDC="EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
type Screen="search"|"portfolio"|"position"|"decision";
type Results=Lookup & {handles:Record<string,string>};
type Query={kind:"wallet"|"position";address:string;page?:number;pool?:string;refresh?:boolean;cursor?:string};
type LookupIntent="search"|"page"|"refresh"|"detail";
class RequestError extends Error{constructor(message:string,public status:number,public code?:string){super(message);}}
async function post<T>(url:string,data:unknown):Promise<T>{const r=await fetch(url,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(data),signal:AbortSignal.timeout(90000)});const v=await r.json();if(!r.ok)throw new RequestError(v.error||"The request could not be completed.",r.status,v.code);return v;}
function short(value:string){return `${value.slice(0,5)}…${value.slice(-5)}`;}
function age(value:number,now:number){const s=Math.max(0,Math.floor((now-value)/1000));return s<60?`${s}s ago`:`${Math.floor(s/60)}m ago`;}
function exportBrief(brief:Brief){const url=URL.createObjectURL(new Blob([JSON.stringify({...brief,feedbackToken:undefined},null,2)],{type:"application/json"}));const a=document.createElement("a");a.href=url;a.download="range-position-brief.json";a.click();URL.revokeObjectURL(url);}

export default function Page(){
 const [screen,setScreen]=useState<Screen>("search"),[input,setInput]=useState(""),[results,setResults]=useState<Results|null>(null),[selected,setSelected]=useState(""),[brief,setBrief]=useState<Brief|null>(null);
 const [kind,setKind]=useState<Query["kind"]>("wallet"),[busy,setBusy]=useState(""),[error,setError]=useState<RequestError|null>(null),[now,setNow]=useState(0),[action,setAction]=useState<Action>("hold");
 const [exitMint,setExitMint]=useState(USDC),[target,setTarget]=useState(50),[slippage,setSlippage]=useState(50);
 const [access,setAccess]=useState<Access|null>(null),[accessMounted,setAccessMounted]=useState(false),[accessOpen,setAccessOpen]=useState(false),[accessVersion,setAccessVersion]=useState(0);
 const [previousAnalysis,setPreviousAnalysis]=useState(false),[refreshNotice,setRefreshNotice]=useState("");
 const [portfolioNotice,setPortfolioNotice]=useState("");
 const probeOnEmpty=useRef<string|null>(null);
 const resumeDecision=useRef(false),resumePortfolio=useRef(false),refreshInFlight=useRef(false);
 const pending=useRef<{query:Query;intent:LookupIntent}|null>(null),main=useRef<HTMLElement>(null),previousScreen=useRef<Screen>("search");
 const lookupInFlight=useRef(false),portfolioScroll=useRef(0),restorePortfolio=useRef(false);
 const p=screen==="decision"?brief?.position:results?.positions.find(v=>v.address===selected)??brief?.position;
 const demo=results?.mode==="demo"||brief?.mode==="demo";
 const stale=!!p&&(!p.updatedAt||now-p.updatedAt*1000>120000||p.updatedAt*1000>now+30000);
 const invalidSettings=!Number.isFinite(target)||target<0||target>100||!Number.isInteger(slippage)||slippage<1||slippage>500;
 const dirty=!!brief&&(brief.exitMint!==exitMint||brief.targetXPercent!==target||brief.slippageBps!==slippage);
 useEffect(()=>{setNow(Date.now());const id=setInterval(()=>setNow(Date.now()),1000);return()=>clearInterval(id);},[]);
 useEffect(()=>{if(previousScreen.current!==screen){previousScreen.current=screen;
  if(screen==="portfolio"&&restorePortfolio.current){restorePortfolio.current=false;const frame=requestAnimationFrame(()=>{window.scrollTo({top:portfolioScroll.current,behavior:"instant"});main.current?.querySelector<HTMLElement>(`[data-position="${selected}"]`)?.focus({preventScroll:true});});return()=>cancelAnimationFrame(frame);}
  window.scrollTo({top:0,behavior:"instant"});main.current?.querySelector<HTMLElement>("h1")?.focus({preventScroll:true});}},[screen,selected]);
 useEffect(()=>{
  if(!results?.aggregationId||results.aggregate?.status!=='running')return;
  const id=results.aggregationId;let cancelled=false,timer:ReturnType<typeof setTimeout>;
  const poll=async()=>{try{const response=await fetch('/api/portfolio/aggregate?id='+id,{signal:AbortSignal.timeout(30000)});const value=await response.json();if(!response.ok)throw new RequestError(value.error,response.status);if(cancelled)return;
   if(value.aggregate.status==='ready'&&value.aggregate.complete&&value.aggregate.discovered===0&&probeOnEmpty.current){
    const address=probeOnEmpty.current;probeOnEmpty.current=null;
    try{const direct=await post<Results>('/api/positions',{kind:'position',address});if(cancelled)return;if(direct.positions.length){setResults(direct);setKind('position');setSelected(direct.positions[0].address);setScreen('position');setPortfolioNotice('');return;}}
    catch(e){if(!(e instanceof RequestError)||!['UNSUPPORTED_POSITION_ACCOUNT','POSITION_ACCOUNT_NOT_FOUND'].includes(e.code||'')){probeOnEmpty.current=address;throw e;}}
   }
   setResults(old=>old?.aggregationId===id?{...old,...value}:old);if(value.aggregate.status==='running')timer=setTimeout(poll,10000);else if(value.aggregate.status==='failed')setError(new RequestError(value.aggregate.error||'Portfolio aggregation failed. Refresh to retry.',503));else setPortfolioNotice('Wallet aggregation finished. Totals cover the server snapshot; rows are paginated.');
  }catch(e){if(cancelled)return;const problem=e instanceof RequestError?e:new RequestError('Portfolio status unavailable. Refresh to retry.',503);setError(problem);if(problem.status===401){resumePortfolio.current=true;setAccessMounted(true);setAccessOpen(true);setAccessVersion(v=>v+1);}else if(problem.status!==409)timer=setTimeout(poll,15000);}};
  timer=setTimeout(poll,1000);return()=>{cancelled=true;clearTimeout(timer);};
 },[results?.aggregationId,results?.aggregate?.status,access?.authenticated]);
 function errorFrom(e:unknown){return e instanceof RequestError?e:new RequestError(e instanceof Error?e.message:"Data is temporarily unavailable. Please try again.",503);}
 async function runLookup(query:Query,auto=false,intent:LookupIntent="search"){
  if(lookupInFlight.current)return;lookupInFlight.current=true;
  setBusy("lookup");setError(null);
  try{
   let r:Results,resolved=query.kind;
   if(intent==='page'&&results?.aggregationId){const response=await fetch('/api/portfolio/aggregate?'+new URLSearchParams({id:results.aggregationId,cursor:query.cursor??results.rowCursor??''}),{signal:AbortSignal.timeout(30000)});const value=await response.json();if(!response.ok)throw new RequestError(value.error,response.status);r=value;}
   else r=await post<Results>("/api/positions",intent==='refresh'&&results?.aggregationId?{...query,refresh:true}:query);
   // Wallet lookup is authoritative when nonempty or partial. Only an empty, warning-free
   // result is followed by the existing verified PositionV2 route; provider failures are not masked.
   if(auto&&(!r.aggregationId||r.aggregate?.status==='ready'&&r.aggregate.complete)&&!r.positions.length&&!r.warnings.length&&!r.hasNextPools&&!r.morePositions.length){
    try{r=await post<Results>("/api/positions",{kind:"position",address:query.address});resolved="position";}
    catch(e){
     // A non-position account is normal for wallet input, not an indexing failure.
     // Only these verified account classifications are safe to suppress; timeouts,
     // decoding/index failures and arbitrary 400/404 responses remain errors.
     if(!(e instanceof RequestError)||!["UNSUPPORTED_POSITION_ACCOUNT","POSITION_ACCOUNT_NOT_FOUND"].includes(e.code||""))throw e;
    }
   }
   if(intent==="page"){
    const merged=r.aggregationId?r:results?mergePortfolio(results,r,query.pool):r;
    setResults(merged);setPortfolioNotice(r.aggregationId?"Position page changed. The wallet summary still covers the server snapshot.":"Another page loaded. Earlier rows retain their observations until refreshed.");
   }else if(intent==="detail"){
    if(!p)throw new Error("Select a position to refresh.");
    const fresh=refreshedSelection(r,p);setResults(old=>old?replacePortfolioPosition(old,fresh.position,fresh.handle):r);setBrief(null);setPreviousAnalysis(false);setRefreshNotice("Position refreshed. The displayed figures have been updated.");
   }else{
    probeOnEmpty.current=auto&&r.aggregationId&&r.aggregate?.status==='running'?query.address:null;
    setResults(r);setSelected(r.positions.some(v=>v.address===selected)?selected:resolved==="wallet"?"":r.positions[0]?.address||"");setKind(resolved);setBrief(null);setPreviousAnalysis(false);setRefreshNotice("");setAction("hold");setExitMint(USDC);setTarget(50);setSlippage(50);
    setPortfolioNotice(intent==="refresh"?(r.aggregationId?"Wallet refresh started. Current totals are unavailable until the new server snapshot is ready.":"First page refreshed. Load additional pages again to update the rest of this portfolio."):"");
    setScreen(resolved==="wallet"?"portfolio":"position");
   }
   setAccessOpen(false);
  }catch(e){const problem=errorFrom(e);setError(problem);if(problem.status===401){setAccess(null);pending.current={query,intent};setAccessVersion(v=>v+1);setAccessMounted(true);setAccessOpen(true);}}
  finally{lookupInFlight.current=false;setBusy("");}
 }
 function accessChanged(value:Access){
  setAccess(value);
  if(resumeDecision.current&&!value.checking&&(!value.required||value.authenticated)){resumeDecision.current=false;setAccessOpen(false);void refreshDecision();}
  else if(resumePortfolio.current&&!value.checking&&(!value.required||value.authenticated)){resumePortfolio.current=false;setAccessOpen(false);}
  else if(pending.current&&!value.checking&&(!value.required||value.authenticated)){const {query,intent}=pending.current;pending.current=null;setAccessOpen(false);void runLookup(query,intent==="search",intent);}
  else if(!value.authenticated&&value.required&&!pending.current&&!resumeDecision.current&&!resumePortfolio.current){setResults(null);setBrief(null);setSelected("");setAccessOpen(false);setScreen("search");}
 }
 async function analyze(event:React.FormEvent){event.preventDefault();setError(null);
  if(!/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(input.trim())){setError(new RequestError("Enter one public Solana wallet or position address.",400));return;}
  const query:Query={kind:"wallet",address:input.trim()};
  if(access&&!access.checking&&(!access.required||access.authenticated)){await runLookup(query,true);return;}
  pending.current={query,intent:"search"};setAccessMounted(true);setAccessOpen(true);
 }
 async function loadDemo(){setBusy("demo");setError(null);try{const r=await fetch("/api/demo",{signal:AbortSignal.timeout(30000)});if(!r.ok)throw new RequestError("The demo is temporarily unavailable.",r.status);const b=await r.json() as Brief;setBrief(b);setResults({mode:"demo",snapshotId:b.id,positions:[b.position],warnings:[],hasNextPools:false,poolPage:1,morePositions:[],handles:{}});setSelected(b.position.address);setKind("wallet");setPortfolioNotice("");setExitMint(b.exitMint);setTarget(b.targetXPercent);setSlippage(b.slippageBps);setAction("hold");setScreen("portfolio");}catch(e){setError(errorFrom(e));}finally{setBusy("");}}
 function openPosition(address:string){portfolioScroll.current=window.scrollY;setSelected(address);if(!demo)setBrief(null);setError(null);setPreviousAnalysis(false);setRefreshNotice("");setAction("hold");setExitMint(demo&&brief?brief.exitMint:USDC);setTarget(demo&&brief?brief.targetXPercent:50);setSlippage(demo&&brief?brief.slippageBps:50);setScreen("position");}
 function back(){setError(null);if(screen==="decision")setScreen("position");else if(screen==="position"&&kind==="wallet"&&results){restorePortfolio.current=true;setScreen("portfolio");}else newSearch();}
 async function compare(){if(!p||invalidSettings)return;if(demo){setAction("hold");setScreen("decision");return;}if(!results)return;
  setBusy("quotes");setError(null);try{
   let b:Brief,refreshed=false;
   const requestBrief=(handle:string)=>post<Brief>("/api/brief",{handle,exitMint,targetXPercent:target,slippageBps:slippage});
   try{b=await requestBrief(results.handles[p.address]);}
   catch(e){if(!(e instanceof RequestError)||e.status!==409)throw e;
    const r=await post<Results>("/api/positions",{kind:"position",address:p.address}),fresh=refreshedSelection(r,p);
    b=await requestBrief(fresh.handle);refreshedSelection({...r,positions:[b.position]},p);if(b.mode!=="live")throw new Error("A live position analysis was unavailable.");
    setResults(old=>old?replacePortfolioPosition(old,b.position,fresh.handle):r);refreshed=true;
   }
   setBrief(b);setPreviousAnalysis(false);setRefreshNotice(refreshed?"Position refreshed before comparison. The displayed figures have been updated.":"");setScreen("decision");
  }catch(e){setError(errorFrom(e));}finally{setBusy("");}}
 async function refreshDecision(){
  if(!brief||demo||invalidSettings||refreshInFlight.current)return;
  refreshInFlight.current=true;setBusy("refresh");setError(null);setRefreshNotice("");setPreviousAnalysis(true);
  const previous=brief.position;
  try{
   const r=await post<Results>("/api/positions",{kind:"position",address:previous.address});
   const {position,handle}=refreshedSelection(r,previous);
   const b=await post<Brief>("/api/brief",{handle,exitMint,targetXPercent:target,slippageBps:slippage});
   // Both views commit together; no fresh inventory may be paired with old quotes.
   refreshedSelection({ ...r, positions:[b.position] },previous);
   if(b.mode!=="live")throw new Error("A live replacement analysis was unavailable. The previous analysis has been retained.");
   setResults(old=>old?{...old,positions:old.positions.map(v=>v.address===position.address?b.position:v),handles:{...old.handles,[position.address]:handle},warnings:[...new Set([...old.warnings,...r.warnings])]}:r);
   setBrief(b);setSelected(position.address);setPreviousAnalysis(false);setNow(Date.now());setAccessOpen(false);
   setRefreshNotice(b.exit.status==="unavailable"||b.rebalance.status==="unavailable"?"Analysis updated. Some conversion estimates are unavailable; review the notices below.":"Position and quotes refreshed. The displayed figures have been updated.");
  }catch(e){
   const problem=errorFrom(e);setError(problem);
   if(problem.status===401){resumeDecision.current=true;setAccess(null);setAccessVersion(v=>v+1);setAccessMounted(true);setAccessOpen(true);}
  }finally{refreshInFlight.current=false;setBusy("");}
 }
 function newSearch(){probeOnEmpty.current=null;pending.current=null;resumeDecision.current=false;restorePortfolio.current=false;portfolioScroll.current=0;setPortfolioNotice("");setAccessOpen(false);setResults(null);setBrief(null);setSelected("");setError(null);setPreviousAnalysis(false);setRefreshNotice("");setScreen("search");}
 return <><a className="skip-link" href="#workspace">Skip to content</a><header className="site-header"><Brand/>{screen!=="search"&&<span className="screen-label">{screen==="portfolio"?"Your portfolio":screen==="position"?"Your position":"Your options"}</span>}</header>
 <main ref={main} id="workspace" className={`workspace screen-${screen}`} tabIndex={-1}>
  {screen==="search"&&<section className="search-screen" aria-label="Search"><h1 tabIndex={-1}>Know your <span>position.</span></h1><form onSubmit={analyze} className="search-form"><label className="sr-only" htmlFor="address">Public Solana address</label><div className="search-control"><input id="address" value={input} onChange={e=>{setInput(e.target.value);setError(null);}} placeholder="Wallet or position address" autoComplete="off" spellCheck={false} autoCapitalize="none" required maxLength={44} disabled={!!busy||accessOpen} aria-invalid={error?.status===400||undefined}/><button className="primary" disabled={!!busy||accessOpen}>{busy==="lookup"?"Analyzing…":"Analyze"}<Icon name="arrow"/></button></div></form><button className="text-button demo-link" disabled={!!busy} onClick={loadDemo}>Try Demo</button><p className="supporting lookup-privacy">Read-only. Public addresses are sent to Meteora for lookup.</p><DataCoverage/></section>}
  {screen!=="search"&&<nav className="back-nav" aria-label="Screen navigation"><button className="text-button" disabled={!!busy} onClick={back}>← {screen==="decision"?"Back to position":screen==="position"&&kind==="wallet"&&results?"Back to portfolio":"New search"}</button>{!demo&&<button className="text-button" disabled={!!busy} onClick={()=>{setAccessMounted(true);setAccessOpen(!accessOpen);}}>Pilot access</button>}</nav>}
  {accessMounted&&<aside hidden={!accessOpen} className="access-interstitial"><PilotAccess key={accessVersion} onChange={accessChanged}/><button className="text-button" disabled={!!busy} onClick={()=>{pending.current=null;resumeDecision.current=false;resumePortfolio.current=false;setAccessOpen(false);setError(null);}}>Close</button></aside>}
  {busy&&<p className="progress" role="status"><span className="spinner"/>{busy==="lookup"?"Reading public position data…":busy==="quotes"?"Getting current Jupiter quotes…":busy==="refresh"?"Refreshing your position and Jupiter quotes…":"Loading the demo…"}</p>}
  {error&&<p className="error" role="alert">{error.message}</p>}
  {screen==="portfolio"&&results&&<Portfolio results={results} address={input.trim()} now={now} busy={!!busy} notice={portfolioNotice} selected={selected} onOpen={openPosition} onRefresh={()=>runLookup({kind:"wallet",address:input.trim()},false,"refresh")} onMore={(pool,page)=>runLookup({kind:"wallet",address:input.trim(),pool,page},false,"page")} onPrevious={()=>runLookup({kind:"wallet",address:input.trim(),page:Math.max(1,results.poolPage-1),cursor:results.previousCursor!},false,"page")} onSearch={newSearch} onAccessRequired={()=>{resumePortfolio.current=true;setAccessMounted(true);setAccessOpen(true);setAccessVersion(v=>v+1);}}/>}
  {screen==="position"&&<section className="position-screen" aria-label="Position">
   {p?<>{results&&results.positions.length>1&&<label className="position-picker">Select position<select value={selected} onChange={e=>{setSelected(e.target.value);setBrief(null);setError(null);setAction("hold");}} disabled={!!busy}>{results.positions.map(v=><option value={v.address} key={v.address}>{v.pair} · {short(v.address)}</option>)}</select></label>}
    <div className="position-heading"><div><span className="eyebrow">{demo?"Demo · synthetic data":"Meteora DLMM · indexed estimate"}</span><h1 tabIndex={-1}>{p.pair}</h1></div><RangeStatus status={p.rangeStatus}/></div>
    <div className="position-metrics"><div><span className="metric-label">Position value · USD</span><strong className="value-unavailable">Unavailable</strong><p className="supporting">Individual USD valuation is not available in this view.</p></div><div><span className="metric-label">Unclaimed fees</span><div className="fee-amount">{amount(p.fees.x)} <small>{p.x.symbol}</small><br/>{amount(p.fees.y)} <small>{p.y.symbol}</small></div><p className="supporting">Separate from principal; claim costs unpriced.{p.rewardsPresent?" Rewards also excluded.":""}</p></div></div>
    <RangeDiagram position={p}/>
    <div className="position-footer"><span className={stale&&!demo?"freshness stale":"freshness"}>{demo?"Invented demo values":p.updatedAt?`Snapshot ${age(p.updatedAt*1000,now)}`:"Timestamp unavailable"}</span>{!demo&&<button className="text-button" disabled={!!busy} onClick={()=>runLookup({kind:"position",address:p.address},false,"detail")}>Refresh position</button>}</div>
    {refreshNotice&&<p className="supporting" role="status">{refreshNotice}</p>}
    {stale&&!demo&&<p className="notice">Snapshot is missing, old or inconsistent. Refresh before comparing.</p>}
    {p.warnings.length>0&&!demo&&<div className="data-notice">{qualityNotes(p.warnings).map(w=><p key={w}>{w}</p>)}</div>}
    <button className="primary compare-button" disabled={!!busy||results?.aggregate?.status==='running'} onClick={compare}>{busy==="quotes"?"Getting quotes…":"Compare options"}<Icon name="arrow"/></button>
   </>:<><h1 tabIndex={-1}>{results&&(results.warnings.length>0||results.hasNextPools||results.morePositions.length>0)?"Position discovery incomplete.":"No supported positions returned."}</h1><p className="supporting">{results&&(results.warnings.length>0||results.hasNextPools||results.morePositions.length>0)?"Some data could not be checked or more results are available. This is not confirmation that no positions exist.":"The Meteora index returned no supported open DLMM positions for this address. The index can lag; closed positions and other Meteora protocols are not covered."}</p><button className="primary" disabled={!!busy} onClick={newSearch}>Try another address</button></>}
   {results&&results.warnings.length>0&&<div className="data-notice">{qualityNotes(results.warnings).map(w=><p key={w}>{w}</p>)}</div>}
   <DataCoverage/>
  </section>}
  {screen==="decision"&&brief&&p&&<section className="decision-screen" aria-label="Decision" aria-busy={busy==="refresh"}><div className="decision-heading"><h1 tabIndex={-1}>{p.pair}</h1><span className="eyebrow">{demo?"Demo · synthetic data":"Read-only analysis"}</span></div>
   {previousAnalysis&&<p className="notice" role="status">{busy==="refresh"?"Refreshing. The previous analysis is shown for reference until the replacement is ready.":"Refresh incomplete. The previous analysis is shown for reference; do not treat it as current."}</p>}
   {refreshNotice&&<p className="supporting" role="status">{refreshNotice}</p>}
   {stale&&!demo&&<p className="notice">The position snapshot is old or unavailable. Refresh it before relying on these estimates.</p>}
   {p.warnings.length>0&&!demo&&<div className="data-notice">{qualityNotes(p.warnings).map(w=><p key={w}>{w}</p>)}</div>}
   <ActionTabs value={action} onChange={setAction}/><ActionAnalysis key={`analysis-${action}`} brief={brief} action={action} now={now} previous={previousAnalysis}/>
   <div className="decision-tools">{!demo&&<button className="text-button" disabled={!!busy||invalidSettings||accessOpen} onClick={refreshDecision}>Refresh position & quotes</button>}<button className="text-button" disabled={!!busy||previousAnalysis} onClick={()=>exportBrief(brief)}>Export analysis</button></div>
   {!demo&&<details className="disclosure settings"><summary>Comparison settings</summary><div className="disclosure-body"><p>Defaults: USDC exit, 50% token X by pool value, 0.5% slippage cap. These are scenarios, not recommendations.</p><div className="settings-grid"><label>Exit into<select value={exitMint} onChange={e=>setExitMint(e.target.value)} disabled={!!busy}>{[...new Map([{mint:USDC,symbol:"USDC"},{mint:SOL,symbol:"SOL"},p.x,p.y].map(t=>[t.mint,t])).values()].map(t=><option key={t.mint} value={t.mint}>{t.symbol}</option>)}</select></label><label>Target {p.x.symbol} share (%)<input type="number" min="0" max="100" step="1" value={target} onChange={e=>setTarget(Number(e.target.value))} disabled={!!busy}/></label><label>Slippage cap (bps)<input type="number" min="1" max="500" step="1" value={slippage} onChange={e=>setSlippage(Number(e.target.value))} disabled={!!busy}/></label></div><button className="secondary" disabled={!!busy||invalidSettings||accessOpen} onClick={refreshDecision}>Update quotes</button></div></details>}
   {dirty&&<p className="notice">Settings changed. Refresh quotes to apply them; the displayed analysis still uses the previous settings.</p>}{invalidSettings&&<p className="error" role="alert">Use an allocation from 0–100% and a whole-number slippage cap from 1–500 bps.</p>}
   <TechnicalDetails key={`technical-${action}`} brief={brief} action={action}/>
   <DataCoverage/>
   <details className="disclosure feedback-wrapper"><summary>Pilot feedback</summary><Feedback key={brief.id} brief={brief} authenticated={!!access?.authenticated}/></details>
  </section>}
 </main></>;
}
