import type {Position} from '../lib/models';
import type {ClosedPage} from '../lib/terminal';
import {D} from '../lib/math';
export type Attention={id:string;position:string;pair:string;title:string;reason:string;evidence:string};
export function attentionQueue(positions:Position[],now:number):Attention[]{
 const items:Attention[]=[];
 for(const p of positions){
  if(!p.updatedAt||now-p.updatedAt*1000>120000||p.updatedAt*1000>now+30000)items.push({id:p.address+':stale',position:p.address,pair:p.pair,title:'Refresh this snapshot',reason:'Old or missing observations can change the comparison.',evidence:p.updatedAt?`Source timestamp ${new Date(p.updatedAt*1000).toISOString()}`:'Source timestamp unavailable'});
  if(p.rangeStatus==='out-of-range')items.push({id:p.address+':outside',position:p.address,pair:p.pair,title:'Outside its active range',reason:'Liquidity may stop earning swap fees until price returns to range.',evidence:`Active bin ${p.activeBin??'unknown'}; bounds ${p.lowerBin}–${p.upperBin}`});
  if(p.rangeStatus==='in-range'&&p.poolPrice){try{
   const lo=new D(p.minPrice),hi=new D(p.maxPrice),price=new D(p.poolPrice),width=hi.minus(lo);
   if(width.gt(0)&&price.gte(lo)&&price.lte(hi)&&D.min(price.minus(lo),hi.minus(price)).div(width).lte('0.05'))items.push({id:p.address+':edge',position:p.address,pair:p.pair,title:'Near a range boundary',reason:'A small price move could take this position outside its range.',evidence:'Within 5% of the linear price-range width of either boundary; this is a rule, not a forecast.'});
  }catch{/* Invalid geometry is already unavailable in the range renderer. */}}
 }
 return items.sort((a,b)=>Number(!a.id.endsWith(':stale'))-Number(!b.id.endsWith(':stale')));
}
export function sharedTokens(positions:Position[]){
 const unique=[...new Map(positions.map(p=>[p.address,p])).values()],counts=new Map<string,{symbol:string;count:number}>();
 for(const p of unique)for(const token of [...new Map([p.x,p.y].map(t=>[t.mint,t])).values()]){const old=counts.get(token.mint);counts.set(token.mint,{symbol:token.symbol,count:(old?.count??0)+1});}
 return [...counts.entries()].filter(([,v])=>unique.length>=3&&v.count/unique.length>=0.6).map(([mint,v])=>({mint,...v,total:unique.length}));
}
export function mergeClosed(current:ClosedPage,incoming:ClosedPage,pool?:string):ClosedPage{
 const rows=new Map(current.positions.map(p=>[p.address,p])),warnings=[...current.warnings,...incoming.warnings];
 for(const p of incoming.positions){const old=rows.get(p.address);if(!old)rows.set(p.address,p);else if(JSON.stringify(old)!==JSON.stringify(p))warnings.push('A repeated closed position changed. Its earlier observation was retained; refresh to replace it.');}
 const cursors=new Map(current.morePositions.filter(v=>v.pool!==pool).map(v=>[v.pool,v]));for(const v of incoming.morePositions)cursors.set(v.pool,v);
 return {...incoming,positions:[...rows.values()],warnings:[...new Set(warnings)],sourceUrls:[...new Set([...current.sourceUrls,...incoming.sourceUrls])],indexedAllTimeCount:incoming.indexedAllTimeCount??current.indexedAllTimeCount,morePositions:[...cursors.values()],poolPage:pool?current.poolPage:incoming.poolPage,hasNextPools:pool?current.hasNextPools:incoming.hasNextPools};
}
export function filteredPositions(positions:Position[],query:string,status:string,sort:string){
 const term=query.trim().toLowerCase();return positions.filter(p=>(!term||[p.pair,p.pool,p.address,p.x.mint,p.y.mint].some(v=>v.toLowerCase().includes(term)))&&(status==='all'||p.rangeStatus===status)).sort((a,b)=>sort==='pair'?a.pair.localeCompare(b.pair):sort==='freshness'?(b.updatedAt??0)-(a.updatedAt??0):sort==='address'?a.address.localeCompare(b.address):0);
}
