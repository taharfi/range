import {createHash,randomUUID} from 'node:crypto';
import {mkdir,readFile,writeFile,rename} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import {address} from './meteora';
import {positionActivity,type ActivityPage,type ActivityEvent} from './terminal';
import {ledgerDirectory} from './storage';
export type LedgerCheckpoint={version:1;position:string;pool:string;syncedAt:number;highSlot:number|null;lowSlot:number|null;events:ActivityEvent[];conflicts:string[];warnings:string[];rejected:number;coverage:'partial';sourceUrl:string};
// The position endpoint has no documented since-slot cursor. Re-fetch that position after
// cache expiry, upsert identities durably, and never turn a high watermark into completeness.
export function reconcileLedger(previous:LedgerCheckpoint|null,page:ActivityPage,pool:string):LedgerCheckpoint{
 if(previous&&(previous.position!==page.position||previous.pool!==pool))throw Error('Ledger identity mismatch');
 const events=new Map(previous?.events.map(e=>[e.id,e])??[]),conflicts=new Set(previous?.conflicts??[]);let rejected=previous?.rejected??0;
 for(const id of page.conflictIds??[]){conflicts.add(id);events.delete(id);}
 for(const e of page.events){if(conflicts.has(e.id))continue;const old=events.get(e.id);if(old&&JSON.stringify(old)!==JSON.stringify(e)){events.delete(e.id);conflicts.add(e.id);rejected+=2;}else events.set(e.id,e);}
 const rows=[...events.values()].sort((a,b)=>b.at-a.at||b.slot-a.slot||b.ixIndex-a.ixIndex||a.id.localeCompare(b.id));
 if(rows.length>10000)throw Error('Position ledger size limit reached; no checkpoint was advanced.');
 const slots=rows.map(e=>e.slot);return {version:1,position:page.position,pool,syncedAt:page.retrievedAt,highSlot:slots.length?Math.max(...slots):null,lowSlot:slots.length?Math.min(...slots):null,events:rows,conflicts:[...conflicts],warnings:[...new Set([...(previous?.warnings??[]),...page.warnings,...(conflicts.size?['Conflicting event identities are quarantined. No ledger-derived P&L or complete lifecycle is available.']:[])])],rejected:rejected+page.rejected,coverage:'partial',sourceUrl:page.sourceUrl};
}
const locks=new Map<string,Promise<ActivityPage>>();
export async function syncPositionLedger(position:string,pool:string,options:{directory?:string;now?:number;fetch?:(position:string,pool:string)=>Promise<ActivityPage>}={}):Promise<ActivityPage>{
 address(position);address(pool);const directory=options.directory?resolve(/*turbopackIgnore: true*/ options.directory):ledgerDirectory(),key=createHash('sha256').update(position+':'+pool).digest('hex'),lockKey=directory+key;
 const pending=locks.get(lockKey);if(pending)return pending;
 if(locks.size>=2)throw Error('Historical synchronization capacity reached; retry shortly.');
 const operation=(async()=>{await mkdir(directory,{recursive:true});const file=join(directory,key+'.json');let old:LedgerCheckpoint|null=null;
  try{const bytes=await readFile(file,'utf8');if(bytes.length>8000000)throw Error('Checkpoint exceeds supported size.');old=JSON.parse(bytes);if(old?.version!==1||old.position!==position||old.pool!==pool||!Array.isArray(old.events))throw Error('Checkpoint schema mismatch');}catch(e){if((e as NodeJS.ErrnoException).code!=='ENOENT')throw e;}
  const now=options.now??Date.now();if(old&&now>=old.syncedAt&&now-old.syncedAt<300000)return {events:old.events,warnings:old.warnings,rejected:old.rejected,duplicates:0,retrievedAt:old.syncedAt,sourceUrl:old.sourceUrl,coverage:'partial' as const,position,conflictIds:old.conflicts};
  const page=await (options.fetch??positionActivity)(position,pool),next=reconcileLedger(old,page,pool),temporary=join(directory,key+'.'+randomUUID()+'.tmp');
  await writeFile(temporary,JSON.stringify(next),{encoding:'utf8',mode:0o600});await rename(temporary,file);
  return {...page,events:next.events,warnings:next.warnings,rejected:next.rejected,retrievedAt:next.syncedAt};
 })();locks.set(lockKey,operation);try{return await operation;}finally{locks.delete(lockKey);}
}
