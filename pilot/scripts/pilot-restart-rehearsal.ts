import {mkdtemp,writeFile,readFile,mkdir,rm} from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {startAggregation,aggregatePage} from '../lib/aggregation';
import {syncPositionLedger} from '../lib/ledger';
import {consentUsage,recordUsage,readUsage,eraseUsage} from '../lib/analytics';
import {PilotError} from '../lib/http';
const [mode,directory]=process.argv.slice(2),pid='0'.repeat(64),wallet='ACUvKyTc7dEwR8oMqUZd5xpj19osaFZoXPauuy52adQM',pool='5rCf1DM8LjKTw4YqhnoLcngyZYeNnQqztScTogYHAS6';
if(mode==='write'||mode==='read'){
 if(!directory||!path.resolve(directory).startsWith(path.resolve(os.tmpdir())+path.sep)||!path.basename(directory).startsWith('range-restart-'))throw Error('Invalid isolated rehearsal path');
 process.env.PILOT_FEEDBACK_DIR=path.join(directory,'feedback');process.env.PILOT_LEDGER_DIR=path.join(directory,'ledger');
 if(mode==='write'){
  const job=startAggregation(wallet,false,{discover:async()=>({pools:[],indexed:0,hasNext:false}),hydrate:async()=>({positions:[],issues:[],hasNext:false}),marks:async()=>[]});
  while(job.summary.status==='running')await new Promise(r=>setTimeout(r,10));
  const page=await syncPositionLedger(wallet,pool,{fetch:async()=>({position:wallet,coverage:'partial',retrievedAt:Date.now(),events:[],warnings:['Synthetic rehearsal checkpoint, not historical evidence'],rejected:0,duplicates:0,sourceUrl:'synthetic://restart-rehearsal'})});
  await consentUsage(pid);await recordUsage(pid,'lookup_success',job.id);await writeFile(path.join(directory,'state.json'),JSON.stringify({id:job.id,retrievedAt:page.retrievedAt}));
  console.log(JSON.stringify({writerCompleted:true}));
 }else{
  const old=JSON.parse(await readFile(path.join(directory,'state.json'),'utf8'));let status=0;
  try{aggregatePage(old.id);}catch(e){if(e instanceof PilotError)status=e.status;}
  const page=await syncPositionLedger(wallet,pool,{fetch:async()=>{throw Error('Unexpected provider refetch');}}),persisted=(await readUsage()).length===1;
  await eraseUsage(pid);const erased=(await readUsage()).length===0;
  const result={classification:'synthetic process-restart rehearsal; no genuine testers',aggregationSnapshotStatus:status,requiresFreshAnalysis:status===409,partialLedgerPersisted:page.retrievedAt===old.retrievedAt&&page.coverage==='partial',existingUsagePersisted:persisted,existingUsageErased:erased};
  console.log(JSON.stringify(result));if(!result.requiresFreshAnalysis||!result.partialLedgerPersisted||!persisted||!erased)process.exitCode=1;
 }
}else{
 const dir=await mkdtemp(path.join(os.tmpdir(),'range-restart-'));
 try{const run=promisify(execFile),script=path.resolve('scripts/pilot-restart-rehearsal.ts');await run(process.execPath,['--import','tsx',script,'write',dir],{timeout:30000});const {stdout}=await run(process.execPath,['--import','tsx',script,'read',dir],{timeout:30000});const result=JSON.parse(stdout.trim());await mkdir('evidence/pilot-sequence',{recursive:true});await writeFile('evidence/pilot-sequence/restart.json',JSON.stringify({at:new Date().toISOString(),status:'passed',...result},null,2));console.log(JSON.stringify(result));}
 finally{if(!path.resolve(dir).startsWith(path.resolve(os.tmpdir())+path.sep)||!path.basename(dir).startsWith('range-restart-'))throw Error('Refusing cleanup outside isolated rehearsal directory');await rm(dir,{recursive:true,force:true});}
}
