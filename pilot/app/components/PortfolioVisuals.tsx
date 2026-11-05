import type {Position} from '../../lib/models';

// The graphic weights positions equally, never by capital or profitability.
export function RangeOverview({inside,outside,unknown}:{inside:number;outside:number;unknown:number}){
 const total=inside+outside+unknown;
 const segments=[{count:inside,name:'inside'},{count:outside,name:'outside'},{count:unknown,name:'unknown'}];
 let offset=0;
 return <figure className="range-overview">
  <svg viewBox="0 0 180 180" role="img" aria-label={`Loaded positions: ${inside} in range, ${outside} out of range, ${unknown} unknown. Each position has equal weight.`}>
   <circle className="overview-track" cx="90" cy="90" r="68"/>
   {total>0&&segments.map(segment=>{const start=offset,length=segment.count/total*100;offset+=length;return segment.count>0?<circle key={segment.name} className={`overview-segment ${segment.name}`} cx="90" cy="90" r="68" pathLength="100" strokeDasharray={`${length} ${100-length}`} strokeDashoffset={-start} transform="rotate(-90 90 90)"/>:null;})}
   <text x="90" y="91" className="overview-number">{total}</text><text x="90" y="113" className="overview-caption">POSITIONS</text>
  </svg>
  <figcaption>Position count · not capital weighted</figcaption>
 </figure>;
}

export function PairIdentity({position:p}:{position:Position}){
 return <span className="portfolio-pair"><span className="token-monograms" aria-hidden="true"><span>{p.x.symbol.slice(0,2)}</span><span>{p.y.symbol.slice(0,2)}</span></span><span className="portfolio-pair-text"><strong>{p.pair}</strong><small>{p.address.slice(0,5)}…{p.address.slice(-5)}</small></span></span>;
}
