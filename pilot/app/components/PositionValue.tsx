import type {Position} from '../../lib/models';
import {amount} from '../presentation';

export function positionValue(position:Position,now:number,fees=false){
 const v=position.currentValuation;
 if(!v)return {text:'Unavailable',status:'unavailable' as const};
 if(!now||now>=v.expiresAt||now-v.at>120000||v.at>now+30000)return {text:'Unavailable',status:'stale' as const};
 const raw=fees?v.feesUsd:v.principalUsd,formatted=amount(raw,2);
 return formatted==='Unavailable'?{text:'Unavailable',status:'unavailable' as const}:{text:'$'+formatted,status:'estimated' as const};
}

export function PositionValue({position,now,demo=false}:{position:Position;now:number;demo?:boolean}){
 const principal=demo?{text:'Unavailable',status:'unavailable'}:positionValue(position,now);
 const fees=demo?{text:'Unavailable',status:'unavailable'}:positionValue(position,now,true);
 return <>
  <span className="metric-label">Position value · USD estimate</span>
  <strong className={principal.status==='estimated'?'position-current-value':'value-unavailable'}>{principal.text}</strong>
  <p className="supporting">{demo?'Synthetic example; no live valuation.':principal.status==='stale'?'Reference valuation expired. Refresh the position.':principal.status==='estimated'?'Current market reference; excludes unclaimed fees.':'A fresh, verified price or inventory observation is missing.'}</p>
  {!demo&&fees.status==='estimated'&&<p className="supporting">Unclaimed fees: {fees.text} estimated · separate from principal.</p>}
  {!demo&&position.currentValuation&&<details><summary>Valuation sources</summary><p className="supporting">Meteora indexed inventory × Jupiter Price V3 market references. Not execution proceeds or historical P&amp;L. No fixed stablecoin peg. Each nonzero token amount must pass mint, decimal and timestamp checks.</p><ul>{position.currentValuation.marks.map(m=><li key={m.mint} className="supporting">{m.mint===position.x.mint?position.x.symbol:position.y.symbol}: {m.source} · {m.at?new Date(m.at).toISOString():'Observation time unavailable'} · {principal.status==='stale'?'refresh required':m.status}{m.reason?` · ${m.reason}`:''}</li>)}</ul></details>}
 </>;
}
