import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { atomic, compositionAfter, conservative, D, rebalanceInput, units, usablePosition } from "../lib/math";
import { address, decodePositionPrefix, DLMM_PROGRAM, normalizePosition, SOL, TOKEN_PROGRAM, USDC, verifyMintData } from "../lib/meteora";
import { parseQuote, quoteUrl } from "../lib/jupiter";
import { demoBrief } from "../lib/demo";
import { exitScenario, rebalanceScenario } from "../lib/brief";
import type { Token } from "../lib/models";

const x:Token={mint:SOL,symbol:"SOL",decimals:9,verified:true,program:TOKEN_PROGRAM};
const y:Token={mint:USDC,symbol:"USDC",decimals:6,verified:true,program:TOKEN_PROGRAM};
const fixture=async()=>JSON.parse(await readFile(new URL("../evidence/jupiter-quote-sample.json",import.meta.url),"utf8"));

test("atomic conversion preserves quantities above JavaScript safe integer range",()=>{
  assert.equal(atomic("18446744073.709551615",9),18446744073709551615n);
  assert.equal(units("18446744073709551615",9),"18446744073.709551615");
  assert.throws(()=>atomic("18446744073.709551616",9));
});
test("6/9/18 decimal normalization never rounds above indexed inventory",()=>{
  assert.equal(atomic("0.0000019",6),1n);assert.equal(atomic("0.0000000019",9),1n);
  assert.equal(atomic("0.000000000000000001",18),1n);
  assert.equal(conservative("49.447046883999995",9),"49.447046883");
});
test("negative, exponent, nonfinite and unsupported-decimal financial inputs are rejected",()=>{
  for(const v of ["-1","NaN","Infinity","1e20",""," 1"])assert.throws(()=>atomic(v,9));
  assert.throws(()=>atomic("1",19));assert.throws(()=>atomic("1",-1));
});
test("public address validation rejects secrets, malformed and wrong decoded lengths",()=>{
  assert.equal(address(SOL),SOL);
  for(const s of ["wallet","0".repeat(44),"one two three four five six seven eight nine ten eleven twelve","1".repeat(33)])assert.throws(()=>address(s));
});
test("PositionV2 owner and pool prefix is gated by program and discriminator",()=>{
  const data=Buffer.concat([Buffer.from([117,176,212,199,245,180,133,182]),Buffer.alloc(32,1),Buffer.alloc(32,2)]);
  const result=decodePositionPrefix(DLMM_PROGRAM,data);assert.equal(address(result.pool),result.pool);assert.equal(address(result.owner),result.owner);
  assert.throws(()=>decodePositionPrefix(TOKEN_PROGRAM,data));data[0]=0;assert.throws(()=>decodePositionPrefix(DLMM_PROGRAM,data));
});
test("mint decimals, token program, initialization and exact classic layout checked",()=>{
  const data=Buffer.alloc(82);data[44]=9;data[45]=1;
  assert.equal(verifyMintData(TOKEN_PROGRAM,data,9),true);
  assert.equal(verifyMintData(TOKEN_PROGRAM,data,6),false);
  assert.equal(verifyMintData(DLMM_PROGRAM,data,9),false);
  assert.equal(verifyMintData(TOKEN_PROGRAM,Buffer.concat([data,Buffer.alloc(1)]),9),false);
  data[45]=0;assert.equal(verifyMintData(TOKEN_PROGRAM,data,9),false);
});
test("position freshness rejects missing, old, future and unverified inputs",async()=>{
  const p=(await demoBrief()).position,now=Date.now();p.updatedAt=Math.floor(now/1000);
  assert.equal(usablePosition(p,now),null);
  assert.match(usablePosition({...p,updatedAt:null},now)!,/timestamp/);
  assert.match(usablePosition({...p,updatedAt:Math.floor(now/1000)-121},now)!,/stale/);
  assert.match(usablePosition({...p,updatedAt:Math.floor(now/1000)+31},now)!,/timestamp/);
  assert.match(usablePosition({...p,x:{...p.x,verified:false}},now)!,/decimals/);
});
test("real indexed response maps current balances, not all-time deposits or API PnL",async()=>{
  const page=JSON.parse(await readFile(new URL("../evidence/positions-sample.json",import.meta.url),"utf8"));
  const raw=page.positions[0];const pool={address:"5rCf1DM8LjKTw4YqhnoLcngyZYeNnQqztScTogYHAS6",name:"SOL-USDC",token_x:{address:SOL,symbol:"SOL",decimals:9},token_y:{address:USDC,symbol:"USDC",decimals:6}};
  const p=normalizePosition(raw,pool,"21du6vEJaw4GMmttGFSy7eZRm5zB2dGCEVGunjiBCANU",x,y,"https://dlmm.datapi.meteora.ag");
  assert.equal(p.inventory.x,"49.447046883");assert.equal(p.inventory.y,"1331.732808");assert.equal(p.rangeStatus,"in-range");
  assert.ok(!("pnlUsd" in p));assert.ok(!("allTimeDeposits" in p));assert.ok(p.warnings.some(w=>w.includes("rounded down")));
  const noFee={...raw,unrealizedPnl:{...raw.unrealizedPnl,unclaimedFeeTokenX:undefined}};
  assert.equal(normalizePosition(noFee,pool,p.owner,x,y,"url").fees.x,null);
  assert.equal(normalizePosition({...raw,poolActiveBinId:null},pool,p.owner,x,y,"url").rangeStatus,"unknown");
  assert.equal(p.createdAt,raw.createdAt);
  const badAge=normalizePosition({...raw,createdAt:Date.now()},pool,p.owner,x,y,"url");
  assert.equal(badAge.createdAt,null);assert.deepEqual(badAge.inventory,p.inventory);
  assert.match(badAge.warnings.join(' '),/creation timestamp/);
});
test("read-only quote URL never includes taker, payer, referral or transaction submission",()=>{
  const url=new URL(quoteUrl(x,y,100000000n,50));assert.equal(url.pathname,"/swap/v2/order");
  assert.deepEqual([...url.searchParams.keys()].sort(),["amount","inputMint","outputMint","slippageBps"].sort());
  assert.throws(()=>quoteUrl(x,y,0n,50));assert.throws(()=>quoteUrl(x,y,1n,501));
});
test("real Jupiter quote parses fee units and treats no-payer zero costs as unknown",async()=>{
  const raw=await fixture(),q=parseQuote(raw,x,y,100000000n,50);
  assert.equal(q.outAtomic,raw.outAmount);assert.equal(q.networkLamports,null);assert.equal(q.rentLamports,null);
  assert.equal(q.priceImpactPercent,new D(raw.priceImpact).toFixed());assert.equal(q.feeBps,2);
});
test("deprecated decimal impact is converted into percentage and negative improvement retained",async()=>{
  const raw=await fixture();delete raw.priceImpact;raw.priceImpactPct="-0.0001";
  assert.equal(parseQuote(raw,x,y,100000000n,50).priceImpactPercent,"-0.01");
});
test("quotes with transactions, mismatched assets/amount/slippage/minimum fail closed",async()=>{
  const raw=await fixture();
  for(const delta of [{transaction:"unsigned-bytes"},{inputMint:USDC},{outAmount:"0"},{inAmount:"1"},{slippageBps:99},{otherAmountThreshold:"99999999999999"}])
    assert.throws(()=>parseQuote({...raw,...delta},x,y,100000000n,50));
});
test("missing minimum applies a floored slippage bound; no quote fee is deducted twice",async()=>{
  const raw=await fixture();delete raw.otherAmountThreshold;const q=parseQuote(raw,x,y,100000000n,50);
  assert.equal(q.minOutAtomic,(BigInt(raw.outAmount)*9950n/10000n).toString());assert.equal(q.outAtomic,raw.outAmount);
});
test("live JupiterZ zero-slippage quote honors a higher user cap without inventing extra slippage",async()=>{
  const sample=JSON.parse(await readFile(new URL("../evidence/diagnostic-quote-0.json",import.meta.url),"utf8"));
  const amount=BigInt(sample.request.amount),q=parseQuote(sample.response,x,y,amount,50);
  assert.equal(q.router,"jupiterz");assert.equal(q.slippageBps,0);assert.equal(q.minOutAtomic,q.outAtomic);
  assert.throws(()=>parseQuote({...sample.response,otherAmountThreshold:"0"},x,y,amount,50),/protection/);
});
test("rebalance sizing handles both directions, edges and already balanced inventory",async()=>{
  const p=(await demoBrief()).position;
  assert.equal(rebalanceInput(p,50),null);
  assert.equal(rebalanceInput(p,100)!.amount,200000000n);
  assert.equal(rebalanceInput(p,0)!.amount,2000000000n);
  assert.equal(rebalanceInput(p,60)!.input.mint,USDC);
  assert.throws(()=>rebalanceInput(p,101));assert.throws(()=>rebalanceInput({...p,poolPrice:null},50));
});
test("cash-flow conservation uses quoted output once, fees remain separate",async()=>{
  const p=(await demoBrief()).position;
  const after=compositionAfter(p,x,"1000000000","99000000");assert.deepEqual(after,{x:"1",y:"299"});
  const fake=async(input:Token,output:Token,amount:bigint)=>({...parseQuote(await fixture(),x,y,100000000n,50),input,output,inAtomic:amount.toString(),outAtomic:"199000000",minOutAtomic:"198005000"});
  const exit=await exitScenario(p,y,50,fake);assert.equal(exit.output[0].amount,"399");assert.equal(exit.output[0].minimum,"398.005");
  assert.equal(exit.swaps.length,1); // 0.01 SOL and 1 USDC unclaimed fees are not added.
});
test("quote failure preserves an unavailable estimate instead of using synthetic/current marks",async()=>{
  const p=(await demoBrief()).position;
  await assert.rejects(exitScenario(p,y,50,async()=>{throw new Error("no route");}),/no route/);
  const balanced=await rebalanceScenario(p,50,50,async()=>{throw new Error("must not quote");});assert.equal(balanced.status,"no-swap");
});
