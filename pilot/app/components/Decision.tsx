"use client";
import type { KeyboardEvent } from "react";
import type { Brief, Position, Quote } from "../../lib/models";
import { D, units } from "../../lib/math";
import { amount } from "../presentation";
export type Action="hold"|"rebalance"|"exit";
const actions:Action[]=["hold","rebalance","exit"];
export function ActionTabs({value,onChange}:{value:Action;onChange:(action:Action)=>void}){
 function navigate(e:KeyboardEvent<HTMLButtonElement>,index:number){let next=index;if(e.key==="ArrowRight")next=(index+1)%3;else if(e.key==="ArrowLeft")next=(index+2)%3;else if(e.key==="Home")next=0;else if(e.key==="End")next=2;else return;e.preventDefault();onChange(actions[next]);document.getElementById(`tab-${actions[next]}`)?.focus();}
 return <div className="action-tabs" role="tablist" aria-label="Position actions">{actions.map((action,i)=><button key={action} type="button" role="tab" id={`tab-${action}`} aria-selected={value===action} aria-controls="action-panel" tabIndex={value===action?0:-1} onClick={()=>onChange(action)} onKeyDown={e=>navigate(e,i)}>{action.toUpperCase()}</button>)}</div>;
}
function Tokens({p}:{p:Position}){return <div className="outcomes"><div><strong>{amount(p.inventory.x)}</strong><span>{p.x.symbol}</span></div><div><strong>{amount(p.inventory.y)}</strong><span>{p.y.symbol}</span></div></div>;}
function impact(q:Quote){return q.priceImpactPercent===null?"unavailable":`${new D(q.priceImpactPercent).toDecimalPlaces(2).toString()}%`;}
export function ActionAnalysis({brief,action,now,previous=false}:{brief:Brief;action:Action;now:number;previous?:boolean}){
 const hold=action==="hold",exit=action==="exit",scenario=exit?brief.exit:brief.rebalance,p=brief.position;
 const stale=!hold&&brief.mode==="live"&&(now-brief.generatedAt>30000||scenario.swaps.some(q=>now-q.receivedAt>30000));
 const latest=Math.min(...scenario.swaps.map(q=>q.receivedAt));
 return <section id="action-panel" role="tabpanel" aria-labelledby={`tab-${action}`} tabIndex={0} className="action-panel">
  <div className="analysis-heading"><h2>{hold?"Keep your position":exit?"Convert your liquidity":"Change your token mix"}</h2><span className={stale||previous?"freshness stale":"freshness"}>{previous?"Previous analysis":hold?(brief.mode==="demo"?"Synthetic snapshot":"Indexed snapshot"):brief.mode==="demo"?"Synthetic estimate":scenario.status==="unavailable"?"Unavailable":scenario.status==="no-swap"?"No swap needed":stale?"Stale quote":`Quote received ${Math.max(0,Math.floor((now-latest)/1000))}s ago`}</span></div>
  <p className="action-description">{hold?"Keep your current exposure. Your tokens remain sensitive to price changes.":exit?"Withdraw principal, then swap into your selected asset.":`Withdraw and swap toward ${brief.targetXPercent}% ${p.x.symbol} by current pool value. Redepositing adds costs.`}</p>
  {!hold&&!exit&&<p className="risk-note">Swap-only estimate. Moving your DLMM price range and redepositing liquidity are not simulated. This is not an executable rebalance.</p>}
  {stale&&!previous&&<p className="notice" role="status">Quotes are over 30 seconds old. Refresh before relying on them.</p>}
  {hold?<><span className="metric-label">Current exposure</span><Tokens p={p}/><dl className="cost-list"><div><dt>Immediate transaction cost</dt><dd>0 SOL <small>if you take no action</small></dd></div><div><dt>Range at snapshot</dt><dd>{p.rangeStatus.replaceAll("-"," ")}</dd></div></dl><p className="risk-note">Out-of-range liquidity may stop earning swap fees. Market, token, divergence and smart-contract risks remain.</p></>:<>
   {scenario.status==="unavailable"?<div className="notice" role="status"><strong>Estimate unavailable</strong><p>{scenario.error}</p></div>:<><span className="metric-label">{exit?"Estimated conversion output":"Estimated mix after swap"}</span><div className="outcomes">{scenario.output.map(o=><div key={o.token.mint}><strong>{amount(o.amount)}</strong><span>{o.token.symbol}</span><small>Quoted minimum {amount(o.minimum)} {o.token.symbol}</small></div>)}</div>
    {exit?<p className="supporting">Conditional withdrawal: {amount(p.inventory.x)} {p.x.symbol} + {amount(p.inventory.y)} {p.y.symbol}.</p>:scenario.achievedXPercent!==undefined&&<p className="supporting">Quoted allocation: {amount(scenario.achievedXPercent,1)}% {p.x.symbol} at the same pool mark.</p>}
    <dl className="cost-list">{scenario.swaps.length?scenario.swaps.map((q,i)=><div key={i}><dt>{q.input.symbol} → {q.output.symbol}</dt><dd>{q.feeBps===null?"Swap fee unknown":`${new D(q.feeBps).div(100).toString()}% fee included`}<small>Price impact {impact(q)}</small></dd></div>):<div><dt>Swap fees</dt><dd>0 <small>no swap needed</small></dd></div>}</dl>
    {scenario.swaps.some(q=>q.priceImpactPercent!==null&&new D(q.priceImpactPercent).isNegative())&&<p className="supporting">Negative impact is a quoted improvement, not realized savings.</p>}
   </>}
   <div className="cost-gap"><strong>Full execution cost unavailable</strong><p>{exit?"Withdrawal, claims and some network/account costs are unpriced.":"Withdrawal, redeposit and some network/account costs are unpriced."}</p></div>
   <p className="risk-note">Principal only; unclaimed fees and rewards are excluded. Withdrawal and swap success are not guaranteed.</p>
  </>}
 </section>;
}
export function TechnicalDetails({brief,action}:{brief:Brief;action:Action}){
 const p=brief.position,scenario=action==="exit"?brief.exit:action==="rebalance"?brief.rebalance:null;
 return <details className="disclosure"><summary>Technical details & assumptions</summary><div className="disclosure-body">
  <h3>Exact indexed inventory</h3><p className="mono">{p.inventory.x} {p.x.symbol} / {p.inventory.y} {p.y.symbol}</p>
  <dl className="technical-list"><div><dt>Exact unclaimed fees</dt><dd>{p.fees.x??"Unavailable"} {p.x.symbol} / {p.fees.y??"Unavailable"} {p.y.symbol}</dd></div><div><dt>Bins</dt><dd>{p.lowerBin} to {p.upperBin}</dd></div><div><dt>Price range</dt><dd>{p.minPrice} – {p.maxPrice}</dd></div><div><dt>Pool price</dt><dd>{p.poolPrice??"Unavailable"} {p.y.symbol}/{p.x.symbol}</dd></div><div><dt>Token decimals</dt><dd>{p.x.symbol}: {p.x.decimals}, {p.y.symbol}: {p.y.decimals}</dd></div><div><dt>Reported pool TVL</dt><dd>{p.poolTvlUsd===null?"Unavailable":`$${amount(p.poolTvlUsd,0)}`}</dd></div><div><dt>Balance timestamp</dt><dd>{p.updatedAt?new Date(p.updatedAt*1000).toISOString():"Unavailable"}</dd></div><div><dt>Retrieved</dt><dd>{new Date(p.retrievedAt).toISOString()}</dd></div></dl>
  <p>Indexed estimates are not a same-slot account reconstruction. Pool TVL does not establish your USD value or prove withdrawable reserves.</p>
  {scenario?.swaps.map((q,i)=><section key={i} className="raw-quote"><h3>Quote {i+1}: {q.input.symbol} → {q.output.symbol}</h3><dl className="technical-list"><div><dt>Input</dt><dd>{units(q.inAtomic,q.input.decimals)} {q.input.symbol}</dd></div><div><dt>Output</dt><dd>{units(q.outAtomic,q.output.decimals)} {q.output.symbol}</dd></div><div><dt>Minimum output</dt><dd>{units(q.minOutAtomic,q.output.decimals)} {q.output.symbol}</dd></div><div><dt>Slippage tolerance</dt><dd>{q.slippageBps} bps</dd></div><div><dt>Route fee</dt><dd>{q.feeBps===null?"Unknown":`${q.feeBps} bps, already included`}</dd></div><div><dt>Network estimate</dt><dd>{q.networkLamports===null?"Unknown":`${units(q.networkLamports,9)} SOL`}</dd></div><div><dt>Account rent estimate</dt><dd>{q.rentLamports===null?"Unknown":`${units(q.rentLamports,9)} SOL`}</dd></div><div><dt>Receipt time</dt><dd>{new Date(q.receivedAt).toISOString()}</dd></div><div><dt>Source / route / slot</dt><dd>{q.source} / {q.router} / {q.contextSlot??"unavailable"}</dd></div></dl></section>)}
  <ul>{[...p.warnings,...(scenario?.warnings??[]),...brief.assumptions].map((text,i)=><li key={i}>{text}</li>)}</ul>
  <p>Displays round token amounts down; exact amounts are above. Slippage is a tolerance, not an additional fee. No historical USD profitability is inferred.</p>
  <p className="source-links"><a href="https://developers.jup.ag/docs/swap" target="_blank" rel="noreferrer">Jupiter quotes ↗</a><a href="https://docs.meteora.ag/api-reference/dlmm/positions/get-position-pnl-data-open-and-closed-positions-with-on-the-fly-calculation" target="_blank" rel="noreferrer">Meteora API ↗</a>{brief.mode==="live"&&<a href={`https://solscan.io/account/${p.address}`} target="_blank" rel="noreferrer">Position on Solscan ↗</a>}</p>
  <p className="mono">Position: {p.address}<br/>Pool: {p.pool}<br/>Mints: {p.x.mint} / {p.y.mint}</p>{p.sourceUrls.map(url=><p className="source-url" key={url}><a href={url} target="_blank" rel="noreferrer">{url}</a></p>)}
 </div></details>;
}
