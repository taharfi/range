import type {FeedbackRecord} from './feedback';
import {z} from 'zod';
const reportRecord=z.object({id:z.string().uuid(),participantId:z.string().regex(/^[a-f0-9]{64}$/),analysisId:z.string().uuid(),analysisAt:z.number().int().nonnegative(),savedAt:z.number().int().nonnegative(),consentVersion:z.literal('2026-10-20-v1'),usefulInsight:z.enum(['yes','no','unsure']),overlookedCosts:z.enum(['yes','no','unsure']),comprehensionCheckPassed:z.boolean(),changedDecision:z.boolean(),useAgain:z.enum(['yes','no','unsure']),payIntent:z.enum(['no','maybe','request-paid-pilot'])});
export type Verification={participantId:string;consentRecorded:true;genuineLpVerified:boolean;verificationDate:string;method:'facilitated-position-walkthrough';paidCommitment:{date:string;monthlyUsd:number;evidenceRef:string}|null};
export function pilotReport(input:FeedbackRecord[],verifications:Verification[],now=Date.now()){
 const cutoff=now-30*86400000,unique=new Map<string,z.infer<typeof reportRecord>>();let expiredResponsesExcluded=0;
 if(new Set(verifications.map(v=>v.participantId)).size!==verifications.length)throw Error('Duplicate participant verification');
 for(const raw of input){const r=reportRecord.parse(raw);
  if(r.consentVersion!=='2026-10-20-v1'||!Number.isSafeInteger(r.savedAt)||!Number.isSafeInteger(r.analysisAt)||r.savedAt<0||r.analysisAt<0||r.savedAt>now+30000||r.analysisAt>r.savedAt+30000)throw Error('Invalid feedback chronology or consent version; no pilot outcome reported');
  if(r.savedAt<=cutoff){expiredResponsesExcluded++;continue;}
  const key=r.participantId+':'+r.analysisId,previous=unique.get(key);if(previous&&JSON.stringify(previous)!==JSON.stringify(r))throw Error('Conflicting feedback for one analysis');unique.set(key,r);
 }
 const records=[...unique.values()],participants=new Map<string,z.infer<typeof reportRecord>[]>();for(const r of records)participants.set(r.participantId,[...(participants.get(r.participantId)??[]),r]);
 const verified=verifications.filter(v=>{const at=Date.parse(v.verificationDate+'T00:00:00Z');if(!Number.isFinite(at)||at>now)throw Error('Invalid facilitator verification date');if(v.paidCommitment){const paidAt=Date.parse(v.paidCommitment.date+'T00:00:00Z');if(!Number.isFinite(paidAt)||paidAt>now||!Number.isFinite(v.paidCommitment.monthlyUsd)||v.paidCommitment.monthlyUsd<=0)throw Error('Invalid commitment evidence');}return at>cutoff&&v.consentRecorded&&v.genuineLpVerified;});
 const grouped=verified.map(p=>({p,answers:participants.get(p.participantId)??[]}));
 const count=(predicate:(r:z.infer<typeof reportRecord>)=>boolean)=>grouped.filter(g=>g.answers.some(predicate)).length;
 const insight=count(r=>r.usefulInsight==='yes');
 const repeated=grouped.filter(g=>g.answers.some(a=>g.answers.some(b=>b.analysisId!==a.analysisId&&b.analysisAt-a.analysisAt>=86400000&&b.analysisAt-a.analysisAt<=14*86400000))).length;
 const paid=grouped.filter(g=>g.p.paidCommitment!==null&&g.answers.some(r=>r.payIntent==='request-paid-pilot')).length;
 return {status:'Actual retained records only; survey proxies do not establish pilot validation',consentedResponses:records.length,expiredResponsesExcluded,selfReportedParticipants:participants.size,
  facilitatorVerifiedLpTesters:verified.length,verifiedLpFeedbackNonresponders:grouped.filter(g=>!g.answers.length).length,usefulNewInsightAmongVerified:insight,
  overlookedCostsAmongVerified:count(r=>r.overlookedCosts==='yes'),comprehensionCheckPassedAmongVerified:count(r=>r.comprehensionCheckPassed),decisionChangedAmongVerified:count(r=>r.changedDecision),wouldUseAgainAmongVerified:count(r=>r.useAgain==='yes'),
  repeatedFeedbackAnalysesAtLeast24HoursLater:repeated,facilitatorRecordedPaidPilotCommitments:paid,
  thresholds:{genuineLpTesters:10,usefulNewInsight:6,voluntaryReturns:4,crediblePaidCommitments:2,unaidedCompletion:8,financialUnderstanding:8},
  surveyProxyThresholdsMet:verified.length>=10&&insight>=6&&repeated>=4&&paid>=2,
  protocolEvidence:{unaidedCompletion:null,thirtySecondUnderstanding:null,voluntaryReturns:null,concreteUsefulInsights:null,financialUnderstanding:null},
  allThresholdsMet:false,gateStatus:'Not established: separately consented protocol observations are required',
  limitations:['Repeat feedback is not proof of a voluntary return or useful comparison.','A survey insight answer is not independently assessed usefulness.','Correct withdrawal-cost answer is not complete financial comprehension.','No new telemetry or facilitator-note fields are collected by this report.']};
}
