import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp,readdir,rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { consentUsage,recordUsage,eraseUsage,eraseUsageReference,readUsage,usageSummary } from "../lib/analytics";
import { openSession,sessionFor,closeSession } from "../lib/session";
import { participantId } from "../lib/identity";
import { takeLimit,expensive,guard } from "../lib/guard";
import { limitedText,paced,sameOrigin,body } from "../lib/http";
import { configurationChecks } from "../lib/readiness";
import { rebalanceScenario } from "../lib/brief";
import { demoBrief } from "../lib/demo";

test("usage requires explicit consent, excludes wallets, deduplicates, counts returns honestly and erases",async()=>{
 const dir=await mkdtemp(path.join(os.tmpdir(),"pilot-usage-tests-"));
 const old={secret:process.env.FEEDBACK_SECRET,dir:process.env.PILOT_FEEDBACK_DIR,codes:process.env.PILOT_TESTER_CODES};
 process.env.FEEDBACK_SECRET="test-only-public-pilot-secret-123456789";process.env.PILOT_FEEDBACK_DIR=dir;process.env.PILOT_TESTER_CODES="TEST-INVITATION-1234567890";
 try{
   const pid=participantId("TEST-INVITATION-1234567890"),reference=randomUUID(),now=Date.now();
   assert.equal(await recordUsage(pid,"lookup_success",reference,now),false);assert.equal((await readUsage()).length,0);
   const optedOut=await openSession("TEST-INVITATION-1234567890",false);assert.equal((await readUsage()).length,0);
   const req=new Request("http://localhost",{headers:{cookie:optedOut.cookie.split(";")[0]}});
   assert.equal(sessionFor(req)?.consent,false);assert.match(optedOut.cookie,/HttpOnly/);assert.match(optedOut.cookie,/SameSite=Strict/);
   await consentUsage(pid,now);await recordUsage(pid,"visit","2026-10-20",now);await recordUsage(pid,"visit","2026-10-20",now+5000);
   await recordUsage(pid,"visit","2026-10-21",now+86400001);
   await recordUsage(pid,"lookup_success",reference,now);await recordUsage(pid,"lookup_success",reference,now);
   await recordUsage(pid,"comparison_completed",randomUUID(),now);await recordUsage(pid,"willing_to_pay",randomUUID(),now);
   const records=await readUsage(now+86400002),summary=usageSummary(records);
   assert.equal(summary.uniqueConsentingTesters,1);assert.equal(summary.successfulPositionLookups,1);assert.equal(summary.returningTesters,1);assert.equal(summary.explicitWillingnessToPayTesters,1);
   const feedbackRef=randomUUID();await recordUsage(pid,"feedback_submitted",feedbackRef,now);await recordUsage(pid,"willing_to_pay",feedbackRef,now);
   await eraseUsageReference(pid,feedbackRef);assert.equal(usageSummary(await readUsage()).feedbackSubmissions,0);assert.equal(usageSummary(await readUsage()).successfulPositionLookups,1);
   assert.ok(!JSON.stringify(records).includes("wallet"));assert.ok(!JSON.stringify(records).includes("TEST-INVITATION"));
   await assert.rejects(recordUsage(pid,"lookup_success","So11111111111111111111111111111111111111112"),/reference/);
   await closeSession(optedOut.session);assert.equal(sessionFor(req),null);assert.equal((await readUsage()).length,0);
   assert.equal(await recordUsage(pid,"lookup_success",reference),false);
   await consentUsage(pid,now);assert.equal((await readUsage(now+31*86400000)).length,0);
 }finally{for(const [k,v] of [["FEEDBACK_SECRET",old.secret],["PILOT_FEEDBACK_DIR",old.dir],["PILOT_TESTER_CODES",old.codes]]){if(v===undefined)delete process.env[k!];else process.env[k!]=v;}await rm(dir,{recursive:true,force:true});}
});
test("request limits, concurrency and queues have finite bounds",async()=>{
 const key=randomUUID();takeLimit(key,1,1000,100);assert.throws(()=>takeLimit(key,1,1000,101),/limit/);takeLimit(key,1,1000,1101);
 let release!:()=>void;const pending=new Promise<void>(r=>release=r);
 const a=expensive(()=>pending),b=expensive(()=>pending);
 await assert.rejects(expensive(async()=>true),/already running/);release();await Promise.all([a,b]);
 const provider=randomUUID();let releaseJob!:()=>void;const job=new Promise<void>(r=>releaseJob=r);
 const queue=Array.from({length:12},()=>paced(provider,0,()=>job));await assert.rejects(paced(provider,0,async()=>{}),/queue/);releaseJob();await Promise.all(queue);
});
test("streamed oversized input is stopped without trusting content length",async()=>{
 const stream=new ReadableStream<Uint8Array>({start(c){c.enqueue(new Uint8Array(5000));c.enqueue(new Uint8Array(5000));c.close();}});
 await assert.rejects(limitedText(stream,8192),/large/);
 await assert.rejects(body(new Request("http://localhost",{method:"POST",body:"{}"})),/application\/json/);
});
test("public configuration fails closed without invitations, HTTPS origin and proxy policy",()=>{
 const old={...process.env};try{process.env.PILOT_DEPLOYMENT="public";process.env.PILOT_PUBLIC_ORIGIN="http://localhost:3000";process.env.PILOT_REQUIRE_INVITE="0";delete process.env.PILOT_TRUST_PROXY;
 const checks=configurationChecks();assert.equal(checks.origin,false);assert.equal(checks.invitationGate,false);assert.equal(checks.proxy,false);
 assert.throws(()=>sameOrigin(new Request("http://localhost/api",{method:"POST"})),/same-origin/);
 assert.throws(()=>guard(new Request("http://localhost/api",{method:"POST",headers:{origin:"http://localhost:3000"}}),"lookup"),/invitation/);
 }finally{for(const k of ["PILOT_DEPLOYMENT","PILOT_PUBLIC_ORIGIN","PILOT_REQUIRE_INVITE","PILOT_TRUST_PROXY"]){if(old[k]===undefined)delete process.env[k];else process.env[k]=old[k];}}
});
test("zero-inventory rebalance does not falsely claim requested composition",async()=>{
 const p=(await demoBrief()).position;p.inventory={x:"0",y:"0"};
 const r=await rebalanceScenario(p,80,50,async()=>{throw new Error("No quote expected");});assert.equal(r.achievedXPercent,undefined);assert.ok(r.warnings.some(w=>w.includes("undefined")));
});
