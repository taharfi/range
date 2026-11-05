import type {Lookup,Position} from '../lib/models';
export type PortfolioResults=Lookup & {handles:Record<string,string>};

// Pagination adds observations; it must not quietly replace existing financial figures.
// Only explicit refreshes replace a previously displayed position and its handle together.
export function mergePortfolio(current:PortfolioResults,incoming:PortfolioResults,pool?:string):PortfolioResults{
 if(current.mode!==incoming.mode)throw new Error('Cannot mix example and live portfolio data.');
 const positions=[...current.positions],handles={...current.handles};
 const byAddress=new Map(positions.map(p=>[p.address,p]));
 const warnings=[...current.warnings,...incoming.warnings];
 for(const p of incoming.positions){
  const previous=byAddress.get(p.address);
  if(previous){
   if(previous.owner!==p.owner||previous.pool!==p.pool||previous.x.mint!==p.x.mint||previous.y.mint!==p.y.mint||previous.x.decimals!==p.x.decimals||previous.y.decimals!==p.y.decimals)
    warnings.push('A repeated position has conflicting identity data. Its earlier observation was retained; refresh before relying on it.');
   continue;
  }
  positions.push(p);byAddress.set(p.address,p);if(incoming.handles[p.address])handles[p.address]=incoming.handles[p.address];
 }
 const more=new Map(current.morePositions.filter(p=>p.pool!==pool).map(p=>[p.pool,p]));
 for(const p of incoming.morePositions)more.set(p.pool,p);
 return {...current,snapshotId:incoming.snapshotId,positions,handles,warnings:[...new Set(warnings)],
  morePositions:[...more.values()],hasNextPools:pool?current.hasNextPools:incoming.hasNextPools,
  poolPage:pool?current.poolPage:incoming.poolPage,indexedPositionCount:incoming.indexedPositionCount??current.indexedPositionCount};
}

export function portfolioSummary(results:PortfolioResults,now:number){
 if(results.aggregate){const a=results.aggregate;return {count:a.discovered,pending:a.status==='running',partial:!a.complete,inRange:a.inRange,outOfRange:a.outOfRange,unknownRange:a.unknownRange,stale:results.positions.filter(p=>!p.updatedAt||now-p.updatedAt*1000>120000||p.updatedAt*1000>now+30000).length,missingFees:results.positions.filter(p=>p.fees.x===null||p.fees.y===null).length};}
 const count=results.positions.length;
 const pending=results.hasNextPools||results.morePositions.length>0;
 const countMismatch=results.indexedPositionCount!==undefined&&results.indexedPositionCount!==count;
 return {count,pending,partial:pending||results.warnings.length>0||countMismatch,
  inRange:results.positions.filter(p=>p.rangeStatus==='in-range').length,
  outOfRange:results.positions.filter(p=>p.rangeStatus==='out-of-range').length,
  unknownRange:results.positions.filter(p=>p.rangeStatus==='unknown').length,
  stale:results.positions.filter(p=>!p.updatedAt||now-p.updatedAt*1000>120000||p.updatedAt*1000>now+30000).length,
  missingFees:results.positions.filter(p=>p.fees.x===null||p.fees.y===null).length};
}

export function replacePortfolioPosition(results:PortfolioResults,position:Position,handle:string){
 return {...results,positions:results.positions.map(p=>p.address===position.address?position:p),handles:{...results.handles,[position.address]:handle}};
}
