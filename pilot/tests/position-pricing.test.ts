import {test} from 'node:test';
import assert from 'node:assert/strict';
import {demoBrief} from '../lib/demo';
import {currentMarks,valuedPositions,type Mark} from '../lib/current-prices';
import {priceLookup} from '../lib/position-pricing';
import {getSnapshot} from '../lib/meteora';
import {positionValue} from '../app/components/PositionValue';
const now=Date.now(),base={...(await demoBrief()).position,updatedAt:Math.floor(now/1000)};
const marks:Mark[]=[base.x,base.y].map((t,i)=>({mint:t.mint,decimals:t.decimals,usd:i?'1':'100',slot:i+1,at:now-1000,retrievedAt:now,status:'fresh',source:'Jupiter Price V3'}));

test('31 distinct timestamp requests use batches of ten, map shuffled IDs and isolate a failed chunk',async()=>{
 const original=globalThis.fetch,tokens=Array.from({length:31},(_,i)=>({...base.x,mint:'synthetic-mint-'+i}));let rpc=0;
 globalThis.fetch=async(input,init)=>{
  if(String(input).includes('/price/v3'))return Response.json(Object.fromEntries(tokens.map((t,i)=>[t.mint,{usdPrice:i+1,decimals:9,blockId:1000+i}])));
  const requests=JSON.parse(String(init?.body));assert.ok(requests.length<=10);rpc++;
  if(rpc===2)return Response.json({error:{code:-32005,message:'Synthetic failure'}});
  return Response.json(requests.map((r:any)=>({jsonrpc:'2.0',id:r.id,result:Math.floor(now/1000)-(r.params[0]-1000)})).reverse());
 };
 try{const result=await currentMarks(tokens);assert.equal(rpc,4);assert.equal(result.length,31);
  for(let i=0;i<31;i++){assert.equal(result[i].mint,tokens[i].mint);if(i>=10&&i<20)assert.equal(result[i].code,'PRICE_TIME_UNKNOWN');else{assert.equal(result[i].status,'fresh');assert.equal(result[i].at,(Math.floor(now/1000)-i)*1000);assert.equal(result[i].usd,String(i+1));}}
 }finally{globalThis.fetch=original;}
});

test('individual values use wallet arithmetic, exclude fees and survive incomplete wallet coverage',()=>{
 const result=valuedPositions([base],marks,false,now),p=result.positions[0];
 assert.equal(result.valuation.complete,false);assert.equal(p.currentValuation?.principalUsd,'400');assert.equal(p.currentValuation?.feesUsd,'2');
 assert.deepEqual(positionValue(p,now),{text:'$400',status:'estimated'});assert.equal(positionValue(p,now,true).text,'$2');
 assert.equal(positionValue(p,now+119001).status,'stale');assert.equal(p.currentValuation?.marks.length,2);
});

test('missing prices do not produce a partial position value; independent fees and zero inventories remain valid',()=>{
 const p=valuedPositions([{...base,fees:{x:'0',y:'0'}}],marks.slice(0,1),true,now).positions[0];
 assert.equal(p.currentValuation?.principalUsd,null);assert.equal(positionValue(p,now).status,'unavailable');assert.equal(positionValue(p,now,true).text,'$0');
 const noFees=valuedPositions([{...base,fees:{x:null,y:null}}],marks,true,now).positions[0];assert.equal(noFees.currentValuation?.principalUsd,'400');assert.equal(noFees.currentValuation?.feesUsd,null);
});

test('fresh direct lookup handles carry updated valuations; price failures replace previous values without dropping positions',async()=>{
 const old=valuedPositions([base],marks,true,now).positions[0],found={positions:[old],handles:{[base.address]:'old'}};
 const refreshed=await priceLookup({...found,positions:[{...old,inventory:{x:'1',y:'20'}}]},async()=>marks);
 assert.equal(refreshed.positions[0].currentValuation?.principalUsd,'120');assert.notEqual(refreshed.handles[base.address],'old');
 assert.equal(getSnapshot(refreshed.handles[base.address]).currentValuation?.principalUsd,'120');
 const failed=await priceLookup(found,async()=>{throw Error('Synthetic outage');});assert.equal(failed.positions.length,1);assert.equal(failed.positions[0].currentValuation?.principalUsd,null);assert.equal(positionValue(failed.positions[0],now).status,'unavailable');
 assert.equal(getSnapshot(failed.handles[base.address]).currentValuation?.principalUsd,null);
 assert.ok(failed.positions[0].valuationCoverage?.issues.some(i=>i.code==='PRICE_PROVIDER_FAILED'));
});
