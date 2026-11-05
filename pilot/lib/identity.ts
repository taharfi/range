import { createHmac, timingSafeEqual } from "node:crypto";
import { PilotError } from "./http";
export function pilotSecret() {
  const value=process.env.FEEDBACK_SECRET;
  if(!value||value.length<32)throw new PilotError("Pilot storage/session secret is not configured. Contact the facilitator.",503);
  return value;
}
export function digest(value:string){return createHmac("sha256",pilotSecret()).update(value).digest("hex");}
export function equal(a:string,b:string){const x=Buffer.from(a),y=Buffer.from(b);return x.length===y.length&&timingSafeEqual(x,y);}
export function testerCodes(){return (process.env.PILOT_TESTER_CODES||"").split(",").map(x=>x.trim()).filter(Boolean);}
// Explicit local-only access; never admitted on staging/public or a remote origin.
export function developmentCode(){
  if(process.env.PILOT_DEPLOYMENT!=="local")return null;
  try{const u=new URL(process.env.PILOT_PUBLIC_ORIGIN||"http://127.0.0.1:3000");if(!["127.0.0.1","localhost","[::1]"].includes(u.hostname))return null;}catch{return null;}
  return process.env.PILOT_DEVELOPMENT_CODE?.trim()||null;
}
export function sessionCodes(){const code=developmentCode();return [...testerCodes(),...(code?[code]:[])];}
export function participantId(code:string){return digest("participant:"+code);}
