import type {Position,Token} from './models';
import {currentMarks,valuedPositions,validateMark,valuationEligible,type Mark} from './current-prices';
import {save} from './meteora';

// Fresh direct lookups/refreshes get new marks and new server-owned handles.
// Pricing failure removes USD availability, never an otherwise valid position.
export async function priceLookup<T extends {positions:Position[];handles:Record<string,string>}>(found:T,load:(tokens:Token[])=>Promise<Mark[]>=currentMarks):Promise<T>{
 let marks:Mark[]=[];
 const tokens=[...new Map(found.positions.flatMap(p=>[p.x,p.y]).map(t=>[t.mint,t])).values()];
 try{marks=await load(tokens);}catch{marks=tokens.map(t=>{const mark=validateMark(t,null,null);return valuationEligible(t)?{...mark,code:'PRICE_PROVIDER_FAILED',reason:'Current price provider unavailable'}:mark;});}
 const positions=valuedPositions(found.positions,marks,false).positions;
 return {...found,positions,handles:Object.fromEntries(positions.map(p=>[p.address,save(p)]))};
}
