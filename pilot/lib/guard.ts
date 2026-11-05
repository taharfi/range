import { digest, developmentCode, participantId } from "./identity";
import { invitationRequired, sessionFor, type Session } from "./session";
import { PilotError, sameOrigin } from "./http";
import { recordUsage, type EventKind } from "./analytics";
type Bucket={until:number;count:number};
const globals=globalThis as typeof globalThis & {pilotLimits?:{buckets:Map<string,Bucket>;active:number}};
const state=globals.pilotLimits??={buckets:new Map(),active:0};
export function takeLimit(key:string,max:number,window=60000,now=Date.now()){
  for(const [k,b] of state.buckets)if(b.until<=now)state.buckets.delete(k);
  if(state.buckets.size>=2000&&!state.buckets.has(key))throw new PilotError("Pilot request capacity reached. Try again in a minute.",429);
  const old=state.buckets.get(key);const bucket=old&&old.until>now?old:{until:now+window,count:0};
  if(bucket.count>=max)throw new PilotError("Pilot request limit reached. Please wait a minute and try again.",429);
  bucket.count++;state.buckets.set(key,bucket);
}
export function guard(request:Request,kind:"lookup"|"brief"|"feedback"|"session"|"status"|"demo"|"delete"):Session|null{
  if(request.method!=="GET")sameOrigin(request);
  takeLimit("global",120);
  const s=sessionFor(request);
  // Raw client IP is never stored. Only a bounded in-memory keyed digest from the configured proxy.
  const identity=s?.pid||(process.env.PILOT_TRUST_PROXY==="1"?digest("rate:"+(request.headers.get("x-pilot-client-ip")||"unknown")):"local");
  const code=developmentCode(),developer=!!s&&!!code&&s.pid===participantId(code);
  if(!(developer&&(kind==="lookup"||kind==="brief")))
    takeLimit(kind+":"+identity,kind==="lookup"||kind==="brief"?6:kind==="session"?8:kind==="status"?60:20);
  if((kind==="lookup"||kind==="brief")&&invitationRequired()&&!s)throw new PilotError("Enter your tester invitation code to use live lookups.",401);
  return s;
}
export async function expensive<T>(fn:()=>Promise<T>):Promise<T>{
  if(state.active>=2)throw new PilotError("Two analyses are already running. Please try again shortly.",429);
  state.active++;try{return await fn();}finally{state.active--;}
}
export async function track(session:Session|null,kind:EventKind,reference:string){
  if(!session?.consent)return false;
  try{return await recordUsage(session.pid,kind,reference);}catch{console.warn("pilot_usage_write_failed");return false;}
}
