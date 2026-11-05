import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {demoBrief} from '../lib/demo';
import {closedPositions,normalizeActivity,type ClosedPage} from '../lib/terminal';
import {attentionQueue,sharedTokens,filteredPositions,mergeClosed} from '../app/terminal';
const fixture=JSON.parse(await readFile(new URL('../evidence/terminal/activity-sample.json',import.meta.url),'utf8'));
const closedFixture=JSON.parse(await readFile(new URL('../evidence/terminal/closed-positions-sample.json',import.meta.url),'utf8'));
const poolsFixture=JSON.parse(await readFile(new URL('../evidence/terminal/closed-pools-sample.json',import.meta.url),'utf8'));
const sample=fixture.events[0],now=Math.max(Date.now(),sample.blockTime);

test('activity timestamps normalize milliseconds and seconds, retaining instruction identity and other actors',()=>{
 const events=[sample,{...sample,ixIndex:sample.ixIndex+1,blockTime:sample.blockTime/1000,userAddress:'11111111111111111111111111111111'},sample];
 const r=normalizeActivity({events},sample.positionAddress,sample.poolAddress,now);assert.equal(r.events.length,2);assert.equal(r.duplicates,1);assert.equal(r.rejected,0);assert.equal(r.events[0].at,sample.blockTime);assert.equal(r.coverage,'partial');assert.equal(r.events[0].quality,'indexed-unverified');assert.equal('totalUsd' in r.events[0],false);
});
test('conflicting indexed events cannot silently contribute amounts; foreign, malformed and future records are reported',()=>{
 const r=normalizeActivity({events:[sample,{...sample,amountX:'999'},{...sample,positionAddress:'11111111111111111111111111111111'},{...sample,signature:'invalid'},{...sample,blockTime:now+600000}]},sample.positionAddress,sample.poolAddress,now);
 assert.equal(r.events.length,0);assert.equal(r.rejected,5);assert.match(r.warnings.join(' '),/conflicting/);
});
test('unknown event types remain observable and missing or negative amounts never become zero',()=>{
 const r=normalizeActivity({events:[{...sample,eventType:'unrecognized_public_event'},{...sample,amountX:'-1'},{...sample,amountY:undefined}]},sample.positionAddress,sample.poolAddress,now);assert.equal(r.events.length,1);assert.equal(r.rejected,2);assert.equal(r.events[0].type,'unrecognized_public_event');
 assert.throws(()=>normalizeActivity({},sample.positionAddress,sample.poolAddress),/events/);
});
test('health rules disclose stale, outside and near-boundary evidence without valuation or profit estimates',async()=>{
 const p=(await demoBrief()).position;
 const list=[{...p,address:'outside',rangeStatus:'out-of-range' as const,updatedAt:Math.floor(now/1000)},{...p,address:'edge',rangeStatus:'in-range' as const,minPrice:'100',maxPrice:'200',poolPrice:'104',updatedAt:Math.floor(now/1000)},{...p,address:'stale',rangeStatus:'unknown' as const,updatedAt:null}];
 const r=attentionQueue(list,now);assert.equal(r.length,3);assert.equal(r[0].position,'stale');assert.ok(r.some(i=>i.position==='edge'&&/5%/.test(i.evidence)));assert.equal(r.some(i=>'pnl' in i||'score' in i),false);
 assert.equal(attentionQueue([{...list[1],poolPrice:'106'}],now).length,0);
});
test('shared-token checks deduplicate addresses and distinguish mint identity from matching symbols',async()=>{
 const p=(await demoBrief()).position;const r=sharedTokens([p,p,{...p,address:'2'},{...p,address:'3',x:{...p.x,mint:'different-mint'}}]);assert.equal(r.find(v=>v.mint===p.x.mint)?.count,2);assert.equal(r.find(v=>v.mint===p.y.mint)?.total,3);
});
test('explorer filters are scoped to loaded positions and cannot sort by invented profitability',async()=>{
 const p=(await demoBrief()).position,list=[{...p,address:'Z',pair:'Z / SOL',rangeStatus:'unknown' as const},{...p,address:'A',pair:'A / SOL',updatedAt:1}];
 assert.equal(filteredPositions(list,'','all','source')[0].address,'Z');assert.equal(filteredPositions(list,'','all','pair')[0].address,'A');assert.equal(filteredPositions(list,'Z','unknown','source').length,1);assert.equal(filteredPositions(list,'absent','all','source').length,0);
});
test('closed pagination preserves observations, cursor scopes and all-time count without implying complete history',()=>{
 const p={address:'a',pool:'pool',pair:'X/Y',x:{mint:'x',symbol:'X'},y:{mint:'y',symbol:'Y'},createdAt:null,closedAt:null,deposits:{x:null,y:null},withdrawals:{x:null,y:null},claims:{x:null,y:null},quality:'indexed-unreconciled' as const};
 const a:ClosedPage={positions:[p],poolPage:3,hasNextPools:true,morePositions:[{pool:'pool',nextPage:2},{pool:'other',nextPage:2}],indexedAllTimeCount:500,warnings:[],retrievedAt:1,sourceUrls:['first'],windowDays:365};
 const r=mergeClosed(a,{...a,positions:[{...p,closedAt:2}],hasNextPools:false,morePositions:[],indexedAllTimeCount:null,sourceUrls:['second']},'pool');assert.equal(r.positions[0].closedAt,null);assert.equal(r.indexedAllTimeCount,500);assert.equal(r.hasNextPools,true);assert.deepEqual(r.morePositions,[{pool:'other',nextPage:2}]);assert.match(r.warnings[0],/changed/);
});
test('closed adapter requests documented closed status; provider and schema failures never become complete empty results',async()=>{
 const original=globalThis.fetch;let mode='valid';const paths:string[]=[];
 const wallet=sample.userAddress,pool=sample.poolAddress;
 globalThis.fetch=async input=>{const url=String(input);paths.push(url);if(mode==='failure')return Response.json({},{status:503});if(url.includes('/portfolio?'))return Response.json({...poolsFixture,pools:poolsFixture.pools.slice(0,1)});if(url.includes('/pools/'))return Response.json({address:pool,token_x:{address:closedFixture.tokenX,symbol:'X',decimals:6},token_y:{address:closedFixture.tokenY,symbol:'SOL',decimals:9}});return Response.json({...closedFixture,positions:mode==='malformed'?[{...closedFixture.positions[0],closedAt:1}]:closedFixture.positions});};
 try{const r=await closedPositions(wallet);assert.equal(r.positions.length,1);assert.equal(r.positions[0].quality,'indexed-unreconciled');assert.equal(r.positions[0].claims.x,'55.590853');assert.equal('pnlUsd' in r.positions[0],false);assert.ok(paths.some(p=>p.includes('status=closed')));mode='malformed';const bad=await closedPositions(wallet,1,pool);assert.equal(bad.positions.length,0);assert.ok(bad.warnings.length);mode='failure';await assert.rejects(closedPositions(wallet));}finally{globalThis.fetch=original;}
});
