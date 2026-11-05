export function DataCoverage(){return <details className="disclosure coverage">
  <summary>Coverage & data sources</summary>
  <div className="disclosure-body">
    <p>Supports indexed, open Meteora DLMM PositionV2 accounts. Conversion estimates require verified classic SPL tokens. Closed positions, DAMM pools, vault positions and Token-2022 conversions are outside this pilot's coverage.</p>
    <p>Meteora's API supplies position inventory, range and fees. Public lookup addresses are sent to Meteora; account and mint addresses are checked through the configured Solana RPC. Indexed values may lag and do not verify immediate withdrawal availability.</p>
    <p>Jupiter receives swap token mints and amounts, without a taker wallet, and supplies current conversion quotes. A quote is an estimate, not a trade or guaranteed proceeds. Quote age measures when RANGE received it.</p>
    <p>Conversions use principal only, excluding unclaimed fees and rewards. Meteora withdrawal, claim and redeposit costs and some network/account costs are unavailable. Incomplete estimates are never a total execution cost.</p>
    <p>Missing or stale information stays unavailable or blocks quotes. Unsupported data never falls back to demo values. USD position value and verified historical profitability are not provided.</p>
  </div>
</details>;}
