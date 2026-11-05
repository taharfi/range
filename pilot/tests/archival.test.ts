import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import bs58 from 'bs58';
import {syncArchivalPage} from '../lib/archival';

const scope={address:'11111111111111111111111111111111',from:1700000000,until:1700001000};
const tx=(n=1)=>({slot:n,blockTime:1700000010,transaction:{signatures:[bs58.encode(Buffer.alloc(64,n))],message:{accountKeys:[scope.address],instructions:[]}},meta:{err:null,fee:5000}});
const page=(data:unknown[],cursor:string|null)=>({result:{data,paginationToken:cursor}});
async function temporary(fn:(directory:string)=>Promise<void>){const directory=await mkdtemp(join(tmpdir(),'range-archival-'));try{await fn(directory);}finally{await rm(directory,{recursive:true,force:true});}}

test('archival pages resume durably, deduplicate and stop at query exhaustion without claiming reconciliation',()=>temporary(async directory=>{
 let calls=0;const fetch=async(_:unknown,cursor:string|null)=>{calls++;return cursor?page([tx(),tx(2)],null):page([tx()],'1:0');};
 const a=await syncArchivalPage(scope,{directory,fetch});assert.equal(a.transactions.length,1);assert.equal(a.queryExhausted,false);
 const b=await syncArchivalPage(scope,{directory,fetch});assert.equal(b.transactions.length,2);assert.equal(b.pages,2);assert.equal(b.coverage,'query-only-unreconciled');
 assert.deepEqual(await syncArchivalPage(scope,{directory,fetch}),b);assert.equal(calls,2);
}));
test('provider failures, incomplete responses, cursor loops and conflicts never advance historical checkpoints',()=>temporary(async directory=>{
 await syncArchivalPage(scope,{directory,fetch:async()=>page([tx()],'1:0')});
 const bad=[async()=>{throw Error('timeout');},async()=>({error:{code:429}}),async()=>page([tx()],'1:0'),async()=>page([{...tx(),meta:{err:null,fee:7000}}],null),async()=>page([],'2:0'),async()=>page([tx()],'2:0')];
 for(const fetch of bad)await assert.rejects(syncArchivalPage(scope,{directory,fetch}));
 const recovered=await syncArchivalPage(scope,{directory,fetch:async()=>page([tx(2)],null)});assert.equal(recovered.pages,2);assert.equal(recovered.transactions.length,2);
}));
test('historical page budget is bounded and independently scoped intervals do not share checkpoints',()=>temporary(async directory=>{
 let calls=0;const fetch=async()=>{calls++;return page([tx(calls)],calls+':0');};
 for(let i=0;i<10;i++)await syncArchivalPage(scope,{directory,fetch});
 await assert.rejects(syncArchivalPage(scope,{directory,fetch}),/budget/);assert.equal(calls,10);
 const separate=await syncArchivalPage({...scope,until:scope.until+1},{directory,fetch:async()=>page([],null)});assert.equal(separate.pages,1);assert.equal(separate.transactions.length,0);
}));
test('malformed, foreign, missing-time and out-of-window records cannot become complete history',()=>temporary(async directory=>{
 for(const data of [[{...tx(),blockTime:null}],[{...tx(),blockTime:scope.until}],[{...tx(),transaction:{...tx().transaction,message:{accountKeys:[],instructions:[]}}}],[{...tx(),transaction:{...tx().transaction,signatures:['bad']}}]])await assert.rejects(syncArchivalPage(scope,{directory,fetch:async()=>page(data,null)}));
 const failed={...tx(),meta:{err:{InstructionError:[0,'Custom']},fee:5000}};
 const r=await syncArchivalPage(scope,{directory,fetch:async()=>page([failed],null)});assert.deepEqual(r.transactions[0].meta?.err,failed.meta.err);assert.equal(r.coverage,'query-only-unreconciled');
}));
