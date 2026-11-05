import path from "node:path";
import { readdir, unlink } from "node:fs/promises";
import { z } from "zod";
import { atomicFile, dataDirectory, optionalJson, serialized } from "./storage";

export const ANALYTICS_VERSION="2026-10-20-usage-v1";
const kinds=["visit","lookup_success","comparison_completed","comparison_incomplete","feedback_submitted","willing_to_pay"] as const;
export type EventKind=typeof kinds[number];
const eventSchema=z.object({kind:z.enum(kinds),at:z.number().int(),reference:z.string().max(100)}).strict();
const usageSchema=z.object({participantId:z.string().regex(/^[a-f0-9]{64}$/),consentVersion:z.literal(ANALYTICS_VERSION),consentedAt:z.number().int(),expiresAt:z.number().int(),events:z.array(eventSchema).max(1000)}).strict();
export type Usage=z.infer<typeof usageSchema>;
function file(pid:string){if(!/^[a-f0-9]{64}$/.test(pid))throw new Error("Invalid usage identifier");return path.join(dataDirectory(),"analytics",pid+".json");}
export async function consentUsage(pid:string,now=Date.now()){
  return serialized(file(pid),async()=>{
    const existing=await optionalJson(file(pid));
    if(existing){const record=usageSchema.parse(existing);if(record.expiresAt>now)return;}
    await atomicFile(file(pid),{participantId:pid,consentVersion:ANALYTICS_VERSION,consentedAt:now,expiresAt:now+30*86400000,events:[]});
  });
}
export async function recordUsage(pid:string,kind:EventKind,reference:string,now=Date.now()){
  // Only server-issued UUIDs or a UTC day may be recorded. Never accept wallet/URL payloads.
  if(!/^([a-f0-9-]{36}|\d{4}-\d{2}-\d{2})$/.test(reference))throw new Error("Invalid analytics reference");
  return serialized(file(pid),async()=>{
    const raw=await optionalJson(file(pid));if(!raw)return false; // revoked consent never silently recreated
    const record=usageSchema.parse(raw);
    if(record.expiresAt<=now){await unlink(file(pid));return false;}
    if(record.events.some(e=>e.kind===kind&&e.reference===reference))return true;
    if(record.events.length>=1000)return false;
    record.events.push({kind,at:now,reference});await atomicFile(file(pid),record);return true;
  });
}
export async function eraseUsage(pid:string){await serialized(file(pid),()=>unlink(file(pid)).catch(e=>{if(e.code!=="ENOENT")throw e;}));}
export async function eraseUsageReference(pid:string,reference:string){
  await serialized(file(pid),async()=>{const raw=await optionalJson(file(pid));if(!raw)return;
    const record=usageSchema.parse(raw);record.events=record.events.filter(e=>e.reference!==reference);await atomicFile(file(pid),record);});
}
export function usageSummary(records:Usage[]){
  const distinct=[...new Map(records.map(r=>[r.participantId,r])).values()];
  const count=(kind:EventKind)=>distinct.reduce((n,r)=>n+r.events.filter(e=>e.kind===kind).length,0);
  return {uniqueConsentingTesters:distinct.length,successfulPositionLookups:count("lookup_success"),completedActionComparisons:count("comparison_completed"),incompleteComparisons:count("comparison_incomplete"),feedbackSubmissions:count("feedback_submitted"),
    returningTesters:distinct.filter(r=>{const visits=r.events.filter(e=>e.kind==="visit");return visits.length>1&&Math.max(...visits.map(e=>e.at))-Math.min(...visits.map(e=>e.at))>=86400000;}).length,
    explicitWillingnessToPayTesters:distinct.filter(r=>r.events.some(e=>e.kind==="willing_to_pay")).length,
    note:"Consenting invited identifiers, not proof of genuine LPs or paid commitments. Visits are deduplicated per UTC day; returns require >=24h."};
}
export async function readUsage(now=Date.now()){
  const dir=path.join(dataDirectory(),"analytics");let names:string[]=[];
  try{names=await readdir(dir);}catch(e){if((e as NodeJS.ErrnoException).code!=="ENOENT")throw e;}
  const records:Usage[]=[];
  for(const name of names.filter(n=>/^[a-f0-9]{64}\.json$/.test(n))){
    const record=usageSchema.parse(await optionalJson(path.join(dir,name)));
    if(record.expiresAt<=now)await eraseUsage(record.participantId);else records.push(record);
  }return records;
}
