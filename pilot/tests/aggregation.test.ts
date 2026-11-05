import {test} from 'node:test';
import assert from 'node:assert/strict';
import {aggregate,aggregatePage,startAggregation,retry,type Dependencies} from '../lib/aggregation';
import {PilotError} from '../lib/http';
import {demoBrief} from '../lib/demo';
import {validateMark,valuePositions,type Mark} from '../lib/current-prices';
import {currentValue} from '../app/components/CurrentAnalytics';
import {SOL} from '../lib/meteora';
const base=(await demoBrief()).position;
const wallet='ACUvKyTc7dEwR8oMqUZd5xpj19osaFZoXPauuy52adQM';
const now=Date.now();
const mark=(mint:string,decimals:number,usd:string):Mark=>({mint,decimals,usd,slot:1,at:now,retrievedAt:now,status:'fresh',source:'Jupiter Price V3'});
function dependencies(count:number){let active=0,maximum=0;
 const deps:Dependencies={discover:async page=>({pools:Array.from({length:count},(_,i)=>'pool'+i).slice((page-1)*50,page*50),hasNext:page*50<count,indexed:count}),hydrate:async pool=>{active++;maximum=Math.max(maximum,active);await new Promise(r=>setTimeout(r,1));active--;return {positions:[{...base,address:'position'+pool,pool,updatedAt:Math.floor(now/1000)}],hasNext:false,issues:[]};},marks:async()=>[mark(base.x.mint,9,'100'),mark(base.y.mint,6,'1')],sleep:async()=>{}};
 return {deps,maximum:()=>maximum};
}
for(const count of [0,1,9,100,500])test(`${count} positions aggregate server-side with bounded workers and independent summary`,async()=>{
 const d=dependencies(count),r=await aggregate(d.deps);assert.equal(r.positions.length,count);assert.equal(r.summary.discovered,count);assert.equal(r.summary.complete,true);assert.ok(d.maximum()<=2);assert.equal(r.summary.valuation?.principalUsd,String(count*400));assert.equal(r.summary.valuation?.feesUsd,String(count*2));
});
test('retries back off only on transient failures; discovery failure cannot become an empty wallet',async()=>{
 let calls=0;const delays:number[]=[];assert.equal(await retry(async()=>{if(++calls<3)throw new PilotError('Rate limited',503,'UPSTREAM_TRANSIENT');return 7;},async ms=>{delays.push(ms);}),7);assert.deepEqual(delays,[500,1000]);
 calls=0;await assert.rejects(retry(async()=>{calls++;throw new PilotError('Unauthorized',503,'UPSTREAM_REJECTED');},async()=>{}));assert.equal(calls,1);
 const d=dependencies(9).deps;await assert.rejects(aggregate({...d,discover:async()=>{throw new PilotError('RPC unavailable',503);}}));
});
test('partial hydration, malformed records, count mismatches and repeated pages remain incomplete',async()=>{
 const d=dependencies(9).deps,hydrate=d.hydrate;
 const r=await aggregate({...d,hydrate:async(pool,page)=>pool==='pool0'?{positions:[],issues:[{address:'invalid',reason:'Unsupported account'}],hasNext:false}:pool==='pool1'?Promise.reject(new PilotError('Provider timeout',503)):hydrate(pool,page)});
 assert.equal(r.positions.length,7);assert.equal(r.summary.complete,false);assert.equal(r.summary.valuation?.complete,false);assert.equal(r.summary.issueCount,2);
 const stalled=await aggregate({...d,discover:async()=>({pools:['same'],hasNext:true,indexed:9})});assert.equal(stalled.summary.complete,false);assert.match(stalled.summary.issues[0].reason,/stalled/);
});
test('duplicate records are not valued twice and conflicting duplicates remain visible',async()=>{
 const d=dependencies(2).deps;const r=await aggregate({...d,hydrate:async pool=>({positions:[{...base,address:'same',inventory:pool==='pool0'?base.inventory:{x:'1',y:'1'}}],hasNext:false,issues:[]})});assert.equal(r.positions.length,1);assert.equal(r.summary.complete,false);assert.match(r.summary.issues[0].reason,/Conflicting/);
});
test('independent discovery gaps and disappeared accounts prevent complete wallet totals',async()=>{
 const deps=dependencies(9).deps;const r=await aggregate({...deps,verify:async positions=>({positions:positions.slice(0,8),verified:8,onchainCount:9,slot:123,issues:[{address:positions[8].address,reason:'Absent from current owner scan'},{address:'new-on-chain-position',reason:'Missing indexed hydration'}]})});
 assert.equal(r.summary.discovered,8);assert.equal(r.summary.onchainDiscovered,9);assert.equal(r.summary.verificationSlot,123);assert.equal(r.summary.complete,false);assert.equal(r.summary.valuation?.complete,false);
});
test('five-row opaque cursor pages retain a 100-position summary; cached and refreshed jobs do not duplicate in-flight work',async()=>{
 const deps=dependencies(100).deps,a=startAggregation(wallet,false,deps),same=startAggregation(wallet,true,deps);assert.equal(a.id,same.id);
 for(let i=0;i<200&&aggregatePage(a.id).aggregate.status==='running';i++)await new Promise(r=>setTimeout(r,3));
 const first=aggregatePage(a.id);assert.equal(first.aggregate.status,'ready');assert.equal(first.positions.length,5);assert.equal(first.aggregate.discovered,100);
 const second=aggregatePage(a.id,first.rowCursor!);assert.equal(second.positions.length,5);assert.equal(second.aggregate.valuation?.principalUsd,first.aggregate.valuation?.principalUsd);assert.notEqual(second.positions[0].address,first.positions[0].address);assert.throws(()=>aggregatePage(a.id,'invalid'),/cursor/);
 const back=aggregatePage(a.id,second.previousCursor!);assert.equal(back.positions[0].address,first.positions[0].address);assert.equal(back.aggregate.discovered,100);
 assert.equal(startAggregation(wallet,false,deps).id,a.id);assert.notEqual(startAggregation(wallet,true,deps).id,a.id);
});
test('price provenance rejects missing timestamps, stale marks and mismatched decimals without stablecoin pegging',()=>{
 const t=base.y;assert.equal(validateMark(t,{usdPrice:1,decimals:6,blockId:1},null,now).status,'unavailable');assert.equal(validateMark(t,{usdPrice:1,decimals:9,blockId:1},Math.floor(now/1000),now).status,'unavailable');assert.equal(validateMark(t,{usdPrice:1,decimals:6,blockId:1},Math.floor(now/1000)-121,now).status,'stale');assert.equal(validateMark(t,null,Math.floor(now/1000),now).usd,null);
});
test('6/9/18-decimal inventories and fees are separate; stale or missing components never create complete totals',()=>{
 const p={...base,updatedAt:Math.floor(now/1000),inventory:{x:'0.000000001',y:'0.000001'},fees:{x:'0.000000002',y:'0.000002'}};
 const marks=[mark(p.x.mint,9,'100'),mark(p.y.mint,6,'1')];const v=valuePositions([p],marks,true,now);assert.equal(v.principalUsd,'0.0000011');assert.equal(v.feesUsd,'0.0000022');assert.equal(v.complete,true);
 const p18={...p,x:{...p.x,decimals:18},inventory:{x:'0.000000000000000001',y:'0'},fees:{x:'0',y:'0'}};assert.equal(valuePositions([p18],[mark(p.x.mint,18,'100')],true,now).principalUsd,'0.0000000000000001');
 const missing=valuePositions([p],marks.slice(0,1),true,now);assert.equal(missing.complete,false);assert.equal(missing.principalUsd,'0');assert.equal(missing.valuedPositions,0);
 assert.equal(valuePositions([{...p,updatedAt:null}],marks,true,now).complete,false);assert.equal(valuePositions([{...p,fees:{x:null,y:null}}],marks,true,now).feesComplete,false);
 const old=valuePositions([p],marks.map(m=>({...m,status:'stale' as const})),true,now);assert.equal(old.complete,false);
});
test('reference valuations expire from underlying observations, not browser receipt time',()=>{
 const p={...base,updatedAt:Math.floor(now/1000)},v=valuePositions([p],[{...mark(SOL,9,'100'),at:now-119000},mark(p.y.mint,6,'1')],true,now);
 const summary={status:'ready' as const,discovered:1,indexed:1,pools:1,inRange:1,outOfRange:0,unknownRange:0,complete:true,issues:[],valuation:v,updatedAt:now,verifiedOpen:1};
 assert.notEqual(currentValue(summary,now,'USD').text,'Unavailable');assert.equal(currentValue(summary,now+1001,'USD').text,'Unavailable');
 assert.equal(currentValue(summary,now+1001,'USD').status,'stale');assert.equal(currentValue(undefined,now,'USD').status,'unavailable');
});
