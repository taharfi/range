import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,readdir,unlink,rmdir} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {readFile} from 'node:fs/promises';
import {normalizeActivity,type ActivityPage} from '../lib/terminal';
import {reconcileLedger,syncPositionLedger} from '../lib/ledger';
const raw=JSON.parse(await readFile(new URL('../evidence/terminal/activity-sample.json',import.meta.url),'utf8')),first=raw.events[0];
const page:ActivityPage={...normalizeActivity(raw,first.positionAddress,first.poolAddress),position:first.positionAddress,retrievedAt:Date.now(),sourceUrl:'https://dlmm.datapi.meteora.ag/positions/'+first.positionAddress+'/historical'};
test('ledger incremental upserts never duplicate events or infer completeness from high slots',()=>{
 const a=reconcileLedger(null,page,first.poolAddress),b=reconcileLedger(a,page,first.poolAddress);assert.equal(b.events.length,a.events.length);assert.equal(b.coverage,'partial');assert.ok(b.highSlot);assert.equal('pnl' in b,false);
 const event={...page.events[0],x:{...page.events[0].x,amount:'999'}};const conflict=reconcileLedger(b,{...page,events:[event]},first.poolAddress);assert.equal(conflict.events.some(e=>e.id===event.id),false);assert.ok(conflict.conflicts.includes(event.id));
 const again=reconcileLedger(conflict,page,first.poolAddress);assert.equal(again.events.some(e=>e.id===event.id),false);
 const quarantined=reconcileLedger(a,{...page,events:[],conflictIds:[event.id]},first.poolAddress);assert.equal(quarantined.events.some(e=>e.id===event.id),false);
});
test('durable checkpoints survive subsequent reads, coalesce syncs and preserve the checkpoint on provider failure',async()=>{
 const directory=await mkdtemp(join(tmpdir(),'range-ledger-'));let calls=0;const fetch=async()=>{calls++;return page;};
 try{const [a,b]=await Promise.all([syncPositionLedger(page.position,first.poolAddress,{directory,fetch}),syncPositionLedger(page.position,first.poolAddress,{directory,fetch})]);assert.equal(calls,1);assert.equal(a.events.length,b.events.length);
 await syncPositionLedger(page.position,first.poolAddress,{directory,fetch});assert.equal(calls,1);
 await assert.rejects(syncPositionLedger(page.position,first.poolAddress,{directory,now:page.retrievedAt+300001,fetch:async()=>{throw Error('provider failed');}}));
 const existing=await syncPositionLedger(page.position,first.poolAddress,{directory,now:page.retrievedAt+1,fetch});assert.equal(existing.events.length,a.events.length);assert.equal(calls,1);
 }finally{for(const name of await readdir(directory))await unlink(join(directory,name));await rmdir(directory);}
});
