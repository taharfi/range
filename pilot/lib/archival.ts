import {createHash} from 'node:crypto';
import {join,resolve} from 'node:path';
import bs58 from 'bs58';
import {z} from 'zod';
import {address} from './meteora';
import {jsonRead,paced,PilotError} from './http';
import {atomicFile,optionalJson,serialized,ledgerDirectory} from './storage';

const signature=z.string().refine(s=>{try{return bs58.decode(s).length===64;}catch{return false;}});
const transaction=z.object({slot:z.number().int().safe().nonnegative(),blockTime:z.number().int().safe().nullable(),
 transaction:z.object({signatures:z.array(signature).min(1),message:z.object({accountKeys:z.array(z.string()),instructions:z.array(z.unknown())}).passthrough()}).passthrough(),
 meta:z.object({err:z.unknown(),fee:z.number().int().safe().nonnegative()}).passthrough().nullable()
}).passthrough();
const scopeSchema=z.object({address:z.string().transform(address),from:z.number().int().safe().min(1577836800),until:z.number().int().safe().min(1577836800)}).strict().refine(v=>v.from<v.until,'Historical interval must be nonempty.');
export type HistoryScope=z.infer<typeof scopeSchema>;
const checkpointSchema=z.object({version:z.literal(1),scope:scopeSchema,source:z.literal('Helius getTransactionsForAddress'),pages:z.number().int().nonnegative(),cursor:z.string().max(200).nullable(),cursors:z.array(z.string().max(200)),queryExhausted:z.boolean(),syncedAt:z.number().int().safe(),transactions:z.array(transaction).max(1000),coverage:z.literal('query-only-unreconciled')}).strict();
export type HistoryCheckpoint=z.infer<typeof checkpointSchema>;
type FetchPage=(scope:HistoryScope,cursor:string|null)=>Promise<unknown>;
const responseSchema=z.object({result:z.object({data:z.array(transaction).max(100),paginationToken:z.string().min(1).max(200).nullable()})});

export async function heliusHistoryPage(scope:HistoryScope,cursor:string|null):Promise<unknown>{
 const url=process.env.SOLANA_RPC_URL;let allowed=false;
 try{const u=new URL(url||'');allowed=u.protocol==='https:'&&u.hostname==='mainnet.helius-rpc.com'&&!!u.searchParams.get('api-key');}catch{}
 if(!allowed)throw new PilotError('Configure a server-only Helius mainnet RPC before archival synchronization.',503);
 for(let attempt=0;;attempt++)try{
  return await paced('rpc',250,()=>jsonRead(url!,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({jsonrpc:'2.0',id:1,method:'getTransactionsForAddress',params:[scope.address,{transactionDetails:'full',encoding:'json',sortOrder:'asc',commitment:'finalized',maxSupportedTransactionVersion:1,limit:100,...(cursor?{paginationToken:cursor}:{}),filters:{blockTime:{gte:scope.from,lt:scope.until},status:'any',tokenAccounts:'none'}}]})}));
 }catch(e){if(attempt>=2||!(e instanceof PilotError)||e.code!=='UPSTREAM_TRANSIENT')throw e;await new Promise(r=>setTimeout(r,500*2**attempt));}
}

// One bounded page per call; this is not a UI-triggered wallet-wide backfill.
export async function syncArchivalPage(input:HistoryScope,options:{directory?:string;fetch?:FetchPage;now?:number}={}):Promise<HistoryCheckpoint>{
 const scope=scopeSchema.parse(input),directory=resolve(options.directory??join(ledgerDirectory(),'archival'));
 const hash=createHash('sha256').update(JSON.stringify(scope)).digest('hex'),file=join(directory,hash+'.json');
 return serialized(file,async()=>{
  const stored=await optionalJson(file),old=stored===null?null:checkpointSchema.parse(stored);
  if(old&&JSON.stringify(old.scope)!==JSON.stringify(scope))throw new PilotError('Historical checkpoint scope mismatch.',409);
  if(old?.queryExhausted)return old;
  if(old&&old.pages>=10)throw new PilotError('Ten-page historical budget reached; checkpoint preserved.',409);
  const parsed=responseSchema.safeParse(await (options.fetch??heliusHistoryPage)(scope,old?.cursor??null));
  if(!parsed.success)throw new PilotError('Historical provider response incomplete or unsupported. Checkpoint was not advanced.',502);
  const page=parsed.data.result,cursor=page.paginationToken;
  if(cursor&&(cursor===old?.cursor||old?.cursors.includes(cursor)))throw new PilotError('Historical pagination repeated a cursor. Checkpoint was not advanced.',502);
  const rows=new Map(old?.transactions.map(t=>[t.transaction.signatures[0],t])??[]);let added=0;
  for(const t of page.data){
   if(t.blockTime===null||t.blockTime<scope.from||t.blockTime>=scope.until)throw new PilotError('Historical timestamp outside requested interval. Checkpoint was not advanced.',502);
   const keys=[...t.transaction.message.accountKeys,...((t.meta as any)?.loadedAddresses?.writable??[]),...((t.meta as any)?.loadedAddresses?.readonly??[])];
   if(!keys.includes(scope.address))throw new PilotError('Historical transaction does not reference requested account. Checkpoint was not advanced.',502);
   const id=t.transaction.signatures[0],previous=rows.get(id);
   if(previous&&JSON.stringify(previous)!==JSON.stringify(t))throw new PilotError('Conflicting historical transaction. Checkpoint was not advanced.',502);
   if(!previous)added++;
   rows.set(id,t);
  }
  if(cursor&&added===0)throw new PilotError('Historical pagination made no progress. Checkpoint was not advanced.',502);
  const next=checkpointSchema.parse({version:1,scope,source:'Helius getTransactionsForAddress',pages:(old?.pages??0)+1,cursor,cursors:[...(old?.cursors??[]),...(cursor?[cursor]:[])],queryExhausted:cursor===null,syncedAt:options.now??Date.now(),transactions:[...rows.values()].sort((a,b)=>a.slot-b.slot||(Number(a.transactionIndex??0)-Number(b.transactionIndex??0))),coverage:'query-only-unreconciled'});
  await atomicFile(file,next);return next;
 });
}
