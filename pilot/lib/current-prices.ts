import {D,atomic,conservative} from './math';
import type {Position,Token} from './models';
import {SOL,TOKEN_PROGRAM} from './meteora';
import {jsonRead,paced} from './http';
export type CoverageCode='MINT_UNVERIFIED'|'MINT_UNSUPPORTED_PROGRAM'|'MINT_UNSUPPORTED_EXTENSIONS'|'PRICE_MISSING'|'PRICE_PROVIDER_FAILED'|'PRICE_INVALID'|'PRICE_DECIMALS_MISMATCH'|'PRICE_TIME_UNKNOWN'|'PRICE_STALE'|'INVENTORY_TIME_UNKNOWN'|'INVENTORY_STALE'|'INVENTORY_FUTURE'|'INVENTORY_INVALID'|'FEE_UNKNOWN'|'FEE_INVALID';
export function valuationEligible(token:Token):boolean{return token.valuationVerified??token.verified;}
function mintCode(token:Token):CoverageCode|null{return valuationEligible(token)?null:token.valuationMetadata?.status==='unsupported-extensions'?'MINT_UNSUPPORTED_EXTENSIONS':token.valuationMetadata?.status==='invalid'?'MINT_UNVERIFIED':token.program&&token.program!==TOKEN_PROGRAM?'MINT_UNSUPPORTED_PROGRAM':'MINT_UNVERIFIED';}
export type PositionCoverage={principal:boolean;fees:boolean;issues:{component:'principal'|'fees';side:'x'|'y';mint:string;code:CoverageCode}[]};
export type Mark={mint:string;usd:string|null;decimals:number;slot:number|null;at:number|null;retrievedAt:number;status:'fresh'|'stale'|'unavailable';source:'Jupiter Price V3';reason?:string;code?:CoverageCode};
export type Valuation={principalUsd:string;feesUsd:string;principalSol:string|null;feesSol:string|null;valuedPositions:number;feeValuedPositions:number;totalPositions:number;complete:boolean;feesComplete:boolean;unpricedMints:string[];marks:Mark[];at:number;expiresAt:number;markCount:number;unpricedMintCount:number;reasonCounts?:Partial<Record<CoverageCode,number>>;valuationOnlyPositions?:number};
export function validateMark(token:Token,raw:unknown,blockTime:number|null,now=Date.now()):Mark{
 const v=raw as {usdPrice?:unknown;decimals?:unknown;blockId?:unknown}|null;
 const base:Mark={mint:token.mint,decimals:token.decimals,usd:null,slot:null,at:null,retrievedAt:now,status:'unavailable',source:'Jupiter Price V3'};
 if(!valuationEligible(token))return {...base,code:mintCode(token)!,reason:token.valuationMetadata?.reason??(token.program&&token.program!==TOKEN_PROGRAM?'Mint program is outside current valuation support':'Mint decimals/program not independently validated')};
 if(!v)return {...base,code:'PRICE_MISSING',reason:'No price returned for this mint'};
 if(v.decimals!==token.decimals)return {...base,code:'PRICE_DECIMALS_MISMATCH',reason:'Price decimals do not match the verified mint'};
 if(typeof v.usdPrice!=='number'||!Number.isFinite(v.usdPrice)||v.usdPrice<=0||!Number.isSafeInteger(v.blockId)||Number(v.blockId)<=0)return {...base,code:'PRICE_INVALID',reason:'Invalid price or source slot metadata'};
 if(blockTime===null||!Number.isSafeInteger(blockTime)||blockTime<1577836800)return {...base,code:'PRICE_TIME_UNKNOWN',reason:'Price block timestamp unavailable'};
 const at=blockTime*1000,status=now-at>120000||at>now+30000?'stale':'fresh';
 return {...base,usd:String(v.usdPrice),slot:v.blockId as number,at,status,...(status==='stale'?{code:'PRICE_STALE' as const,reason:'Price observation outside the current 120-second window'}:{})};
}
export async function currentMarks(tokens:Token[]):Promise<Mark[]>{
 const unique=[...new Map(tokens.map(t=>[t.mint,t])).values()],marks:Mark[]=[];
 for(let offset=0;offset<unique.length;offset+=50){const batch=unique.slice(offset,offset+50);let data:Record<string,unknown>={},failed=false;
  try{data=await paced('jupiter',process.env.JUPITER_API_KEY?1100:2100,()=>jsonRead('https://api.jup.ag/price/v3?ids='+batch.map(t=>t.mint).join(','),{headers:process.env.JUPITER_API_KEY?{'x-api-key':process.env.JUPITER_API_KEY}:{}})) as Record<string,unknown>;}catch{failed=true;/* Provider failure is not a missing mint price. */}
  const slots=[...new Set(batch.map(t=>(data[t.mint] as {blockId?:number})?.blockId).filter((s):s is number=>Number.isSafeInteger(s)))];
  const times=new Map<number,number|null>();
  if(slots.length)try{const r=await paced('rpc',250,()=>jsonRead(process.env.SOLANA_RPC_URL||'https://api.mainnet.solana.com',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(slots.map((slot,id)=>({jsonrpc:'2.0',id,method:'getBlockTime',params:[slot]})))}));
   if(Array.isArray(r))for(const v of r){if(Number.isInteger(v.id)&&slots[v.id]!==undefined)times.set(slots[v.id],typeof v.result==='number'?v.result:null);}
  }catch{/* Unknown block time prevents freshness validation. */}
  for(const t of batch){const v=data[t.mint] as {blockId?:number}|undefined,mark=validateMark(t,v,times.get(v?.blockId??-1)??null);marks.push(failed&&valuationEligible(t)?{...mark,code:'PRICE_PROVIDER_FAILED',reason:'Current price provider request failed'}:mark);}
 }
 return marks;
}
export function valuePositions(positions:Position[],marks:Mark[],coverage:boolean,now=Date.now(),onCoverage?:(position:string,result:PositionCoverage)=>void):Valuation{
 const effective:Mark[]=marks.map(m=>m.status==='fresh'&&(m.at===null||now-m.at>120000||m.at>now+30000)?{...m,status:'stale',code:m.at===null?'PRICE_TIME_UNKNOWN':'PRICE_STALE',reason:'Price expired during aggregation'}:m);
 const reasonCounts:Partial<Record<CoverageCode,number>>={};
 const prices=new Map(effective.map(p=>[p.mint,p])),missing=new Set<string>();let principal=new D(0),fees=new D(0),valued=0,feeValued=0,expiresAt=now+120000;
 for(const p of positions){let pv=new D(0),fv=new D(0),ok=true,feeOk=true;const issues:PositionCoverage['issues']=[];
  const timeCode:CoverageCode|null=!p.updatedAt?'INVENTORY_TIME_UNKNOWN':p.updatedAt*1000>now+30000?'INVENTORY_FUTURE':now-p.updatedAt*1000>120000?'INVENTORY_STALE':null;
  for(const side of ['x','y'] as const){const token=p[side],mark=prices.get(token.mint);
   const priceCode:CoverageCode|null=mintCode(token)??(!mark?'PRICE_MISSING':mark.decimals!==token.decimals?'PRICE_DECIMALS_MISMATCH':mark.at===null?(mark.code??'PRICE_TIME_UNKNOWN'):mark.status!=='fresh'?(mark.code??'PRICE_STALE'):!mark.usd||!new D(mark.usd).isFinite()||!new D(mark.usd).isPositive()?'PRICE_INVALID':null);
   for(const component of ['principal','fees'] as const){const value=component==='principal'?p.inventory[side]:p.fees[side];let quantity:InstanceType<typeof D>|null=null;
    const codes:CoverageCode[]=[];
    if(timeCode)codes.push(timeCode);
    if(value===null)codes.push('FEE_UNKNOWN');else try{atomic(value,token.decimals);quantity=new D(value);if(!quantity.eq(conservative(value,token.decimals)))throw Error();}catch{codes.push(component==='principal'?'INVENTORY_INVALID':'FEE_INVALID');}
    if(quantity&&!quantity.isZero()&&priceCode)codes.push(priceCode);
    if(codes.length){if(component==='principal')ok=false;else feeOk=false;for(const code of new Set(codes))issues.push({component,side,mint:token.mint,code});if(quantity&&!quantity.isZero()&&priceCode)missing.add(token.mint);}
    else if(quantity&&!quantity.isZero()&&mark?.usd){if(component==='principal')pv=pv.plus(quantity.mul(mark.usd));else fv=fv.plus(quantity.mul(mark.usd));}
   }
  }
  // The partial subtotal includes only positions with all nonzero components priced.
  if(ok){principal=principal.plus(pv);valued++;}if(feeOk){fees=fees.plus(fv);feeValued++;}
  for(const code of new Set(issues.map(i=>i.code)))reasonCounts[code]=(reasonCounts[code]??0)+1;
  onCoverage?.(p.address,{principal:ok,fees:feeOk,issues});
  if(ok||feeOk){if(p.updatedAt)expiresAt=Math.min(expiresAt,p.updatedAt*1000+120000);for(const t of [p.x,p.y]){const mark=prices.get(t.mint);if(mark?.status==='fresh'&&mark.at!==null)expiresAt=Math.min(expiresAt,mark.at+120000);}}
 }
 const sol=prices.get(SOL),solFresh=sol?.status==='fresh'&&sol.at!==null&&now-sol.at<=120000&&sol.at<=now+30000&&sol.usd;
 if(solFresh&&sol?.at)expiresAt=Math.min(expiresAt,sol.at+120000);
 return {principalUsd:principal.toFixed(),feesUsd:fees.toFixed(),principalSol:solFresh?principal.div(sol!.usd!).toFixed():null,feesSol:solFresh?fees.div(sol!.usd!).toFixed():null,valuedPositions:valued,feeValuedPositions:feeValued,totalPositions:positions.length,complete:coverage&&valued===positions.length,feesComplete:coverage&&feeValued===positions.length,unpricedMints:[...missing].slice(0,50),marks:effective.slice(0,50),at:now,expiresAt,markCount:marks.length,unpricedMintCount:missing.size,reasonCounts,valuationOnlyPositions:positions.filter(p=>[p.x,p.y].some(t=>!t.verified&&valuationEligible(t))).length};
}
