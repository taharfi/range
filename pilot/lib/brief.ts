import { randomUUID } from "node:crypto";
import { analysisToken } from "./feedback";
import { quote } from "./jupiter";
import { atomic, compositionAfter, D, rebalanceInput, units, usablePosition } from "./math";
import { exitToken } from "./meteora";
import type { Brief, Position, Quote, Scenario, Token } from "./models";

export const ASSUMPTIONS = [
  "Principal inventory only. Unclaimed fees and rewards are shown separately and excluded from conversion totals; no double-counting.",
  "Withdrawals are conditional inventory estimates. Locks, operator/fee-owner rights, pool reserves and token-account setup have not been transaction-simulated.",
  "Jupiter output already reflects the route/platform fees in its quote. Those fees must not be subtracted again. Slippage is a bound, not an additional certain charge.",
  "Meteora withdrawal, claim, account-close and redeposit costs are not included in Jupiter quotes. Rent refunds are not trading profit.",
  "A wallet-free quote may omit funded network/priority/rent costs. A zero field without a payer is treated as unavailable, not free execution.",
  "Rebalance sizes one swap using the current pool price, then shows the quoted resulting composition. It does not select a new range or simulate redeposit/composition fees.",
  "These scenarios do not predict future fees or returns, and do not establish historical USD P&L."
];
type Quoter = (input: Token, output: Token, amount: bigint, slippage: number) => Promise<Quote>;
export async function exitScenario(p: Position, target: Token, slippage: number, getQuote: Quoter): Promise<Scenario> {
  const swaps: Quote[] = [];
  let out = 0n, minimum = 0n;
  for (const [t,a] of [[p.x,p.inventory.x],[p.y,p.inventory.y]] as const) {
    const amount = atomic(a,t.decimals);
    if (t.mint === target.mint) {out += amount;minimum += amount;}
    else if (amount > 0n) {
      const q = await getQuote(t,target,amount,slippage);swaps.push(q);
      out += BigInt(q.outAtomic);minimum += BigInt(q.minOutAtomic);
    }
  }
  return {status: swaps.length ? "quoted" : "no-swap",swaps,
    output:[{token:target,amount:units(out,target.decimals),minimum:units(minimum,target.decimals)}],
    warnings:["Full withdrawal and any required claims must succeed first. These are standalone conversion quotes, not a guaranteed atomic zap-out.",
      ...(swaps.length > 1 ? ["Sequential independent quotes do not model the first swap's effect on the next route."] : [])]};
}
export async function rebalanceScenario(p: Position, target: number, slippage: number, getQuote: Quoter): Promise<Scenario> {
  const plan = rebalanceInput(p,target);
  if (!plan) {
    const xv=new D(p.inventory.x).mul(p.poolPrice!),total=xv.plus(p.inventory.y);
    return {status:"no-swap",swaps:[],output:[{token:p.x,amount:p.inventory.x,minimum:p.inventory.x},{token:p.y,amount:p.inventory.y,minimum:p.inventory.y}],warnings:["No representable inventory swap is needed at this pool mark. LP range and redeposit are unchanged/not simulated.",...(total.isZero()?["Composition is undefined for zero inventory."]:[])],achievedXPercent:total.isZero()?undefined:xv.div(total).mul(100).toFixed(4)};
  }
  const q = await getQuote(plan.input,plan.output,plan.amount,slippage);
  const after = compositionAfter(p,plan.input,q.inAtomic,q.outAtomic), lower = compositionAfter(p,plan.input,q.inAtomic,q.minOutAtomic);
  const xValue = new D(after.x).mul(p.poolPrice!), total = xValue.plus(after.y);
  return {status:"quoted",swaps:[q],output:[{token:p.x,amount:after.x,minimum:lower.x},{token:p.y,amount:after.y,minimum:lower.y}],
    achievedXPercent:total.isZero()?"0":xValue.div(total).mul(100).toFixed(4),
    warnings:["Sizing uses token X weight by current pool-mark value, not token counts or verified USD value. Fees/impact make the achieved weight differ from the requested weight.","A full withdraw → swap → redeposit/range change is not simulated; full rebalancing costs remain unavailable."]};
}
export async function buildBrief(p: Position, exitMint: string, target: number, slippage: number): Promise<Brief> {
  const id=randomUUID(), gate=usablePosition(p) || (p.warnings.some(w=>w.includes("blacklisted")) ? "This pool is blacklisted; conversion scenarios are blocked." : null);
  const unavailable=(error: string): Scenario => ({status:"unavailable",swaps:[],output:[],warnings:[],error});
  let exit: Scenario, rebalance: Scenario;
  if (gate) {exit=unavailable(gate);rebalance=unavailable(gate);}
  else {
    try {exit=await exitScenario(p,await exitToken(exitMint,p),slippage,quote);} catch (e) {exit=unavailable(e instanceof Error?e.message:"Exit quote unavailable.");}
    try {rebalance=await rebalanceScenario(p,target,slippage,quote);} catch (e) {rebalance=unavailable(e instanceof Error?e.message:"Rebalance quote unavailable.");}
  }
  return {id,mode:"live",generatedAt:Date.now(),position:p,exit,rebalance,slippageBps:slippage,targetXPercent:target,exitMint,assumptions:ASSUMPTIONS,feedbackToken:analysisToken(id)};
}
