import {test} from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {mkdtemp,writeFile,readdir,rm} from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {pilotReport,type Verification} from '../lib/pilot-report';
import type {FeedbackRecord} from '../lib/feedback';
import {configurationChecks,readiness} from '../lib/readiness';
const day=86400000,now=Date.parse('2026-10-23T12:00:00Z');
function response(pid='a'.repeat(64),at=now-day*2):FeedbackRecord{return {id:randomUUID(),participantId:pid,analysisId:randomUUID(),analysisAt:at,savedAt:at+1000,consentVersion:'2026-10-20-v1',usefulInsight:'yes',overlookedCosts:'yes',comprehensionCheckPassed:true,changedDecision:true,useAgain:'yes',payIntent:'request-paid-pilot'} as FeedbackRecord;}
function verification(participantId:string):Verification{return {participantId,consentRecorded:true,genuineLpVerified:true,verificationDate:'2026-10-21',method:'facilitated-position-walkthrough',paidCommitment:{date:'2026-10-22',monthlyUsd:25,evidenceRef:'synthetic-test-only'}};}
test('even passing survey proxies cannot certify unaided tasks, voluntary returns or full pilot success',()=>{
 const records:FeedbackRecord[]=[],ledger:Verification[]=[];for(let i=1;i<=10;i++){const pid=i.toString(16).padStart(64,'0');records.push(response(pid),response(pid,now-day));ledger.push(verification(pid));}
 const r=pilotReport(records,ledger,now);assert.equal(r.surveyProxyThresholdsMet,true);assert.equal(r.allThresholdsMet,false);assert.equal(r.protocolEvidence.voluntaryReturns,null);assert.equal(r.protocolEvidence.financialUnderstanding,null);assert.equal(r.repeatedFeedbackAnalysesAtLeast24HoursLater,10);
});
test('retained evidence excludes expired records, preserves nonresponders and cannot double-count repeats',()=>{
 const a=response(),old=response('b'.repeat(64),now-day*31),r=pilotReport([a,a,old],[verification(a.participantId),verification(old.participantId)],now);
 assert.equal(r.consentedResponses,1);assert.equal(r.expiredResponsesExcluded,1);assert.equal(r.facilitatorVerifiedLpTesters,2);assert.equal(r.verifiedLpFeedbackNonresponders,1);assert.equal(r.usefulNewInsightAmongVerified,1);
 assert.equal(pilotReport([],[],now).allThresholdsMet,false);
});
test('invalid or conflicting evidence fails rather than inflating results, and repeats outside 14 days do not qualify',()=>{
 const r=response();assert.throws(()=>pilotReport([r,{...r,usefulInsight:'no'}],[],now),/Conflicting/);assert.throws(()=>pilotReport([{...r,savedAt:now+60000}],[],now),/chronology/);
 assert.throws(()=>pilotReport([{...r,comprehensionCheckPassed:'yes' as unknown as boolean}],[],now));
 assert.throws(()=>pilotReport([],[verification(r.participantId),verification(r.participantId)],now),/Duplicate/);
 assert.equal(pilotReport([response(r.participantId,now-20*day),response(r.participantId,now-day)],[verification(r.participantId)],now).repeatedFeedbackAnalysesAtLeast24HoursLater,0);
});
test('readiness probes feedback and ledger paths independently and cannot reuse another path cached success',async()=>{
 const dir=await mkdtemp(path.join(os.tmpdir(),'range-readiness-')),old={feedback:process.env.PILOT_FEEDBACK_DIR,ledger:process.env.PILOT_LEDGER_DIR,deployment:process.env.PILOT_DEPLOYMENT};
 try{process.env.PILOT_DEPLOYMENT='local';process.env.PILOT_FEEDBACK_DIR=path.join(dir,'feedback');process.env.PILOT_LEDGER_DIR=path.join(dir,'ledger');const ready=await readiness();assert.equal(ready.storage,true);assert.equal(ready.ledgerStorage,true);assert.equal((await readdir(process.env.PILOT_LEDGER_DIR)).length,0);
  const blocked=path.join(dir,'not-a-directory');await writeFile(blocked,'file');process.env.PILOT_LEDGER_DIR=path.join(blocked,'ledger');const failed=await readiness();assert.equal(failed.storage,true);assert.equal(failed.ledgerStorage,false);
  process.env.PILOT_LEDGER_DIR=process.env.PILOT_FEEDBACK_DIR;assert.equal(configurationChecks().separateStores,false);
  process.env.PILOT_DEPLOYMENT='public';delete process.env.PILOT_LEDGER_DIR;assert.equal(configurationChecks().persistentLedgerPath,false);
 }finally{for(const [key,value] of [['PILOT_FEEDBACK_DIR',old.feedback],['PILOT_LEDGER_DIR',old.ledger],['PILOT_DEPLOYMENT',old.deployment]]){if(value===undefined)delete process.env[key!];else process.env[key!]=value;}assert.ok(path.resolve(dir).startsWith(path.resolve(os.tmpdir())+path.sep)&&path.basename(dir).startsWith('range-readiness-'));await rm(dir,{recursive:true,force:true});}
});
