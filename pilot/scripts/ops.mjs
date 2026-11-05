// Private operator command. Never served by an API route; no identifiers printed.
import fs from 'node:fs/promises';
import path from 'node:path';
const directory=path.resolve(process.env.PILOT_FEEDBACK_DIR||'.pilot-feedback');
const mode=process.argv[2]||'summary';
if(!['summary','purge'].includes(mode))throw new Error('Use summary or purge.');
const now=Date.now();
async function names(dir){try{return(await fs.readdir(dir)).filter(n=>/^[a-f0-9]{64}\.json$/.test(n));}catch(e){if(e.code==='ENOENT')return[];throw e;}}
const usage=[];let removed=0;
for(const name of await names(path.join(directory,'analytics'))){
  const file=path.join(directory,'analytics',name),r=JSON.parse(await fs.readFile(file,'utf8'));
  if(r.consentVersion!=='2026-10-20-usage-v1'||r.participantId+'.json'!==name||!Array.isArray(r.events))throw new Error('Unexpected analytics record; stopped without exposing data.');
  if(r.expiresAt<=now){if(mode==='purge'){await fs.unlink(file);removed++;}}else usage.push(r);
}
let responses=0;
for(const name of await names(directory)){
  const file=path.join(directory,name),r=JSON.parse(await fs.readFile(file,'utf8'));
  if(r.consentVersion!=='2026-10-20-v1'||typeof r.savedAt!=='number')throw new Error('Unexpected feedback record; stopped without exposing data.');
  if(r.savedAt+30*86400000<=now){if(mode==='purge'){await fs.unlink(file);removed++;}}else responses++;
}
const count=k=>usage.reduce((n,r)=>n+r.events.filter(e=>e.kind===k).length,0);
console.log(JSON.stringify(mode==='purge'?{expiredRecordsDeleted:removed}:{
  consentingInvitedIdentifiers:usage.length,positionLookupSuccesses:count('lookup_success'),completedComparisons:count('comparison_completed'),incompleteComparisons:count('comparison_incomplete'),
  consentedFeedbackResponses:responses,feedbackEventsAmongUsageConsenting:count('feedback_submitted'),
  returningIdentifiers:usage.filter(r=>{const v=r.events.filter(e=>e.kind==='visit').map(e=>e.at);return v.length>1&&Math.max(...v)-Math.min(...v)>=86400000;}).length,
  explicitPaymentInterestIdentifiers:usage.filter(r=>r.events.some(e=>e.kind==='willing_to_pay')).length,
  genuineLpVerification:'Separate facilitator evidence required',crediblePaidCommitments:'Not inferred from survey interest'
},null,2));
