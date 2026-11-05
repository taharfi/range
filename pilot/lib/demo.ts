import type { Brief, Position, Quote, Token } from "./models";
import { ASSUMPTIONS, exitScenario, rebalanceScenario } from "./brief";
import { D } from "./math";
import { SOL, USDC } from "./meteora";

export async function demoBrief(): Promise<Brief> {
  const x:Token={mint:SOL,symbol:"SOL",decimals:9,verified:true,program:"synthetic"};
  const y:Token={mint:USDC,symbol:"USDC",decimals:6,verified:true,program:"synthetic"};
  const p:Position={address:"Synthetic example — not an on-chain position",owner:"No wallet",pool:"Synthetic pool",pair:"SOL / USDC",x,y,
    inventory:{x:"2",y:"200"},fees:{x:"0.01",y:"1"},rewardsPresent:false,lowerBin:0,upperBin:10,minPrice:"90",maxPrice:"130",poolPrice:"100",activeBin:4,rangeStatus:"in-range",updatedAt:Math.floor(Date.now()/1000),retrievedAt:Date.now(),poolTvlUsd:null,confidence:"limited",warnings:["All amounts in this example are invented to demonstrate the interface. They are not observations or tester results."],sourceUrls:[]};
  const fake=async(input:Token,output:Token,amount:bigint,slippage:number):Promise<Quote>=>{
    const out = new D(amount.toString()).div(new D(10).pow(input.decimals)).mul(input.mint===SOL?100:0.01).mul(0.995).mul(new D(10).pow(output.decimals)).floor().toFixed(0);
    return {input,output,inAtomic:amount.toString(),outAtomic:out,minOutAtomic:(BigInt(out)*BigInt(10000-slippage)/10000n).toString(),priceImpactPercent:"0.5",feeBps:0,feeMint:null,slippageBps:slippage,receivedAt:Date.now(),contextSlot:null,router:"Synthetic",networkLamports:null,rentLamports:null,source:"Synthetic example"};
  };
  return {id:"synthetic-example",mode:"demo",generatedAt:Date.now(),position:p,
    exit:await exitScenario(p,y,50,fake),rebalance:await rebalanceScenario(p,60,50,fake),
    slippageBps:50,targetXPercent:60,exitMint:USDC,assumptions:ASSUMPTIONS,feedbackToken:null};
}
