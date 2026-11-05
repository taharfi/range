import bs58 from "bs58";
import { z } from "zod";
import { jsonRead, paced, PilotError } from "./http";
import { conservative, D, nonnegative } from "./math";
import type { Lookup, Position, Token } from "./models";
import { randomUUID } from "node:crypto";
import {TOKEN_2022_PROGRAM,token2022Metadata,type MintMetadata} from './mint-metadata';

export const METEORA = "https://dlmm.datapi.meteora.ag";
export const DLMM_PROGRAM = "LBUZKhRxPF3XUpBCjp4YzTKgLccjZhTSDM9YuVaPwxo";
export const TOKEN_PROGRAM = "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA";
export const SOL = "So11111111111111111111111111111111111111112";
export const USDC = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
export const POSITION_DISCRIMINATOR = Buffer.from([117,176,212,199,245,180,133,182]);
export function address(value: unknown): string {
  if (typeof value !== "string" || value.length < 32 || value.length > 44) throw new PilotError("Enter one public 32-byte Solana wallet or position address.");
  try {if (bs58.decode(value).length === 32) return value;} catch {}
  throw new PilotError("That is not a valid public Solana address. Never enter a private key or seed phrase.");
}
const mintSchema = z.object({address: z.string(), symbol: z.string(), decimals: z.number().int().min(0).max(18)});
const poolSchema = z.object({address: z.string(), name: z.string(), token_x: mintSchema, token_y: mintSchema,
  tvl: z.number().finite().nonnegative().nullable().optional(), is_blacklisted: z.boolean().optional()});
const amountSchema = z.object({amount: z.string()});
const indexPositionSchema = z.object({
  positionAddress: z.string(), isClosed: z.boolean(), minPrice: z.string(), maxPrice: z.string(),
  lowerBinId: z.number().int(), upperBinId: z.number().int(),
  poolActivePrice: z.string().nullable().optional(), poolActiveBinId: z.number().int().nullable().optional(),
  updatedAt: z.number().int().nullable().optional(),
  createdAt: z.number().int().nullable().optional(),
  unrealizedPnl: z.object({balanceTokenX: amountSchema, balanceTokenY: amountSchema,
    unclaimedFeeTokenX: amountSchema.optional(), unclaimedFeeTokenY: amountSchema.optional(),
    unclaimedRewardTokenX: amountSchema.optional(), unclaimedRewardTokenY: amountSchema.optional()
  }).nullable().optional()
});
const pageSchema = z.object({hasNext: z.boolean(), positions: z.array(z.unknown()), tokenX: z.string().nullable().optional(), tokenY: z.string().nullable().optional()});
const portfolioSchema = z.object({hasNext: z.boolean(), totalPositions:z.number().int().nonnegative().optional(), pools: z.array(z.object({poolAddress: z.string()}))});
export type LookupInput = {kind: "wallet" | "position"; address: string; page?: number; pool?: string};
type Snapshot = {position: Position; created: number};
type PilotState = {snapshots: Map<string, Snapshot>; mints: Map<string, {token: Token; at: number}>};
const globals = globalThis as typeof globalThis & {pilotPositions?: PilotState};
const state = globals.pilotPositions ??= {snapshots: new Map(), mints: new Map()};

