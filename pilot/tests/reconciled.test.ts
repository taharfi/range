import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {mkdtemp,readFile,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {savedReconciliation} from '../lib/reconciled';
const fixture=JSON.parse(await readFile(new URL('../../data/evidence/closed-position-reconciliation.json',import.meta.url),'utf8'));
const hash=(v:string)=>createHash('sha256').update(v).digest('hex');
test('saved evidence is bounded, owner-scoped, price-free and omits raw accounting payloads',async()=>{
 const directory=await mkdtemp(join(tmpdir(),'range-evidence-'));
 try{const empty=await savedReconciliation(fixture.owner,directory);assert.equal(empty.status,'not-indexed');
  await writeFile(join(directory,'wallet-'+hash(fixture.owner)+'.json'),JSON.stringify({owner:fixture.owner,positions:[fixture.position]}));
  const file=join(directory,hash(fixture.position)+'.json');await writeFile(file,JSON.stringify(fixture));
  const result=await savedReconciliation(fixture.owner,directory);assert.equal(result.positions[0].quality,'token-flow-reconciled');assert.equal(result.positions[0].historicalUsdPnl,null);assert.equal('transactions' in result.positions[0],false);assert.equal('flows' in result.positions[0],false);assert.equal('unmatchedEvents' in result.positions[0],false);
  for(const mutation of [(v:any)=>{v.owner=v.pool;},(v:any)=>{v.signatureSetMatched=false;},(v:any)=>{v.totals.x.fee='0';},(v:any)=>{v.transactions[0].sides[0].matches=false;},(v:any)=>{v.transactions.pop();},(v:any)=>{v.observedTransactionFeesLamports='0';},(v:any)=>{v.transactions[1].sides[0].reserveInAtomic='999';}]){const v=structuredClone(fixture);mutation(v);await writeFile(file,JSON.stringify(v));await assert.rejects(savedReconciliation(fixture.owner,directory));}
  await writeFile(file,'invalid json');await assert.rejects(savedReconciliation(fixture.owner,directory));
 }finally{await rm(directory,{recursive:true,force:true});}
});
