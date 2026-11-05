import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {TOKEN_2022_PROGRAM,token2022Metadata} from '../lib/mint-metadata';
import {validateMark,valuePositions,type Mark} from '../lib/current-prices';
import {verifyMintData,lookup,SOL} from '../lib/meteora';
import {demoBrief} from '../lib/demo';
import {usablePosition} from '../lib/math';
import {quote} from '../lib/jupiter';
import type {Token} from '../lib/models';
const capture=JSON.parse(await readFile(new URL('../evidence/token2022/mints.json',import.meta.url),'utf8'));
const records=capture.records as {mint:string;owner:string;rawBase64:string;sha256:string;expectedDecimals:number;extensions:{type:number;length:number}[]}[];
const example=records.find(r=>r.extensions.every(e=>[18,19].includes(e.type)))!,raw=Buffer.from(example.rawBase64,'base64');
const decode=(b=raw,decimals=example.expectedDecimals,mint=example.mint,owner=TOKEN_2022_PROGRAM)=>token2022Metadata(owner,b,decimals,mint);
test('real mint fixtures match hashes and distinguish four metadata-only mints from transfer fees',()=>{
 assert.ok(Number.isSafeInteger(capture.slot));let accepted=0,rejected=0;
 for(const r of records){const bytes=Buffer.from(r.rawBase64,'base64');assert.equal(createHash('sha256').update(bytes).digest('hex'),r.sha256);const v=token2022Metadata(r.owner,bytes,r.expectedDecimals,r.mint);assert.equal(verifyMintData(r.owner,bytes,r.expectedDecimals),false);assert.deepEqual(v.extensionTypes,r.extensions.map(e=>e.type));if(r.extensions.some(e=>e.type===1)){assert.equal(v.status,'unsupported-extensions');rejected++;}else{assert.equal(v.verified,true);accepted++;}}
 assert.equal(accepted,4);assert.equal(rejected,1);
});
test('base mint layouts require owner, initialization, matching decimals and valid authority options',()=>{
 assert.equal(decode(raw.subarray(0,82)).verified,true);
 for(const [offset,value] of [[45,0],[45,2],[0,2],[46,2]]){const bad=Buffer.from(raw);bad[offset]=value;assert.equal(decode(bad).verified,false);}
 assert.equal(decode(raw,example.expectedDecimals+1).verified,false);assert.equal(decode(raw,19).verified,false);assert.equal(decode(raw,example.expectedDecimals,example.mint,'11111111111111111111111111111111').verified,false);
 for(const length of [0,81,83,165,355])assert.equal(decode(Buffer.alloc(length)).verified,false);
});
test('TLV rejects token accounts, nonzero mint padding, truncated/duplicate and unknown extensions',()=>{
 const changed=(at:number,n:number)=>{const b=Buffer.from(raw);b[at]=n;return b;};
 assert.equal(decode(changed(165,2)).verified,false);assert.equal(decode(changed(82,1)).verified,false);
 assert.equal(decode(raw.subarray(0,raw.length-1)).verified,false);
 const wrongLength=Buffer.from(raw);wrongLength.writeUInt16LE(63,168);assert.equal(decode(wrongLength).verified,false);
 const duplicate=Buffer.concat([raw,raw.subarray(166,234)]);assert.equal(decode(duplicate).verified,false);
 const unknown=Buffer.concat([raw,Buffer.from([255,0,0,0])]);assert.equal(decode(unknown).status,'unsupported-extensions');
 const malformed=Buffer.concat([raw,Buffer.from([0,0,1])]);assert.equal(decode(malformed).verified,false);
 assert.equal(decode(Buffer.concat([raw,Buffer.alloc(8)])).verified,true);
});
test('metadata requires matching mint, bounded valid UTF-8/Borsh strings and complete parsing',()=>{
 const start=238; // 166 + metadata-pointer header/value (68) + metadata header (4).
 const spoof=Buffer.from(raw);spoof[start+32]^=1;assert.equal(decode(spoof).verified,false);
 const overrun=Buffer.from(raw);overrun.writeUInt32LE(0xffffffff,start+64);assert.equal(decode(overrun).verified,false);
 const utf8=Buffer.from(raw);utf8[start+68]=0xff;assert.equal(decode(utf8).verified,false);
 const tail=Buffer.concat([raw,Buffer.from([1])]);assert.equal(decode(tail).verified,false);
});
test('valuation-only eligibility cannot enable quotes, change freshness or bypass an unsupported extension',async()=>{
 const now=Date.now(),base=(await demoBrief()).position;
 const token:Token={mint:example.mint,symbol:'TEST',decimals:example.expectedDecimals,program:TOKEN_2022_PROGRAM,verified:false,valuationVerified:decode().verified,valuationMetadata:decode()};
 const position={...base,x:token,inventory:{x:'2',y:'0'},fees:{x:'1',y:'0'},updatedAt:Math.floor(now/1000)};
 const mark=validateMark(token,{usdPrice:3,decimals:token.decimals,blockId:1},Math.floor(now/1000),now);
 assert.equal(mark.status,'fresh');const v=valuePositions([position],[mark],true,now);assert.equal(v.principalUsd,'6');assert.equal(v.feesUsd,'3');assert.equal(v.complete,true);
 assert.equal(valuePositions([position],[mark],true,now+121000).complete,false);assert.match(usablePosition(position)!,/Quotes are unavailable/);
 await assert.rejects(quote(token,base.y,1n,50),/Unverified or unsupported mint/);
 const unsupported={...token,valuationVerified:false,valuationMetadata:{...decode(),verified:false,status:'unsupported-extensions' as const}};
 assert.equal(validateMark(unsupported,{usdPrice:3,decimals:token.decimals,blockId:1},Math.floor(now/1000),now).code,'MINT_UNSUPPORTED_EXTENSIONS');
});
test('wallet adapter attaches valuation-only metadata from RPC and keeps conversion confidence limited',async()=>{
 const fixture=JSON.parse(await readFile(new URL('../evidence/positions-sample.json',import.meta.url),'utf8'));
 const original=globalThis.fetch;globalThis.fetch=async(input,init)=>{
  const url=String(input);
  if(url.includes('/portfolio/open'))return Response.json({hasNext:false,pools:[{poolAddress:fixture.positions[0].poolAddress??'5rCf1DM8LjKTw4YqhnoLcngyZYeNnQqztScTogYHAS6'}]});
  if(url.includes('/pools/'))return Response.json({address:'5rCf1DM8LjKTw4YqhnoLcngyZYeNnQqztScTogYHAS6',name:'TEST-SOL',token_x:{address:example.mint,symbol:'TEST',decimals:example.expectedDecimals},token_y:{address:SOL,symbol:'SOL',decimals:9}});
  if(url.includes('/positions/'))return Response.json({...fixture,tokenX:example.mint,tokenY:SOL,positions:[{...fixture.positions[0],unrealizedPnl:{balanceTokenX:{amount:'2'},balanceTokenY:{amount:'0'}}}]});
  const key=JSON.parse(String(init?.body)).params[0],classic=Buffer.alloc(82);classic[44]=9;classic[45]=1;
  return Response.json({result:{context:{slot:capture.slot},value:{owner:key===example.mint?TOKEN_2022_PROGRAM:'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',data:[(key===example.mint?raw:classic).toString('base64'),'base64']}}});
 };
 try{const r=await lookup({kind:'wallet',address:'ACUvKyTc7dEwR8oMqUZd5xpj19osaFZoXPauuy52adQM'});assert.equal(r.positions.length,1);assert.equal(r.positions[0].x.valuationVerified,true);assert.equal(r.positions[0].x.verified,false);assert.equal(r.positions[0].confidence,'limited');assert.ok(r.positions[0].warnings.some(w=>w.includes('Conversion quotes are blocked')));}finally{globalThis.fetch=original;}
});
