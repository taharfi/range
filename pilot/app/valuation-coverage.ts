import type {CoverageCode} from '../lib/current-prices';
export const coverageLabels:Record<CoverageCode,string>={
 MINT_UNSUPPORTED_EXTENSIONS:'Mint extensions are outside current valuation support',
 MINT_UNVERIFIED:'Mint program or decimals not verified',MINT_UNSUPPORTED_PROGRAM:'Mint program is not yet supported for valuation',PRICE_MISSING:'No current price returned',PRICE_PROVIDER_FAILED:'Price provider request failed',PRICE_INVALID:'Invalid price metadata',PRICE_DECIMALS_MISMATCH:'Price decimals do not match the mint',PRICE_TIME_UNKNOWN:'Price observation time unavailable',PRICE_STALE:'Price outside the freshness window',INVENTORY_TIME_UNKNOWN:'Inventory observation time unavailable',INVENTORY_STALE:'Inventory is too old',INVENTORY_FUTURE:'Inventory timestamp is inconsistent',INVENTORY_INVALID:'Invalid principal quantity',FEE_UNKNOWN:'Fee quantity unavailable',FEE_INVALID:'Invalid fee quantity'
};
