import { randomUUID } from "node:crypto";
import { z } from "zod";
import { digest, equal, participantId, sessionCodes, developmentCode } from "./identity";
import { PilotError } from "./http";
import { consentUsage, eraseUsage, recordUsage } from "./analytics";

export type Session={id:string;pid:string;consent:boolean;expires:number};
const globals=globalThis as typeof globalThis & {pilotSessions?:Map<string,Session>};
const sessions=globals.pilotSessions??=new Map();
const COOKIE="lp_pilot";
export function invitationRequired(){return process.env.PILOT_DEPLOYMENT==="public"||process.env.PILOT_REQUIRE_INVITE==="1";}
function cookieValue(request:Request){return request.headers.get("cookie")?.split(";").map(s=>s.trim()).find(s=>s.startsWith(COOKIE+"="))?.slice(COOKIE.length+1);}
export function sessionFor(request:Request):Session|null{
  const token=cookieValue(request);if(!token||token.length>1500)return null;
  try{
    const [payload,signature,extra]=token.split(".");if(extra||!signature||!equal(digest("session:"+payload),signature))return null;
    const decoded=z.object({id:z.string().uuid()}).parse(JSON.parse(Buffer.from(payload,"base64url").toString()));
    const s=sessions.get(decoded.id);
    if(!s||s.expires<=Date.now()){sessions.delete(decoded.id);return null;}
    if(!sessionCodes().some(c=>participantId(c)===s.pid))return null;
    return s;
  }catch{return null;}
}
function cookie(value:string,maxAge:number){return `${COOKIE}=${value}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${maxAge}${process.env.PILOT_PUBLIC_ORIGIN?.startsWith("https://")?"; Secure":""}`;}
export async function openSession(code:string,consent:boolean){
  if(!sessionCodes().some(c=>equal(c,code)))throw new PilotError("Invitation code not recognized. Ask the pilot facilitator.",403);
  // Building sessions must not count as real consenting pilot testers.
  if(developmentCode()===code)consent=false;
  const pid=participantId(code),now=Date.now();
  if(consent){await consentUsage(pid,now);await recordUsage(pid,"visit",new Date(now).toISOString().slice(0,10),now);}
  for(const [id,s] of sessions)if(s.expires<=now)sessions.delete(id);
  if(sessions.size>=100)throw new PilotError("Pilot session capacity reached. Try again later.",503);
  const session:Session={id:randomUUID(),pid,consent,expires:now+86400000};
  sessions.set(session.id,session);
  const payload=Buffer.from(JSON.stringify({id:session.id})).toString("base64url");
  return {session,cookie:cookie(payload+"."+digest("session:"+payload),86400)};
}
export async function closeSession(session:Session|null){if(session){await eraseUsage(session.pid);for(const [id,s] of sessions)if(s.pid===session.pid)sessions.delete(id);}return cookie("",0);}
