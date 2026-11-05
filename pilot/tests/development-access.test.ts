import {test} from 'node:test';
import assert from 'node:assert/strict';
import {developmentCode} from '../lib/identity';
import {openSession,sessionFor} from '../lib/session';
import {guard} from '../lib/guard';

test('local development code allows repeated analyses without measuring testers and fails closed remotely',async()=>{
 const names=['PILOT_DEPLOYMENT','PILOT_PUBLIC_ORIGIN','PILOT_DEVELOPMENT_CODE','FEEDBACK_SECRET','PILOT_TESTER_CODES','PILOT_REQUIRE_INVITE'];
 const before=Object.fromEntries(names.map(k=>[k,process.env[k]]));
 try{
  Object.assign(process.env,{PILOT_DEPLOYMENT:'local',PILOT_PUBLIC_ORIGIN:'http://127.0.0.1:3000',PILOT_DEVELOPMENT_CODE:'LOCAL-UNIT-ACCESS-ONLY-12345',FEEDBACK_SECRET:'local-development-test-only-secret-123456',PILOT_TESTER_CODES:'NORMAL-TESTER-CODE',PILOT_REQUIRE_INVITE:'1'});
  const opened=await openSession('LOCAL-UNIT-ACCESS-ONLY-12345',true);assert.equal(opened.session.consent,false);
  const request=new Request('http://127.0.0.1:3000/api/positions',{method:'POST',headers:{origin:'http://127.0.0.1:3000',cookie:opened.cookie.split(';')[0]}});
  for(let i=0;i<8;i++)assert.equal(guard(request,'lookup')?.id,opened.session.id);
  const normal=await openSession('NORMAL-TESTER-CODE',false);const ordinary=new Request(request,{headers:{origin:'http://127.0.0.1:3000',cookie:normal.cookie.split(';')[0]}});
  for(let i=0;i<6;i++)guard(ordinary,'lookup');assert.throws(()=>guard(ordinary,'lookup'),/limit/);
  for(const mode of ['staging','public']){process.env.PILOT_DEPLOYMENT=mode;assert.equal(developmentCode(),null);assert.equal(sessionFor(request),null);await assert.rejects(openSession('LOCAL-UNIT-ACCESS-ONLY-12345',false),/not recognized/);}
  process.env.PILOT_DEPLOYMENT='local';process.env.PILOT_PUBLIC_ORIGIN='https://pilot.example.com';assert.equal(developmentCode(),null);await assert.rejects(openSession('LOCAL-UNIT-ACCESS-ONLY-12345',false),/not recognized/);
 }finally{for(const k of names){if(before[k]===undefined)delete process.env[k];else process.env[k]=before[k];}}
});