async function rpc(method: "getAccountInfo", key: string) {
  const result = await paced("rpc", 250, () => jsonRead(process.env.SOLANA_RPC_URL || "https://api.mainnet.solana.com", {
    method: "POST", headers: {"Content-Type": "application/json"},
    body: JSON.stringify({jsonrpc: "2.0", id: 1, method, params: [address(key), {encoding: "base64", commitment: "confirmed"}]})
  }));
  const parsed = z.object({result: z.object({context: z.object({slot: z.number()}), value: z.object({owner: z.string(), data: z.tuple([z.string(), z.string()])}).nullable()})}).safeParse(result);
  if (!parsed.success) throw new PilotError("Public Solana RPC could not validate this account. Try a configured read-only RPC provider.", 503);
  return parsed.data.result;
}
export function decodePositionPrefix(ownerProgram: string, data: Buffer) {
  if (ownerProgram !== DLMM_PROGRAM || data.length < 72 || !data.subarray(0,8).equals(POSITION_DISCRIMINATOR))
    throw new PilotError("This address is not a supported open Meteora DLMM PositionV2 account. Other Meteora protocols and account types are outside this pilot's coverage.",400,"UNSUPPORTED_POSITION_ACCOUNT");
  return {pool: bs58.encode(data.subarray(8,40)), owner: bs58.encode(data.subarray(40,72))};
}
async function positionMapping(key: string) {
  const r = await rpc("getAccountInfo", key);
  if (!r.value) throw new PilotError("Position account was not found. It may be closed; this pilot analyzes open positions only.", 404,"POSITION_ACCOUNT_NOT_FOUND");
  return decodePositionPrefix(r.value.owner, Buffer.from(r.value.data[0], "base64"));
}
export function verifyMintData(program: string, raw: Buffer, expectedDecimals: number): boolean {
  return program === TOKEN_PROGRAM && raw.length === 82 && raw[45] === 1 && raw[44] === expectedDecimals;
}
async function token(mint: z.infer<typeof mintSchema>): Promise<Token> {
  address(mint.address);
  const cacheKey = `${mint.address}:${mint.decimals}`;
  const cached = state.mints.get(cacheKey);
  if (cached && Date.now() - cached.at < 60_000) return {...cached.token, symbol: mint.symbol.slice(0,24)};
  let verified = false, program: string | null = null,valuationMetadata:MintMetadata|undefined;
  try {
    const account = await rpc("getAccountInfo", mint.address);
    if (account.value) {program = account.value.owner;const raw=Buffer.from(account.value.data[0],"base64"); verified = verifyMintData(program, raw, mint.decimals);if(program===TOKEN_2022_PROGRAM)valuationMetadata={...token2022Metadata(program,raw,mint.decimals,mint.address),observedSlot:account.context.slot,observedAt:Date.now()};}
  } catch { /* Still show indexed inventory, but the quote gate stays closed. */ }
  const result = {mint: mint.address, symbol: mint.symbol.slice(0,24), decimals: mint.decimals, verified, program,valuationVerified:verified||valuationMetadata?.verified===true,...(valuationMetadata?{valuationMetadata}:{})};
  if (state.mints.size > 200) state.mints.clear();
  state.mints.set(cacheKey, {token: result, at: Date.now()});
  return result;
}
export async function exitToken(mint: string, p: Position): Promise<Token> {
  if (mint === p.x.mint) return p.x;
  if (mint === p.y.mint) return p.y;
  if (mint === SOL) return token({address: SOL, symbol: "SOL", decimals: 9});
  if (mint === USDC) return token({address: USDC, symbol: "USDC", decimals: 6});
  throw new PilotError("Exit asset must be SOL, USDC or one of this pool's tokens.");
}
async function api(path: string) {return paced("meteora", 1100, () => jsonRead(METEORA + path));}

