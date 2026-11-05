import bs58 from 'bs58';
export const TOKEN_2022_PROGRAM='TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb';
export type MintMetadata={verified:boolean;extensionTypes:number[];status:'verified'|'invalid'|'unsupported-extensions';reason:string;observedSlot?:number;observedAt?:number};
// Narrow valuation-only decoder. Schema provenance and policy: TOKEN2022_VALUATION.md.
// This never grants conversion/transfer eligibility or reads external metadata URLs.
export function token2022Metadata(program:string,raw:Buffer,decimals:number,mint:string):MintMetadata{
 const extensionTypes:number[]=[];
 const result=(status:MintMetadata['status'],reason:string):MintMetadata=>({verified:status==='verified',extensionTypes,status,reason});
 try{
  if(program!==TOKEN_2022_PROGRAM||raw.length<82||raw.length>16384||raw.length===355)return result('invalid','Unsupported owner or mint layout');
  if(!Number.isInteger(decimals)||decimals<0||decimals>18||raw[44]!==decimals||raw[45]!==1)return result('invalid','Mint initialization or decimals mismatch');
  if(raw.readUInt32LE(0)>1||raw.readUInt32LE(46)>1)return result('invalid','Invalid mint authority option');
  const mintBytes=Buffer.from(bs58.decode(mint));if(mintBytes.length!==32)return result('invalid','Invalid mint address');
  if(raw.length===82)return result('verified','Initialized Token-2022 base mint; valuation only');
  if(raw.length<166||raw[165]!==1||raw.subarray(82,165).some(n=>n!==0))return result('invalid','Invalid mint account type or padding');
  let at=166;
  while(at<raw.length){
   if(raw.subarray(at).every(n=>n===0))break;
   if(at+4>raw.length)return result('invalid','Truncated extension header');
   const type=raw.readUInt16LE(at),length=raw.readUInt16LE(at+2);at+=4;
   if(type===0||extensionTypes.includes(type)||extensionTypes.length>=32||at+length>raw.length)return result('invalid','Invalid, duplicate or truncated extension');
   extensionTypes.push(type);const value=raw.subarray(at,at+length);at+=length;
   if(type===18&&length!==64)return result('invalid','Invalid metadata pointer length');
   if(type===19){
    if(length<80||!value.subarray(32,64).equals(mintBytes))return result('invalid','Token metadata mint mismatch or truncation');
    let pos=64;
    const text=()=>{if(pos+4>length)throw Error();const size=value.readUInt32LE(pos);pos+=4;if(pos+size>length)throw Error();const s=new TextDecoder('utf-8',{fatal:true}).decode(value.subarray(pos,pos+size));pos+=size;return s;};
    text();text();text();if(pos+4>length)throw Error();const count=value.readUInt32LE(pos);pos+=4;if(count>128)throw Error();const keys=new Set<string>();
    for(let i=0;i<count;i++){const key=text();if(keys.has(key))throw Error();keys.add(key);text();}
    if(pos!==length)return result('invalid','Unparsed token metadata bytes');
   }
  }
  if(extensionTypes.some(type=>type!==18&&type!==19))return result('unsupported-extensions','Only metadata pointer/token metadata extensions are supported for valuation');
  return result('verified','Metadata-only Token-2022 mint; valuation only, conversions blocked');
 }catch{return result('invalid','Malformed mint or metadata extension');}
}
