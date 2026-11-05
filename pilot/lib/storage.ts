import path from "node:path";
import { mkdir, readFile, rename, unlink, writeFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
export function dataDirectory(){return path.resolve(/*turbopackIgnore: true*/ process.env.PILOT_FEEDBACK_DIR||".pilot-feedback");}
export function ledgerDirectory(){return path.resolve(/*turbopackIgnore: true*/ process.env.PILOT_LEDGER_DIR||'var/ledger');}
type Locks=Map<string,Promise<unknown>>;
const globals=globalThis as typeof globalThis & {pilotFileLocks?:Locks};
const locks=globals.pilotFileLocks??=new Map();
export async function serialized<T>(key:string,fn:()=>Promise<T>):Promise<T>{
  const run=(locks.get(key)||Promise.resolve()).catch(()=>{}).then(fn);locks.set(key,run);
  try{return await run;}finally{if(locks.get(key)===run)locks.delete(key);}
}
export async function atomicFile(file:string,value:unknown){
  await mkdir(path.dirname(file),{recursive:true,mode:0o700});
  const tmp=file+"."+randomUUID()+".tmp";
  try{await writeFile(tmp,JSON.stringify(value,null,2),{flag:"wx",mode:0o600});await rename(tmp,file);}
  finally{await unlink(tmp).catch(()=>{});}
}
export async function optionalJson(file:string){
  try{return JSON.parse(await readFile(file,"utf8"));}catch(e){if((e as NodeJS.ErrnoException).code==="ENOENT")return null;throw e;}
}
