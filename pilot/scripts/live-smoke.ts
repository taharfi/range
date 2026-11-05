import { writeFile, mkdir } from "node:fs/promises";
const base=process.env.PILOT_BASE_URL || "http://127.0.0.1:3000";
const wallet="21du6vEJaw4GMmttGFSy7eZRm5zB2dGCEVGunjiBCANU";
let cookie="";
const code=process.env.PILOT_TESTER_CODES?.split(",")[0]?.trim();
if(code){const login=await fetch(base+"/api/session",{method:"POST",headers:{"Content-Type":"application/json",Origin:new URL(base).origin},body:JSON.stringify({code,analyticsConsent:false})});if(!login.ok)throw new Error("QA session could not be opened.");cookie=login.headers.get("set-cookie")?.split(";")[0]||"";}
async function post(path:string,data:unknown){const r=await fetch(base+path,{method:"POST",headers:{"Content-Type":"application/json",Origin:new URL(base).origin,...(cookie?{Cookie:cookie}:{})},body:JSON.stringify(data),signal:AbortSignal.timeout(120_000)});const v=await r.json();return{status:r.status,data:v};}
const walletResult=await post("/api/positions",{kind:"wallet",address:wallet});
let positionResult:unknown=null,briefResult:unknown=null;
if(walletResult.status===200&&walletResult.data.positions.length){
  const p=walletResult.data.positions[0];
  briefResult=await post("/api/brief",{handle:walletResult.data.handles[p.address],exitMint:"EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",targetXPercent:50,slippageBps:50});
  // Independent address path exercises RPC discriminator -> owner/pool -> documented position API.
  positionResult=await post("/api/positions",{kind:"position",address:p.address});
}
const result={checkedAt:new Date().toISOString(),purpose:"Read-only smoke test using public research sample; not a tester or user-response record",wallet:walletResult,position:positionResult,brief:briefResult};
// Do not persist a usable feedback receipt even in a local sample output.
if((result.brief as any)?.data)delete (result.brief as any).data.feedbackToken;
await mkdir("evidence",{recursive:true});await writeFile("evidence/live-smoke.json",JSON.stringify(result,null,2));
console.log(JSON.stringify({walletStatus:walletResult.status,positions:walletResult.data.positions?.length??0,warnings:walletResult.data.warnings,
  positionStatus:(positionResult as any)?.status,briefStatus:(briefResult as any)?.status,
  exit:(briefResult as any)?.data?.exit,rebalance:(briefResult as any)?.data?.rebalance},null,2));
