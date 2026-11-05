import bs58 from 'bs58';
import {z} from 'zod';
import {address,METEORA} from './meteora';
import {jsonRead,paced,PilotError} from './http';
import {nonnegative,conservative} from './math';

export type ClosedPosition={address:string;pool:string;pair:string;x:{mint:string;symbol:string};y:{mint:string;symbol:string};createdAt:number|null;closedAt:number|null;deposits:{x:string|null;y:string|null};withdrawals:{x:string|null;y:string|null};claims:{x:string|null;y:string|null};quality:'indexed-unreconciled'};
export type ClosedPage={positions:ClosedPosition[];poolPage:number;hasNextPools:boolean;morePositions:{pool:string;nextPage:number}[];indexedAllTimeCount:number|null;warnings:string[];retrievedAt:number;sourceUrls:string[];windowDays:365};
export type ActivityEvent={id:string;signature:string;ixIndex:number;type:string;position:string;pool:string;actor:string;at:number;slot:number;x:{mint:string;amount:string};y:{mint:string;amount:string};quality:'indexed-unverified'};
export type ActivityPage={events:ActivityEvent[];warnings:string[];rejected:number;duplicates:number;retrievedAt:number;sourceUrl:string;coverage:'partial';position:string;conflictIds?:string[]};
const key=z.string().transform(v=>address(v));
const time=z.number().int().nonnegative().nullable().optional();
const mint=z.object({address:key,symbol:z.string().max(100),decimals:z.number().int().min(0).max(18)});
const poolSchema=z.object({address:key,token_x:mint,token_y:mint});
const pairAmount=z.object({tokenX:z.object({amount:z.string()}).optional(),tokenY:z.object({amount:z.string()}).optional()});
const positionSchema=z.object({positionAddress:key,isClosed:z.literal(true),createdAt:time,closedAt:time,allTimeDeposits:pairAmount.optional(),allTimeWithdrawals:pairAmount.optional(),allTimeFees:pairAmount.optional()});
async function api(path:string){return paced('meteora',1100,()=>jsonRead(METEORA+path));}
function seconds(v:number|null|undefined,now=Date.now()):number|null{if(v==null)return null;if(v<1577836800||v*1000>now+300000)throw new Error('Inconsistent source timestamp');return v;}
export async function closedPositions(user:string,page=1,poolKey?:string):Promise<ClosedPage>{
 const wallet=address(user),urls:string[]=[],warnings:string[]=[];let pools:string[],hasNextPools=false,indexedAllTimeCount:number|null=null;
 if(poolKey)pools=[address(poolKey)];
 else{
  const path='/portfolio?'+new URLSearchParams({user:wallet,page:String(page),page_size:'2',days_back:'365'});urls.push(METEORA+path);
  const r=z.object({pools:z.array(z.object({poolAddress:key})).max(2),hasNext:z.boolean(),totalPositions:z.number().int().nonnegative().optional()}).parse(await api(path));
  pools=r.pools.map(p=>p.poolAddress);hasNextPools=r.hasNext;indexedAllTimeCount=r.totalPositions??null;
 }
 const positions:ClosedPosition[]=[],morePositions:ClosedPage['morePositions']=[];
 for(const pool of [...new Set(pools)]){
  try{
   const meta=poolSchema.parse(await api('/pools/'+pool));if(meta.address!==pool)throw new Error('Pool mismatch');
   const path=`/positions/${pool}/pnl?`+new URLSearchParams({user:wallet,status:'closed',page:String(poolKey?page:1),page_size:'20'});urls.push(METEORA+path);
   const r=z.object({tokenX:key.nullable(),tokenY:key.nullable(),hasNext:z.boolean(),positions:z.array(z.unknown()).max(20)}).parse(await api(path));
   if(r.tokenX!==meta.token_x.address||r.tokenY!==meta.token_y.address)throw new Error('Mint mismatch');
   if(r.hasNext)morePositions.push({pool,nextPage:(poolKey?page:1)+1});
   for(const raw of r.positions){try{
    const p=positionSchema.parse(raw),createdAt=seconds(p.createdAt),closedAt=seconds(p.closedAt);
    if(createdAt&&closedAt&&createdAt>closedAt)throw new Error('Closure predates creation');
    const amounts=(v:z.infer<typeof pairAmount>|undefined)=>({x:v?.tokenX?conservative(nonnegative(v.tokenX.amount),meta.token_x.decimals):null,y:v?.tokenY?conservative(nonnegative(v.tokenY.amount),meta.token_y.decimals):null});
    positions.push({address:p.positionAddress,pool,pair:`${meta.token_x.symbol.slice(0,24)} / ${meta.token_y.symbol.slice(0,24)}`,x:{mint:meta.token_x.address,symbol:meta.token_x.symbol.slice(0,24)},y:{mint:meta.token_y.address,symbol:meta.token_y.symbol.slice(0,24)},createdAt,closedAt,deposits:amounts(p.allTimeDeposits),withdrawals:amounts(p.allTimeWithdrawals),claims:amounts(p.allTimeFees),quality:'indexed-unreconciled'});
   }catch{warnings.push(`A closed-position record in ${pool} failed validation; coverage is incomplete.`);}}
  }catch(e){warnings.push(`Closed pool ${pool}: ${e instanceof PilotError?e.message:'source data failed validation'}`);}
 }
 const unique=new Map<string,ClosedPosition>();for(const p of positions){if(unique.has(p.address)){warnings.push('A repeated closed position was returned; the first observation was retained.');continue;}unique.set(p.address,p);}
 return {positions:[...unique.values()],poolPage:page,hasNextPools,morePositions,indexedAllTimeCount,warnings:[...new Set(warnings)],retrievedAt:Date.now(),sourceUrls:urls,windowDays:365};
}
const eventSchema=z.object({signature:z.string(),ixIndex:z.number().int().nonnegative(),eventType:z.string().min(1).max(64),positionAddress:key,poolAddress:key,userAddress:key,blockTime:z.number().int().nonnegative(),slot:z.number().int().positive(),tokenX:key,tokenY:key,amountX:z.string(),amountY:z.string()});
export function normalizeActivity(raw:unknown,position:string,pool:string,now=Date.now()):Omit<ActivityPage,'retrievedAt'|'sourceUrl'|'position'>{
 const r=z.object({events:z.array(z.unknown()).max(10000)}).parse(raw),events=new Map<string,ActivityEvent>(),conflicts=new Set<string>();let rejected=0,duplicates=0;
 const warnings=['Position-scoped indexed events only. Creation, closure, transfers, costs and complete wallet history are not established. Transactions have not been independently decoded.'];
 for(const item of r.events){try{
  const v=eventSchema.parse(item);if(v.positionAddress!==position||v.poolAddress!==pool)throw new Error('Identity mismatch');
  if(bs58.decode(v.signature).length!==64)throw new Error('Invalid signature');
  // The production API returns milliseconds although position createdAt/closedAt are seconds.
  const at=v.blockTime>=1e12?v.blockTime:v.blockTime*1000;if(at<1577836800000||at>now+300000)throw new Error('Invalid event time');
  const id=[v.signature,v.ixIndex,v.eventType,v.positionAddress].join(':');
  const event:ActivityEvent={id,signature:v.signature,ixIndex:v.ixIndex,type:v.eventType,position,pool,actor:v.userAddress,at,slot:v.slot,x:{mint:v.tokenX,amount:nonnegative(v.amountX)},y:{mint:v.tokenY,amount:nonnegative(v.amountY)},quality:'indexed-unverified'};
  if(conflicts.has(id)){rejected++;continue;}
  const prev=events.get(id);if(prev){if(JSON.stringify(prev)!==JSON.stringify(event)){events.delete(id);conflicts.add(id);rejected+=2;}else duplicates++;continue;}
  events.set(id,event);
 }catch{rejected++;}}
 if(rejected)warnings.push(`${rejected} invalid or conflicting event records were excluded; no balances or P&L are calculated from this history.`);
 if(duplicates)warnings.push(`${duplicates} identical repeated events were deduplicated by transaction, instruction, type and position.`);
 return {events:[...events.values()].sort((a,b)=>b.at-a.at||b.slot-a.slot||b.ixIndex-a.ixIndex||a.id.localeCompare(b.id)),warnings,rejected,duplicates,coverage:'partial',conflictIds:[...conflicts]};
}
export async function positionActivity(position:string,pool:string):Promise<ActivityPage>{
 const key=address(position),poolKey=address(pool),path=`/positions/${key}/historical?order_direction=desc`;
 return {...normalizeActivity(await api(path),key,poolKey),position:key,retrievedAt:Date.now(),sourceUrl:METEORA+path};
}
