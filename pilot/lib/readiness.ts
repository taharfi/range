import { access, mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { dataDirectory,ledgerDirectory } from "./storage";
import { testerCodes } from "./identity";
export function configurationChecks(){
  const live=process.env.PILOT_DEPLOYMENT==="public",codes=testerCodes();
  let validOrigin=false,validRpc=false;
  try{const u=new URL(process.env.PILOT_PUBLIC_ORIGIN||"");validOrigin=["http:","https:"].includes(u.protocol)&&u.origin===process.env.PILOT_PUBLIC_ORIGIN&&(!live||(u.protocol==="https:"&&!u.hostname.endsWith(".invalid")&&!u.hostname.endsWith(".example")&&!['localhost','127.0.0.1'].includes(u.hostname)));}catch{}
  try{validRpc=new URL(process.env.SOLANA_RPC_URL||"https://api.mainnet.solana.com").protocol==="https:";}catch{}
  const value=process.env.FEEDBACK_SECRET||"";
  return {secret:live?/^[a-f0-9]{64}$/i.test(value)&&new Set(value.toLowerCase()).size>=8:value.length>=32,
    invitations:codes.length===10&&new Set(codes).size===10&&codes.every(c=>live?/^LP-[A-Fa-f0-9]{32}$/.test(c):c.length>=6&&c.length<=80),
    origin:validOrigin,invitationGate:process.env.PILOT_REQUIRE_INVITE==="1",readOnlyRpc:validRpc,
    proxy:!live||process.env.PILOT_TRUST_PROXY==="1",persistentPath:!!process.env.PILOT_FEEDBACK_DIR,persistentLedgerPath:!live||!!process.env.PILOT_LEDGER_DIR,separateStores:path.relative(dataDirectory(),ledgerDirectory())!==''};
}
const globals=globalThis as typeof globalThis & {pilotStorageReadiness?:Map<string,{at:number;value:Promise<boolean>}>};
const probes=globals.pilotStorageReadiness??=new Map<string,{at:number;value:Promise<boolean>}>();
async function storageWritable(directory:string){
 const old=probes.get(directory);if(old&&Date.now()-old.at<30000)return old.value;
 const value=(async()=>{const probe=path.join(directory,'.health-'+randomUUID());try{await mkdir(directory,{recursive:true,mode:0o700});await access(directory);await writeFile(probe,'probe',{flag:'wx',mode:0o600});await unlink(probe);return true;}catch{await unlink(probe).catch(()=>{});return false;}})();
 if(probes.size>=4)probes.delete(probes.keys().next().value!);probes.set(directory,{at:Date.now(),value});return value;
}
export async function readiness(){
  const checks=configurationChecks();
  const [storage,ledgerStorage]=await Promise.all([storageWritable(dataDirectory()),storageWritable(ledgerDirectory())]);
  return {...checks,storage,ledgerStorage};
}
