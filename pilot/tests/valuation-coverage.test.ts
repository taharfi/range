import {test} from 'node:test';
import assert from 'node:assert/strict';
import {demoBrief} from '../lib/demo';
import {currentMarks,validateMark,valuePositions,type Mark,type PositionCoverage} from '../lib/current-prices';
import {aggregate,type Dependencies} from '../lib/aggregation';
import {portfolioSummary} from '../app/portfolio';
const now=Date.now(),base={...(await demoBrief()).position,updatedAt:Math.floor(now/1000)};
const marks:Mark[]=[base.x,base.y].map(t=>({mint:t.mint,decimals:t.decimals,usd:'1',slot:1,at:now,retrievedAt:now,status:'fresh',source:'Jupiter Price V3'}));
test('coverage separates missing prices, invalid decimals, missing time and unsupported metadata',()=>{
 const t=base.x,raw={usdPrice:1,decimals:t.decimals,blockId:1};
 assert.equal(validateMark(t,null,null,now).code,'PRICE_MISSING');
 assert.equal(validateMark(t,{...raw,decimals:t.decimals+1},now/1000,now).code,'PRICE_DECIMALS_MISMATCH');
 assert.equal(validateMark(t,raw,null,now).code,'PRICE_TIME_UNKNOWN');
 assert.equal(validateMark({...t,verified:false,program:null},raw,null,now).code,'MINT_UNVERIFIED');
 assert.equal(validateMark({...t,verified:false,program:'TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb'},raw,null,now).code,'MINT_UNSUPPORTED_PROGRAM');
 assert.equal(validateMark(t,{...raw,usdPrice:0},null,now).code,'PRICE_INVALID');
});
test('price-provider failures retain their classification rather than pretending the mint has no price',async()=>{
 const original=globalThis.fetch;globalThis.fetch=async()=>new Response('{}',{status:503});
 try{const [mark]=await currentMarks([base.x]);assert.equal(mark.code,'PRICE_PROVIDER_FAILED');assert.equal(mark.usd,null);assert.equal(mark.status,'unavailable');}finally{globalThis.fetch=original;}
});
test('malformed fees cannot exclude valid principal; malformed principal cannot exclude valid fees',()=>{
 const badFee={...base,fees:{...base.fees,x:'0.0000000001'}};
 const v=valuePositions([badFee],marks,true,now);assert.equal(v.complete,true);assert.equal(v.feesComplete,false);assert.equal(v.reasonCounts?.FEE_INVALID,1);
 const badInventory={...base,inventory:{...base.inventory,x:'-1'}};
 const r=valuePositions([badInventory],marks,true,now);assert.equal(r.complete,false);assert.equal(r.feesComplete,true);assert.equal(r.reasonCounts?.INVENTORY_INVALID,1);
});
test('reason counts count positions once, preserve multiple causes, and zero amounts do not need prices',()=>{
 let details:PositionCoverage|undefined;
 const p={...base,updatedAt:null},r=valuePositions([p],[],true,now,(_,v)=>details=v);
 assert.equal(r.reasonCounts?.INVENTORY_TIME_UNKNOWN,1);assert.equal(r.reasonCounts?.PRICE_MISSING,1);assert.ok(details!.issues.length>2);assert.equal(details?.principal,false);
 const zero={...base,inventory:{x:'0',y:'0'},fees:{x:'0',y:'0'}};
 const v=valuePositions([zero],[],true,now);assert.equal(v.complete,true);assert.equal(v.feesComplete,true);assert.deepEqual(v.reasonCounts,{});
});
test('stale inventory, stale marks, unavailable fees and future inventory retain distinct causes',()=>{
 assert.equal(valuePositions([{...base,updatedAt:Math.floor(now/1000)-121}],marks,true,now).reasonCounts?.INVENTORY_STALE,1);
 assert.equal(valuePositions([{...base,updatedAt:Math.floor(now/1000)+31}],marks,true,now).reasonCounts?.INVENTORY_FUTURE,1);
 assert.equal(valuePositions([base],marks.map(m=>({...m,at:now-121000})),true,now).reasonCounts?.PRICE_STALE,1);
 assert.equal(valuePositions([{...base,fees:{x:null,y:null}}],marks,true,now).reasonCounts?.FEE_UNKNOWN,1);
});
test('aggregation attaches only position-scoped explanations to rows and compact wallet-wide counts',async()=>{
 const deps:Dependencies={discover:async()=>({pools:['pool'],indexed:9,hasNext:false}),hydrate:async()=>({positions:Array.from({length:9},(_,i)=>({...base,address:'p'+i})),issues:[],hasNext:false}),marks:async()=>[]};
 const r=await aggregate(deps);assert.equal(r.summary.complete,true);assert.equal(r.summary.valuation?.complete,false);assert.equal(r.summary.valuation?.reasonCounts?.PRICE_MISSING,9);
 const failed=await aggregate({...deps,marks:async()=>{throw Error('Provider failed');}});assert.equal(failed.summary.valuation?.reasonCounts?.PRICE_PROVIDER_FAILED,9);assert.equal(failed.summary.valuation?.complete,false);
 assert.ok(r.positions.every(p=>p.valuationCoverage?.issues.every(i=>i.code==='PRICE_MISSING')));
 assert.ok(!('positions' in r.summary.valuation!));
 const results={mode:'live' as const,snapshotId:'test',positions:[{...base,updatedAt:Math.floor(now/1000)+31}],handles:{},warnings:[],hasNextPools:false,morePositions:[],poolPage:1,aggregate:r.summary};
 assert.equal(portfolioSummary(results,now).stale,1);
});
