import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { z } from "zod";
import { feedbackDirectory, type FeedbackRecord } from "../lib/feedback";
import { readUsage,usageSummary } from "../lib/analytics";
import {pilotReport} from '../lib/pilot-report';

const dir=feedbackDirectory();
const ledgerSchema=z.array(z.object({
  participantId:z.string().regex(/^[a-f0-9]{64}$/),consentRecorded:z.literal(true),
  genuineLpVerified:z.boolean(),verificationDate:z.string().date(),
  method:z.literal("facilitated-position-walkthrough"),
  paidCommitment:z.object({date:z.string().date(),monthlyUsd:z.number().positive(),evidenceRef:z.string().min(1).max(120)}).nullable()
}));
let files:string[]=[];
try{files=await readdir(dir);}catch(e){if((e as NodeJS.ErrnoException).code!=="ENOENT")throw e;}
const records:FeedbackRecord[]=[];
for(const f of files.filter(x=>/^[a-f0-9]{64}\.json$/.test(x)))records.push(JSON.parse(await readFile(path.join(dir,f),"utf8")));
let ledger:z.infer<typeof ledgerSchema>=[];
try{ledger=ledgerSchema.parse(JSON.parse(await readFile(path.join(dir,"facilitator-verifications.json"),"utf8")));}
catch(e){if((e as NodeJS.ErrnoException).code!=="ENOENT")throw new Error("Facilitator ledger failed validation. Do not report verified pilot results.");}
if(new Set(ledger.map(x=>x.participantId)).size!==ledger.length)throw new Error("Duplicate participant in facilitator ledger; verification totals were not reported.");
console.log(JSON.stringify({
  ...pilotReport(records,ledger),
  consentedUsage:usageSummary(await readUsage()),
},null,2));