export function normalizePosition(raw: unknown, pool: z.infer<typeof poolSchema>, owner: string, x: Token, y: Token, sourceUrl: string): Position {
  const v = indexPositionSchema.parse(raw);
  if (v.isClosed || !v.unrealizedPnl) throw new Error("Closed or missing current balances");
  address(v.positionAddress);
  if (v.lowerBinId > v.upperBinId || new D(nonnegative(v.minPrice)).gt(nonnegative(v.maxPrice))) throw new Error("Inconsistent position range");
  const warnings: string[] = [];
  const amount = (a: {amount: string}, decimals: number) => {
    const original = nonnegative(a.amount), normalized = conservative(original, decimals);
    if (!new D(original).eq(normalized)) warnings.push("Indexed sub-atomic digits were rounded down; amounts are conservative estimates, not raw account balances.");
    return normalized;
  };
  const b = v.unrealizedPnl;
  const inventory = {x: amount(b.balanceTokenX, x.decimals), y: amount(b.balanceTokenY, y.decimals)};
  const fees = {x: b.unclaimedFeeTokenX ? amount(b.unclaimedFeeTokenX, x.decimals) : null,
    y: b.unclaimedFeeTokenY ? amount(b.unclaimedFeeTokenY, y.decimals) : null};
  const bin = v.poolActiveBinId ?? null;
  const price = v.poolActivePrice ? nonnegative(v.poolActivePrice) : null;
  if (!x.verified || !y.verified) warnings.push([x,y].every(t=>t.valuationVerified??t.verified)?"Mint metadata supports valuation only. Conversion quotes are blocked; transfer and withdrawal eligibility are not established.":"Mint owner/decimals could not be independently checked or use an unsupported token program. Conversion quotes are blocked.");
  if (pool.is_blacklisted) warnings.push("Meteora flags this pool as blacklisted. Conversion quotes are blocked.");
  const createdAt=v.createdAt!=null&&v.createdAt>=1577836800&&v.createdAt*1000<=Date.now()+300000?v.createdAt:null;
  if(v.createdAt!=null&&createdAt===null)warnings.push("Indexed creation timestamp is inconsistent; position age is unavailable.");
  return {address: v.positionAddress, owner, pool: pool.address, pair: `${x.symbol} / ${y.symbol}`, x, y, inventory, fees,
    rewardsPresent: [b.unclaimedRewardTokenX,b.unclaimedRewardTokenY].some(a => a && !new D(nonnegative(a.amount)).isZero()),
    lowerBin: v.lowerBinId, upperBin: v.upperBinId, minPrice: nonnegative(v.minPrice), maxPrice: nonnegative(v.maxPrice),
    poolPrice: price && new D(price).isPositive() ? price : null, activeBin: bin,
    rangeStatus: bin === null ? "unknown" : bin >= v.lowerBinId && bin <= v.upperBinId ? "in-range" : "out-of-range",
    updatedAt: v.updatedAt ?? null, retrievedAt: Date.now(), poolTvlUsd: pool.tvl === null || pool.tvl === undefined ? null : String(pool.tvl),
    ...(v.createdAt!==undefined?{createdAt}:{}),
    confidence: x.verified && y.verified ? "indexed" : "limited", warnings: [...new Set(warnings)],
    sourceUrls: [sourceUrl, `${METEORA}/pools/${pool.address}`, "https://solana.com/docs/rpc/http/getaccountinfo"]};
}
export function save(p: Position) {
  for (const [key,v] of state.snapshots) if (Date.now()-v.created > 120_000) state.snapshots.delete(key);
  while (state.snapshots.size >= 200) state.snapshots.delete(state.snapshots.keys().next().value!);
  const id = randomUUID();state.snapshots.set(id, {position: p, created: Date.now()});return id;
}

