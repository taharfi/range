import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import bs58 from 'bs58';
import {lookup,DLMM_PROGRAM,SOL,USDC,TOKEN_PROGRAM} from '../lib/meteora';
import {apiError,PilotError} from '../lib/http';

const wallet='34kjDvJ49xbg9VtX2N1ReQeWtFSAaGZUh6UqFHGPmzaw';
const pool='5rCf1DM8LjKTw4YqhnoLcngyZYeNnQqztScTogYHAS6';
const fixture=JSON.parse(await readFile(new URL('../evidence/positions-sample.json',import.meta.url),'utf8'));
const position=fixture.positions[0].positionAddress;
const metadata={address:pool,name:'SOL-USDC',token_x:{address:SOL,symbol:'SOL',decimals:9},token_y:{address:USDC,symbol:'USDC',decimals:6}};

test('discovery preserves empty, partial, unsupported and failed results without false positives',async t=>{
 const original=globalThis.fetch;let mode='open';const paths:string[]=[];
 globalThis.fetch=async(input,init)=>{
  const u=String(input);paths.push(u);
  if(u.includes('/portfolio/open')){
   if(mode==='timeout')throw new DOMException('timed out','TimeoutError');
   if(mode==='index-failure')return Response.json({error:'index unavailable'},{status:503});
   if(mode==='malformed')return Response.json({pools:[]});
   return Response.json({hasNext:mode==='pagination',pools:['empty','pagination'].includes(mode)?[]:[{poolAddress:pool}]});
  }
  if(u.includes('/pools/'))return Response.json(metadata);
  if(u.includes('/positions/'))return Response.json({...fixture,positions:mode==='decode'?[{...fixture.positions[0],minPrice:'invalid'}]:mode==='zero'?[{...fixture.positions[0],poolActiveBinId:99999,unrealizedPnl:{...fixture.positions[0].unrealizedPnl,balanceTokenX:{amount:'0'},balanceTokenY:{amount:'0'}}}]:fixture.positions});
  const body=JSON.parse(String(init?.body)),key=body.params[0];
  if(key===position||key===wallet){
   const raw=Buffer.concat([Buffer.from([117,176,212,199,245,180,133,182]),bs58.decode(pool),bs58.decode(wallet)]);
   return Response.json({result:{context:{slot:1},value:{owner:mode==='unsupported'?'11111111111111111111111111111111':DLMM_PROGRAM,data:[raw.toString('base64'),'base64']}}});
  }
  const mint=Buffer.alloc(82);mint[44]=key===SOL?9:6;mint[45]=1;
  return Response.json({result:{context:{slot:1},value:{owner:TOKEN_PROGRAM,data:[mint.toString('base64'),'base64']}}});
 };
 try{
  await t.test('supported open wallet positions are retained',async()=>{
   const result=await lookup({kind:'wallet',address:wallet});assert.equal(result.positions.length,1);assert.equal(result.positions[0].address,position);
  });
  await t.test('out-of-range positions with zero inventory are not filtered out as closed',async()=>{mode='zero';const r=await lookup({kind:'wallet',address:wallet});assert.equal(r.positions.length,1);assert.equal(r.positions[0].rangeStatus,'out-of-range');assert.deepEqual(r.positions[0].inventory,{x:'0',y:'0'});});
  await t.test('empty wallet has no fabricated positions or position-decoding warnings',async()=>{mode='empty';const r=await lookup({kind:'wallet',address:wallet});assert.equal(r.positions.length,0);assert.deepEqual(r.warnings,[]);});
  await t.test('direct valid position uses its decoded owner and pool',async()=>{mode='open';const r=await lookup({kind:'position',address:position});assert.equal(r.positions[0].owner,wallet);assert.ok(paths.some(p=>p.includes('status=open')));});
  await t.test('unsupported protocol/account is a typed classification, not empty wallet evidence',async()=>{mode='unsupported';await assert.rejects(lookup({kind:'position',address:wallet}),(e:unknown)=>e instanceof PilotError&&e.code==='UNSUPPORTED_POSITION_ACCOUNT');});
  for(const value of ['timeout','index-failure','malformed'])await t.test(value+' is rejected rather than returned as no positions',async()=>{mode=value;await assert.rejects(lookup({kind:'wallet',address:wallet}));});
  await t.test('partial pool pagination remains visible even with no positions on this page',async()=>{mode='pagination';const r=await lookup({kind:'wallet',address:wallet});assert.equal(r.hasNextPools,true);assert.equal(r.positions.length,0);});
  await t.test('invalid position data produces incomplete coverage warnings',async()=>{mode='decode';const r=await lookup({kind:'wallet',address:wallet});assert.equal(r.positions.length,0);assert.match(r.warnings.join(' '),/inconsistent/);});
  await t.test('direct position decoding failure is not an unsupported-account classification',async()=>{mode='decode';await assert.rejects(lookup({kind:'position',address:position}),(e:unknown)=>e instanceof PilotError&&e.status===404&&!e.code);});
  await t.test('API exposes safe classification codes, never arbitrary exception details',async()=>{const r=apiError(new PilotError('Unsupported',400,'UNSUPPORTED_POSITION_ACCOUNT'));assert.equal((await r.json()).code,'UNSUPPORTED_POSITION_ACCOUNT');assert.equal((await apiError(new Error('private detail')).json()).error.includes('private detail'),false);});
 }finally{globalThis.fetch=original;}
});
