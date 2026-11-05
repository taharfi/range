import { z } from "zod";
import { D } from "./math";
import { jsonRead, paced, PilotError } from "./http";
import type { Quote, Token } from "./models";

export const ORDER_URL = "https://api.jup.ag/swap/v2/order";
const integer = z.string().regex(/^\d+$/);
const responseSchema = z.object({
  inputMint: z.string(), outputMint: z.string(), inAmount: integer, outAmount: integer,
  otherAmountThreshold: integer.optional(), transaction: z.null(), taker: z.null().optional(),
  slippageBps: z.number().int().min(0).max(10_000), router: z.string(),
  priceImpact: z.number().finite().nullable().optional(), priceImpactPct: z.string().nullable().optional(),
  feeBps: z.number().int().min(0).max(10000).nullable().optional(), feeMint: z.string().nullable().optional(),
  signatureFeeLamports: z.number().int().nonnegative().nullable().optional(),
  prioritizationFeeLamports: z.number().int().nonnegative().nullable().optional(),
  rentFeeLamports: z.number().int().nonnegative().nullable().optional(),
  signatureFeePayer: z.string().nullable().optional(), prioritizationFeePayer: z.string().nullable().optional(),
  rentFeePayer: z.string().nullable().optional(), contextSlot: z.number().int().nullable().optional()
});
export function quoteUrl(input: Token, output: Token, amount: bigint, slippage: number) {
  if (amount <= 0n || amount > 18446744073709551615n) throw new PilotError("Swap amount must be a positive u64 atomic quantity.");
  if (!Number.isInteger(slippage) || slippage < 1 || slippage > 500) throw new PilotError("Slippage must be 1–500 basis points.");
  return ORDER_URL + "?" + new URLSearchParams({inputMint: input.mint, outputMint: output.mint, amount: amount.toString(), slippageBps: String(slippage)});
}
export function parseQuote(raw: unknown, input: Token, output: Token, amount: bigint, slippage: number, now = Date.now()): Quote {
  const v = responseSchema.parse(raw);
  if (v.inputMint !== input.mint || v.outputMint !== output.mint || BigInt(v.inAmount) !== amount || v.slippageBps > slippage || BigInt(v.outAmount) === 0n || BigInt(v.outAmount)>18446744073709551615n)
    throw new PilotError("Jupiter quote changed the requested assets/amount or exceeds the slippage cap.", 502);
  if (v.otherAmountThreshold && BigInt(v.otherAmountThreshold) > BigInt(v.outAmount)) throw new PilotError("Invalid quote minimum output.", 502);
  const effectiveMinimum = BigInt(v.outAmount) * BigInt(10_000-v.slippageBps)/10_000n;
  if (v.otherAmountThreshold && BigInt(v.otherAmountThreshold) < effectiveMinimum) throw new PilotError("Quote minimum output is below the returned slippage protection.", 502);
  // Quote-only zero fields with no payer are not a funded network cost estimate.
  const hasNetwork = v.signatureFeePayer && v.prioritizationFeePayer && v.signatureFeeLamports != null && v.prioritizationFeeLamports != null;
  return {input, output, inAtomic: v.inAmount, outAtomic: v.outAmount,
    minOutAtomic: v.otherAmountThreshold ?? effectiveMinimum.toString(),
    // Current priceImpact is percent; deprecated priceImpactPct is a decimal ratio.
    priceImpactPercent: v.priceImpact != null ? new D(v.priceImpact).toFixed() : v.priceImpactPct != null ? new D(v.priceImpactPct).mul(100).toFixed() : null,
    feeBps: v.feeBps ?? null, feeMint: v.feeMint ?? null, slippageBps: v.slippageBps,
    router: v.router, receivedAt: now, contextSlot: v.contextSlot ?? null,
    networkLamports: hasNetwork ? (BigInt(v.signatureFeeLamports!) + BigInt(v.prioritizationFeeLamports!)).toString() : null,
    rentLamports: v.rentFeePayer && v.rentFeeLamports != null ? String(v.rentFeeLamports) : null,
    source: "Jupiter Swap V2"};
}
export async function quote(input: Token, output: Token, amount: bigint, slippage: number): Promise<Quote> {
  if (!input.verified || !output.verified) throw new PilotError("Unverified or unsupported mint; cannot quote this conversion.");
  return paced("jupiter", process.env.JUPITER_API_KEY ? 1100 : 2100, async () => {
    const raw = await jsonRead(quoteUrl(input, output, amount, slippage), {
      headers: process.env.JUPITER_API_KEY ? {"x-api-key": process.env.JUPITER_API_KEY} : {}
    });
    try {return parseQuote(raw,input,output,amount,slippage);} catch (e) {
      if (e instanceof PilotError) throw e;
      throw new PilotError("Jupiter could not supply a valid quote for this amount. No route may be available.", 503);
    }
  });
}