// Wallet-scoped discovery only: never enumerate the global pool catalog.
export async function discoverWalletPoolPage(owner:string,page:number){
 const r=portfolioSchema.parse(await api(`/portfolio/open?${new URLSearchParams({user:address(owner),page:String(page),page_size:'50'})}`));
 return {pools:r.pools.map(p=>address(p.poolAddress)),hasNext:r.hasNext,indexed:r.totalPositions??null};
}
export function walletHydrator(owner:string){
 const metadata=new Map<string,Promise<{pool:z.infer<typeof poolSchema>;x:Token;y:Token}>>();
 return async(poolKey:string,page:number)=>{
  if(!metadata.has(poolKey))metadata.set(poolKey,(async()=>{const pool=poolSchema.parse(await api('/pools/'+address(poolKey)));if(pool.address!==poolKey)throw new PilotError('Pool identity mismatch.',502);return {pool,x:await token(pool.token_x),y:await token(pool.token_y)};})());
  let meta:{pool:z.infer<typeof poolSchema>;x:Token;y:Token};
  try{meta=await metadata.get(poolKey)!;}catch(e){metadata.delete(poolKey);throw e;}
  const path=`/positions/${poolKey}/pnl?`+new URLSearchParams({user:address(owner),status:'open',page:String(page),page_size:'100'});
  const r=pageSchema.parse(await api(path));if(r.tokenX!==meta.x.mint||r.tokenY!==meta.y.mint)throw new PilotError('Position response mint mismatch.',502);
  const positions:Position[]=[],issues:{address:string|null;reason:string}[]=[];
  for(const raw of r.positions){try{positions.push(normalizePosition(raw,meta.pool,owner,meta.x,meta.y,METEORA+path));}catch{const key=(raw as {positionAddress?:unknown})?.positionAddress;issues.push({address:typeof key==='string'?key.slice(0,44):null,reason:'Unsupported, closed, missing balances or malformed indexed open record'});}}
  return {positions,issues,hasNext:r.hasNext};
 };
}
// Snapshot handles are server-owned: never quote client-supplied inventories or decimal metadata.
export function getSnapshot(key: string): Position {
  const item = state.snapshots.get(key);
  if (!item || Date.now()-item.created > 120_000) throw new PilotError("Position snapshot expired. Refresh positions and request a new brief.", 409);
  return item.position;
}
type LookupResult = Lookup & {handles: Record<string,string>};
export async function lookup(input: LookupInput): Promise<LookupResult> {
  const key = address(input.address), page = input.page ?? 1;
  let owner = key, pools: string[] = [], only: string | null = null, hasNextPools = false;
  let indexedPositionCount:number|undefined;
  if (input.kind === "position") {const mapping = await positionMapping(key); owner = mapping.owner; pools = [mapping.pool]; only = key;}
  else if (input.pool) pools = [address(input.pool)];
  else {
    const r = portfolioSchema.parse(await api(`/portfolio/open?${new URLSearchParams({user: owner,page: String(page),page_size: "5"})}`));
    pools = r.pools.map(p => address(p.poolAddress));hasNextPools = r.hasNext;indexedPositionCount=r.totalPositions;
  }
  const positions: Position[] = [], warnings: string[] = [], morePositions: LookupResult["morePositions"] = [];
  for (const poolKey of [...new Set(pools)]) {
    try {
      const pool = poolSchema.parse(await api(`/pools/${poolKey}`));
      if (pool.address !== poolKey) throw new Error("Pool address mismatch");
      const x = await token(pool.token_x), y = await token(pool.token_y);
      let found = false;
      // Direct position lookup scans at most five 100-position pages; wallet pages use 20.
      const firstPositionPage = input.pool ? page : 1;
      for (let n = only ? 1 : firstPositionPage; n <= (only ? 5 : firstPositionPage); n++) {
        const path = `/positions/${poolKey}/pnl?${new URLSearchParams({user: owner,status: "open",page: String(n),page_size: only ? "100" : "20"})}`;
        const response = pageSchema.parse(await api(path));
        if (response.tokenX !== x.mint || response.tokenY !== y.mint) throw new Error("Response mint mismatch");
        for (const raw of response.positions) {
          if (only && (raw as {positionAddress?: string}).positionAddress !== only) continue;
          try {positions.push(normalizePosition(raw, pool, owner, x, y, METEORA + path));found = true;}
          catch {warnings.push(`A position in pool ${poolKey} has missing or inconsistent current data and was not quoted.`);}
        }
        if (!response.hasNext || found && only) break;
        if (!only) morePositions.push({pool: poolKey, nextPage: n+1});
        if (only && n === 5) warnings.push("Direct lookup reached its 500-position search limit; the result is incomplete.");
      }
    } catch (e) {
      if (only && e instanceof PilotError) throw e;
      warnings.push(`Pool ${poolKey}: ${e instanceof PilotError ? e.message : "the indexed response failed validation"}`);
    }
  }
  if (only && positions.length === 0) throw new PilotError(warnings[0] || "This position is not in the owner's indexed open positions. The index may lag or this position type may be unsupported.", 404);
  const unique = [...new Map(positions.map(p => [p.address,p])).values()];
  return {mode: "live", snapshotId: randomUUID(), positions: unique, warnings, hasNextPools, poolPage: page, morePositions,
    ...(indexedPositionCount!==undefined?{indexedPositionCount}:{}), handles: Object.fromEntries(unique.map(p => [p.address,save(p)]))};
}
