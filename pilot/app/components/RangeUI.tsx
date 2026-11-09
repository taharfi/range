import type { Position } from "../../lib/models";
import { D } from "../../lib/math";
import { rangePrecision } from "../presentation";
type DecimalValue=InstanceType<typeof D>;

export function Icon({name}:{name:"arrow"|"download"|"refresh"|"lock"}) {
  const paths={arrow:"M4 12h16m-6-6 6 6-6 6",download:"M12 3v12m-5-5 5 5 5-5M4 17v4h16v-4",refresh:"M20 10a8 8 0 1 0-2 8M20 4v6h-6",lock:"M7 10V7a5 5 0 0 1 10 0v3M5 10h14v11H5zM12 14v3"};
  return <svg className="icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square" aria-hidden="true"><path d={paths[name]}/></svg>;
}
export function Brand(){return <a className="brand" href="/" aria-label="RANGE home">
  <svg className="brand-symbol" width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden="true"><path d="M10 5H5v22h5M22 5h5v22h-5M5 16h22" stroke="currentColor" strokeWidth="2"/><path d="M16 10v12" stroke="currentColor" strokeWidth="3"/></svg>
  <svg className="brand-wordmark" width="132" height="44" viewBox="0 0 164 52" fill="none" aria-hidden="true"><g stroke="currentColor" strokeWidth="5" strokeLinecap="square"><path d="M5 35V15m0 9c0-7 5-10 12-9M44 35V15m0 10c0-15-22-15-22 0s22 15 22 0M56 35V15m0 10c0-14 22-14 22 0v10M111 15v22c0 13-20 13-22 5m22-17c0-15-22-15-22 0s22 15 22 0M123 25h22c0-15-22-15-22 0 0 12 14 15 22 7"/></g><path d="M154 30h6v6h-6z" fill="var(--color-accent, #F54B00)"/></svg>
  </a>;}
export function RangeStatus({status}:{status:Position["rangeStatus"]}){return <span className={`range-status ${status}`}><span aria-hidden="true"/>{status.replaceAll("-"," ")}</span>;}
export function RangeDiagram({position:p,compact=false}:{position:Position;compact?:boolean}){
  let lower:DecimalValue,upper:DecimalValue,current:DecimalValue;
  try{lower=new D(p.minPrice);upper=new D(p.maxPrice);current=new D(p.poolPrice??"NaN");if(!lower.isFinite()||!upper.isFinite()||!current.isFinite()||lower.lte(0)||upper.lte(lower)||current.lte(0))throw Error();}
  catch{return compact?<span className="range-preview-unavailable">Range unavailable</span>:<figure className="range-diagram"><figcaption>Liquidity range</figcaption><p className="notice">Range visualization unavailable. Reliable boundaries and a current pool price are required.</p></figure>;}
  const precision=rangePrecision([lower.toString(),upper.toString(),current.toString()]);
  const label=(v:DecimalValue)=>v.toSignificantDigits(precision).toString();
  const start=D.min(lower,current),end=D.max(upper,current),padding=end.minus(start).mul("0.18"),domainStart=start.minus(padding),width=end.minus(start).plus(padding.mul(2));
  const percent=(v:DecimalValue)=>v.minus(domainStart).div(width).mul(100).toNumber();
  const outside=current.lt(lower)||current.gt(upper);
  if(compact)return <span className="range-preview" role="img" aria-label={`Price range ${label(lower)} to ${label(upper)} ${p.y.symbol} per ${p.x.symbol}; pool price ${label(current)}, ${outside?'outside':'inside'} boundaries.`}><span className="range-baseline"/><span className="range-band" style={{left:`${percent(lower)}%`,width:`${percent(upper)-percent(lower)}%`}}><span/><span/></span><span className={`range-marker ${outside?'outside':''}`} style={{left:`${percent(current)}%`}}><span/></span></span>;
  return <figure className="range-diagram" aria-label={`Liquidity range: ${label(lower)} to ${label(upper)} ${p.y.symbol} per ${p.x.symbol}. Pool price ${label(current)}, ${outside?"outside":"inside"} the plotted boundaries.`}>
    <figcaption><span>Your price range</span><span className="axis-unit">{p.y.symbol} per {p.x.symbol}</span></figcaption>
    <div className="range-track" aria-hidden="true"><div className="range-baseline"/><div className="range-band" style={{left:`${percent(lower)}%`,width:`${percent(upper)-percent(lower)}%`}}><span/><span/></div><div className={`range-marker ${outside?"outside":""}`} style={{left:`${percent(current)}%`}}><span/></div></div>
    <div className="range-legend"><div><span>Lower</span><strong>{label(lower)}</strong></div><div className="current-price"><span>Current pool price</span><strong>{label(current)}</strong></div><div><span>Upper</span><strong>{label(upper)}</strong></div></div>
    <p className="footnote">Price range only, not available liquidity or projected earnings.</p>
  </figure>;
}
