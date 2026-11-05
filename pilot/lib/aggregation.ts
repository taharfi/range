import {randomUUID} from 'node:crypto';
import bs58 from 'bs58';
import {address,discoverWalletPoolPage,walletHydrator,save,SOL,exitToken,decodePositionPrefix,DLMM_PROGRAM,POSITION_DISCRIMINATOR} from './meteora';
import type {Position} from './models';
import {currentMarks,validateMark,valuationEligible,valuePositions,type Mark,type Valuation} from './current-prices';
import {jsonRead,paced,PilotError} from './http';
export type Issue={address:string|null;reason:string};
export type AggregateSummary={status:'running'|'ready'|'failed';discovered:number;indexed:number|null;pools:number;inRange:number;outOfRange:number;unknownRange:number;complete:boolean;issues:Issue[];issueCount?:number;valuation:Valuation|null;updatedAt:number;verifiedOpen:number;onchainDiscovered?:number|null;verificationSlot?:number|null;error?:string};
type Discovery={pools:string[];hasNext:boolean;indexed:number|null};
type Hydration={positions:Position[];issues:Issue[];hasNext:boolean};
export type Dependencies={discover:(page:number)=>Promise<Discovery>;hydrate:(pool:string,page:number)=>Promise<Hydration>;marks:(positions:Position[])=>Promise<Mark[]>;verify?:(positions:Position[])=>Promise<{positions:Position[];issues:Issue[];verified:number;onchainCount?:number;slot?:number}>;sleep?:(ms:number)=>Promise<void>};
export const sleep=(ms:number)=>new Promise<void>(resolve=>setTimeout(resolve,ms));
export async function retry<T>(fn:()=>Promise<T>,pause=sleep):Promise<T>{
 for(let attempt=0;;attempt++){try{return await fn();}catch(e){if(attempt>=2||!(e instanceof PilotError)||e.status!==503||e.code==='UPSTREAM_REJECTED')throw e;await pause(500*2**attempt);}}
}
export async function aggregate(deps:Dependencies,progress:(count:number,positions:Position[])=>void=()=>{}):Promise<{positions:Position[];summary:AggregateSummary}>{
 const issues:Issue[]=[],pools=new Set<string>(),rows=new Map<string,Position>(),deadline=Date.now()+20*60000;let indexed:number|null=null,verified=0,onchainCount:number|null=null,verificationSlot:number|null=null;
 for(let page=1;page<=100;page++){
  const r=await retry(()=>deps.discover(page),deps.sleep);if(indexed===null)indexed=r.indexed;else if(r.indexed!==null&&r.indexed!==indexed)issues.push({address:null,reason:'Indexed count changed during discovery; refresh before claiming complete coverage.'});
  const before=pools.size;r.pools.forEach(p=>pools.add(p));if(!r.hasNext)break;
  if(pools.size===before||page===100){issues.push({address:null,reason:'Discovery pagination stalled or reached its bounded limit.'});break;}
 }
 const list=[...pools];let next=0;
 const worker=async()=>{for(;;){const pool=list[next++];if(!pool)return;if(rows.size>=2000){issues.push({address:null,reason:'Server position limit reached (2,000); remaining pools were not hydrated.'});return;}if(Date.now()>deadline){issues.push({address:null,reason:'Aggregation time budget reached; coverage remains partial. Use a suitable provider before increasing limits.'});return;}
  for(let page=1;page<=100;page++){try{
   if(Date.now()>deadline){issues.push({address:null,reason:`Time budget reached in pool ${pool}; coverage is partial.`});break;}
   const r=await retry(()=>deps.hydrate(pool,page),deps.sleep);issues.push(...r.issues);let added=0;
   for(const p of r.positions){const previous=rows.get(p.address);if(!previous){if(rows.size>=2000){issues.push({address:null,reason:'Server position limit reached (2,000); portfolio coverage is partial.'});break;}rows.set(p.address,p);added++;}
    else if(JSON.stringify([previous.owner,previous.pool,previous.x,previous.y,previous.inventory,previous.fees,previous.updatedAt])!==JSON.stringify([p.owner,p.pool,p.x,p.y,p.inventory,p.fees,p.updatedAt]))issues.push({address:p.address,reason:'Conflicting repeated position; earlier observation retained.'});}
   progress(rows.size,[...rows.values()]);if(!r.hasNext)break;if(!added&&!r.issues.length||page===100){issues.push({address:null,reason:`Position pagination stalled or hit its limit in pool ${pool}.`});break;}
  }catch(e){issues.push({address:null,reason:`Pool ${pool}: ${e instanceof PilotError?e.message:'hydration failed validation'}`});break;}}
 }};
 await Promise.all([worker(),worker()]);let positions=[...rows.values()];
 if(deps.verify){try{const check=await deps.verify(positions);positions=check.positions;issues.push(...check.issues);verified=check.verified;onchainCount=check.onchainCount??null;verificationSlot=check.slot??null;}catch{issues.push({address:null,reason:'Independent account status/discovery verification failed; indexed observations remain unverified.'});}}
 const complete=issues.length===0&&indexed!==null&&indexed===positions.length;
 let marks:Mark[]=[];try{marks=await deps.marks(positions);}catch{issues.push({address:null,reason:'Current pricing provider unavailable.'});marks=[...new Map(positions.flatMap(p=>[p.x,p.y]).map(t=>[t.mint,t])).values()].map(t=>{const mark=validateMark(t,null,null);return valuationEligible(t)?{...mark,code:'PRICE_PROVIDER_FAILED',reason:'Current pricing provider unavailable'}:mark;});}
 const coverageByPosition=new Map<string,import('./current-prices').PositionCoverage>();
 const valuation=valuePositions(positions,marks,complete,Date.now(),(key,result)=>coverageByPosition.set(key,result));
 positions=positions.map(p=>({...p,valuationCoverage:coverageByPosition.get(p.address)}));
 const summary:AggregateSummary={status:'ready',discovered:positions.length,indexed,pools:pools.size,inRange:positions.filter(p=>p.rangeStatus==='in-range').length,outOfRange:positions.filter(p=>p.rangeStatus==='out-of-range').length,unknownRange:positions.filter(p=>p.rangeStatus==='unknown').length,complete,issues:issues.slice(0,20),issueCount:issues.length,valuation,updatedAt:Date.now(),verifiedOpen:verified,onchainDiscovered:onchainCount,verificationSlot};
 return {positions,summary};
}
async function verifyAccounts(positions:Position[],wallet:string){const retained:Position[]=[],issues:Issue[]=[];
 // Same wallet-owner/discriminator filters used by SDK current-account discovery.
 const r=await retry(()=>paced('rpc',250,()=>jsonRead(process.env.SOLANA_RPC_URL||'https://api.mainnet.solana.com',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({jsonrpc:'2.0',id:1,method:'getProgramAccounts',params:[DLMM_PROGRAM,{encoding:'base64',commitment:'confirmed',withContext:true,dataSlice:{offset:0,length:72},filters:[{memcmp:{offset:0,bytes:bs58.encode(POSITION_DISCRIMINATOR)}},{memcmp:{offset:40,bytes:wallet}}]}]})}))) as {result?:{context:{slot:number};value:{pubkey:string;account:{owner:string;data:[string,string]}}[]}};
 if(!Array.isArray(r.result?.value)||!Number.isSafeInteger(r.result.context?.slot))throw new PilotError('Account discovery RPC response incomplete.',503);
 const accounts=new Map(r.result.value.map(a=>[a.pubkey,a.account]));
 for(const p of positions){const a=accounts.get(p.address);if(!a){issues.push({address:p.address,reason:'Position absent from the current owner scan; excluded from active totals (not proof of historical closure).'});continue;}
  try{const mapping=decodePositionPrefix(a.owner,Buffer.from(a.data[0],'base64'));if(mapping.owner!==p.owner||mapping.pool!==p.pool)throw Error();retained.push(p);}catch{issues.push({address:p.address,reason:'Unsupported account layout or owner/pool mismatch; excluded from supported active totals.'});}}
 const indexedKeys=new Set(positions.map(p=>p.address));for(const key of accounts.keys())if(!indexedKeys.has(key))issues.push({address:key,reason:'Current owner-matched PositionV2 is missing indexed hydration. Inventory unavailable; portfolio coverage is partial.'});
 return {positions:retained,issues,verified:retained.length,onchainCount:accounts.size,slot:r.result.context.slot};
}
type Job={id:string;wallet:string;at:number;summary:AggregateSummary;positions:Position[];cursors:Map<string,number>};
const globals=globalThis as typeof globalThis&{rangeAggregation?:Map<string,Job>};const jobs=globals.rangeAggregation??=new Map<string,Job>();
export function startAggregation(wallet:string,refresh=false,dependencies?:Dependencies){address(wallet);const now=Date.now();
 for(const [id,j] of jobs)if(now-j.at>30*60000)jobs.delete(id);
 const previous=[...jobs.values()].find(j=>j.wallet===wallet&&(j.summary.status==='running'||!refresh&&now-j.at<30000));if(previous)return previous;
 if([...jobs.values()].filter(j=>j.summary.status==='running').length>=2)throw new PilotError('Two wallet aggregations are already running. Retry shortly.',429);
 if(jobs.size>=8){const finished=[...jobs.values()].find(j=>j.summary.status!=='running');if(finished)jobs.delete(finished.id);else throw new PilotError('Portfolio workers are busy. Retry shortly.',429);}
 const job:Job={id:randomUUID(),wallet,at:now,positions:[],cursors:new Map(),summary:{status:'running',discovered:0,indexed:null,pools:0,inRange:0,outOfRange:0,unknownRange:0,complete:false,issues:[],valuation:null,updatedAt:now,verifiedOpen:0}};
 jobs.set(job.id,job);const hydrate=walletHydrator(wallet);
 void aggregate(dependencies??{discover:async page=>{const r=await discoverWalletPoolPage(wallet,page);job.summary.indexed=r.indexed;return r;},hydrate,verify:positions=>verifyAccounts(positions,wallet),marks:async positions=>{
  const tokens=positions.flatMap(p=>[p.x,p.y]);if(positions.length)try{tokens.push(await exitToken(SOL,positions[0]));}catch{/* SOL conversion remains unavailable. */}return currentMarks(tokens);
 }},(count,positions)=>{job.summary.discovered=count;job.positions=positions;}).then(r=>{job.positions=r.positions;job.summary=r.summary;}).catch(e=>{job.summary={...job.summary,status:'failed',error:e instanceof PilotError?e.message:'Portfolio discovery failed validation. Retry; no empty portfolio was inferred.'};});
 return job;
}
export function aggregatePage(id:string,cursor?:string){const job=jobs.get(id);if(!job||Date.now()-job.at>30*60000){jobs.delete(id);throw new PilotError('Portfolio snapshot expired. Refresh the wallet.',409);}
 if(job.summary.status!=='ready')return {mode:'live' as const,snapshotId:id,aggregationId:id,aggregate:job.summary,positions:job.positions.slice(0,5),handles:{},warnings:[],hasNextPools:false,morePositions:[],poolPage:1,rowCursor:null};
 const start=cursor?job.cursors.get(cursor):0;if(start===undefined)throw new PilotError('Invalid portfolio cursor.',400);
 const positions=job.positions.slice(start,start+5);let nextCursor:string|null=null,previousCursor:string|null=null;if(start+5<job.positions.length){nextCursor=randomUUID();job.cursors.set(nextCursor,start+5);}if(start>=5){previousCursor=randomUUID();job.cursors.set(previousCursor,start-5);}while(job.cursors.size>1000)job.cursors.delete(job.cursors.keys().next().value!);
 return {mode:'live' as const,snapshotId:id,aggregationId:id,aggregate:job.summary,positions,handles:Object.fromEntries(positions.map(p=>[p.address,save(p)])),warnings:[],hasNextPools:nextCursor!==null,morePositions:[],poolPage:Math.floor(start/5)+1,indexedPositionCount:job.summary.indexed??undefined,rowCursor:nextCursor,previousCursor};
}
