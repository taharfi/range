import Decimal from "decimal.js";
import type { Amounts, Position, Token } from "./models";

export const D = Decimal.clone({precision: 80, rounding: Decimal.ROUND_FLOOR});
const U64 = 18446744073709551615n;
export function nonnegative(value: unknown): string {
  if (typeof value !== "string" || value.length > 150 || !/^\d+(?:\.\d+)?$/.test(value)) throw new Error("Invalid token amount from data source.");
  const n = new D(value);
  if (!n.isFinite() || n.isNegative()) throw new Error("Invalid financial amount.");
  return n.toFixed();
}
export function atomic(amount: string, decimals: number): bigint {
  if (!Number.isInteger(decimals) || decimals < 0 || decimals > 18) throw new Error("Unsupported token decimals (0–18 required).");
  const n = BigInt(new D(nonnegative(amount)).mul(new D(10).pow(decimals)).floor().toFixed(0));
  if (n > U64) throw new Error("Amount exceeds supported atomic-unit limit.");
  return n;
}
export function units(amount: string | bigint, decimals: number): string {
  return new D(amount.toString()).div(new D(10).pow(decimals)).toFixed();
}
export function conservative(amount: string, decimals: number) {return units(atomic(amount, decimals), decimals);}
export function usablePosition(p: Position, now = Date.now()): string | null {
  if (!p.x.verified || !p.y.verified) return [p.x,p.y].every(t=>t.valuationVerified??t.verified)?"Token metadata supports valuation only. Quotes are unavailable for this token program.":"Token mints/decimals are not independently checked. Quotes are unavailable.";
  if (p.updatedAt === null) return "Position timestamp is unavailable. Refresh or use the native terminal.";
  const age = now - p.updatedAt * 1000;
  if (age > 120_000 || age < -30_000) return "Position data is stale or has an inconsistent timestamp. Refresh before requesting quotes.";
  return null;
}
export function rebalanceInput(p: Position, weight: number): {input: Token; output: Token; amount: bigint} | null {
  if (!Number.isFinite(weight) || weight < 0 || weight > 100) throw new Error("Target composition must be 0–100% token X by pool-mark value.");
  if (!p.poolPrice || !new D(p.poolPrice).isPositive()) throw new Error("Pool price is unavailable; cannot size a composition scenario.");
  const price = new D(p.poolPrice), xValue = new D(p.inventory.x).mul(price);
  const target = xValue.plus(p.inventory.y).mul(weight).div(100), difference = xValue.minus(target);
  if (difference.isZero()) return null;
  const input = difference.isPositive() ? p.x : p.y, output = difference.isPositive() ? p.y : p.x;
  const amount = atomic(difference.isPositive() ? difference.div(price).toFixed() : difference.negated().toFixed(), input.decimals);
  return amount === 0n ? null : {input, output, amount};
}
export function compositionAfter(p: Position, input: Token, inAtomic: string, outAtomic: string): Amounts {
  const inX = input.mint === p.x.mint;
  return {
    x: new D(p.inventory.x)[inX ? "minus" : "plus"](units(inX ? inAtomic : outAtomic, p.x.decimals)).toFixed(),
    y: new D(p.inventory.y)[inX ? "plus" : "minus"](units(inX ? outAtomic : inAtomic, p.y.decimals)).toFixed()
  };
}
