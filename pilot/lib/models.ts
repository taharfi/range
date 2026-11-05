export type Token = {mint: string; symbol: string; decimals: number; verified: boolean; program: string | null; valuationVerified?:boolean; valuationMetadata?:import('./mint-metadata').MintMetadata};
export type Amounts = {x: string; y: string};
export type Position = {
  address: string; owner: string; pool: string; pair: string;
  x: Token; y: Token; inventory: Amounts; fees: {x: string | null; y: string | null};
  rewardsPresent: boolean; lowerBin: number; upperBin: number;
  minPrice: string; maxPrice: string; poolPrice: string | null;
  activeBin: number | null; rangeStatus: "in-range" | "out-of-range" | "unknown";
  updatedAt: number | null; retrievedAt: number; poolTvlUsd: string | null; createdAt?: number | null;
  confidence: "indexed" | "limited"; warnings: string[]; sourceUrls: string[];
  valuationCoverage?: import('./current-prices').PositionCoverage;
};
export type Quote = {
  input: Token; output: Token; inAtomic: string; outAtomic: string; minOutAtomic: string;
  priceImpactPercent: string | null; feeBps: number | null; feeMint: string | null;
  slippageBps: number; receivedAt: number; contextSlot: number | null;
  router: string; networkLamports: string | null; rentLamports: string | null;
  source: "Jupiter Swap V2" | "Synthetic example";
};
export type Scenario = {
  status: "quoted" | "no-swap" | "unavailable";
  output: {token: Token; amount: string; minimum: string}[];
  swaps: Quote[]; warnings: string[]; error?: string;
  achievedXPercent?: string;
};
export type Brief = {
  id: string; mode: "live" | "demo"; generatedAt: number;
  position: Position; exit: Scenario; rebalance: Scenario;
  slippageBps: number; targetXPercent: number; exitMint: string;
  assumptions: string[]; feedbackToken: string | null;
};
export type Lookup = {
  aggregationId?: string; rowCursor?: string|null; previousCursor?:string|null; aggregate?: import('./aggregation').AggregateSummary;
  mode: "live" | "demo"; snapshotId: string; positions: Position[]; warnings: string[];
  hasNextPools: boolean; poolPage: number; morePositions: {pool: string; nextPage: number}[];
  indexedPositionCount?: number;
};
