import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readdir, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { analysisToken, deleteFeedback, saveFeedback, verifyAnalysis } from "../lib/feedback";
import { body, sameOrigin } from "../lib/http";

test("consent, invitations, provenance, deduplication and deletion protect real feedback",async()=>{
  const directory=await mkdtemp(path.join(os.tmpdir(),"lp-pilot-feedback-test-"));
  const prior={...Object.fromEntries(["FEEDBACK_SECRET","PILOT_TESTER_CODES","PILOT_FEEDBACK_DIR"].map(k=>[k,process.env[k]]))};
  process.env.FEEDBACK_SECRET="test-only-secret-never-used-by-pilot";process.env.PILOT_TESTER_CODES="TESTER-ONLY-01";process.env.PILOT_FEEDBACK_DIR=directory;
  try{
    const token=analysisToken(randomUUID())!;
    const input={consent:true,testerCode:"TESTER-ONLY-01",token,selfReportedLp:true,understood:"yes",withdrawalCostsIncluded:"no",usefulInsight:"yes",overlookedCosts:"yes",intendedBefore:"hold",intendedAfter:"exit",useAgain:"yes",payIntent:"request-paid-pilot",monthlyAmount:20,comment:""};
    await assert.rejects(saveFeedback({...input,consent:false}),/consent/);assert.equal((await readdir(directory)).length,0);
    await assert.rejects(saveFeedback({...input,testerCode:"UNKNOWN"}),/code/);
    await assert.rejects(saveFeedback({...input,token:token+"tamper"}),/invalid/);
    const saved=await saveFeedback(input);const files=await readdir(directory);assert.equal(files.length,1);
    const record=JSON.parse(await readFile(path.join(directory,files[0]),"utf8"));
    assert.equal(record.comprehensionCheckPassed,true);assert.equal(record.changedDecision,true);
    assert.equal(record.crediblePaymentEvidence,false);assert.equal(record.verifiedLp,false);
    assert.ok(!("testerCode" in record));assert.ok(!("token" in record));assert.ok(!("wallet" in record));
    await assert.rejects(saveFeedback(input),/already saved/);
    await assert.rejects(deleteFeedback(saved.receipt,"a".repeat(64)),/match/);
    await deleteFeedback(saved.receipt,saved.deleteToken);assert.equal((await readdir(directory)).length,0);
    await assert.rejects(deleteFeedback("../anything","a".repeat(64)),/Invalid/);
    assert.throws(()=>verifyAnalysis(token,Date.now()+86_401_000),/expired/);
    const bits=token.split(".");assert.throws(()=>verifyAnalysis(bits[0]+"."+"f".repeat(64)),/invalid/);
  }finally{
    for(const [key,value] of Object.entries(prior)){if(value===undefined)delete process.env[key];else process.env[key]=value;}
    // Fixed mkdtemp-created test directory; never targets the real feedback directory.
    await rm(directory,{recursive:true,force:true});
  }
});
test("cross-origin writes and oversized JSON fail before provider or disk work",async()=>{
  assert.throws(()=>sameOrigin(new Request("http://localhost:3000/api/feedback",{headers:{origin:"https://other.example"}})),/Cross-origin/);
  sameOrigin(new Request("http://localhost:3000/api/feedback",{headers:{origin:"http://localhost:3000"}}));
  // Next's internal URL and the browser-visible Host need not have the same hostname.
  sameOrigin(new Request("http://localhost:3000/api/feedback",{headers:{origin:"http://127.0.0.1:3000",host:"127.0.0.1:3000"}}));
  assert.throws(()=>sameOrigin(new Request("http://localhost:3000/api/feedback",{headers:{origin:"http://evil.example",host:"127.0.0.1:3000"}})),/Cross-origin/);
  await assert.rejects(body(new Request("http://localhost/api",{method:"POST",body:"x".repeat(9000)})),/large/);
  await assert.rejects(body(new Request("http://localhost/api",{method:"POST",headers:{"Content-Type":"application/json"},body:"not json"})),/JSON/);
});
