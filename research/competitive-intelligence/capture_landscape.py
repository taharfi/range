"""Public, read-only source capture for the landscape. No application imports."""
from pathlib import Path
import concurrent.futures, csv, datetime, hashlib, json, urllib.request

OUT=Path(__file__).parent
EVIDENCE=OUT/'evidence'/'landscape'
AS_OF='2026-10-21'
# ID|name|relationship|audience|chains/protocols|documented workflow|primary public source|pricing evidence
ROWS='''C01|Meteora Dynamic Terminal|native competitor|DLMM LP operators|Solana; Meteora DLMM|Pool analysis; range creation; fee claims; rebalance; zap out|https://raw.githubusercontent.com/MeteoraAg/docs/main/user-guides/how-to-use-dlmm/dynamic-terminal.mdx|Separate terminal subscription not verified; protocol and account costs apply
C02|Pool Party|direct analytics competitor|Meteora LPs and communities|Solana; Meteora|Profiles; leaderboard; open and closed position performance|https://lppool.party/guide/profile|Historical free-beta claim; current access and commercial API terms unverified
C03|HawkFi|direct management competitor|Active LP strategy operators|Meteora DLMM; other workflows require individual verification|Automated strategies; rebalance; Laboratory historical simulations|https://hawkfi.gitbook.io/whitepaper|Current complete fee schedule not verified
C04|Tidepool|direct management competitor|Self-directed multichain LPs|Meteora DLMM/DAMM v2; EVM concentrated liquidity|Watch address; range selection; zaps; claims; rebalance; social calls|https://tidepool.ag/docs|3% of claimed fees; 1% Robinhood; copied calls add creator share; no subscription per docs
C05|LP Agent|direct management competitor|LP discovery and copy operators|Solana Meteora DLMM/DAMM v2; Robinhood Uniswap|Discovery; smart wallets; copy LP; TP/SL; agent wallet; portfolio|https://docs.lpagent.io/introduction|Fee page: automation 8% of collected LP fees; manual add/remove 0.1%; no subscription
C06|Kamino Liquidity|managed-vault alternative|Solana passive liquidity depositors|Solana concentrated liquidity vaults|Managed liquidity vaults; kToken receipts; lending collateral|https://kamino.com/docs/products/liquidity|Vault-specific current fees not verified
C07|Step Finance|historical portfolio precedent; wind-down announced|Solana wallet users|Solana; former dashboard/API/mobile|Operator announced dashboard/API/mobile wind-down on 2025-11-04|https://stepfinance.medium.com/step-group-changes-342ce7d210b0|Current LP product unavailable as an assumed integration; no current pricing established
C08|DeFiTuna|leveraged LP alternative|Leveraged LPs; lenders; traders|Solana; venue-specific Fusion/Orca workflows|Liquidity provision; leverage; lending; spot trading|https://docs.defituna.com/|Venue and leverage dependent; complete schedule not captured
C09|Orca|native protocol competitor|Solana concentrated liquidity LPs|Solana Whirlpools|Pool discovery; position simulation; portfolio; claims|https://www.orca.so/|Separate UI fee not established in this capture; pool/network fees remain
C10|Raydium|native protocol competitor|Solana AMM/CLMM LPs and builders|Solana AMM; CPMM; CLMM|Pool discovery; position construction; liquidity SDK|https://github.com/raydium-io/raydium-sdk-V2|Protocol-specific pool/account costs; separate analytics subscription not verified
C11|Revert|adjacent accounting/automation competitor|EVM concentrated liquidity LPs|Uniswap v2/v3/v4; Aerodrome; multiple EVM networks|Cash-flow performance; hold comparisons; range changes; automation|https://docs.revert.finance/revert|Action-specific schedules; no universal price inferred
C12|Krystal|adjacent management competitor|Multichain concentrated liquidity LPs|EVM DEXs; Raydium listed partner does not prove DLMM support|Farming analytics; vaults; zaps; automation|https://krystal.app/|Current universal fee schedule unknown
C13|GeekLad Profit Analysis|community accounting alternative|Meteora DLMM wallet researchers|Solana Meteora DLMM|Wallet or transaction profit-analysis tool|https://geeklad.github.io/meteora-profit-analysis/|Public interface; no subscription advertised; RPC costs possible
C14|GeekLad DLMM Simulator|community scenario alternative|Meteora LP range researchers|Solana Meteora DLMM|Inventory scenario simulation|https://dlmmsim.xyz/|Public interface; successful computation not tested
C15|Gamma|adjacent managed liquidity|Concentrated-liquidity depositors and teams|Uniswap v3/v4; Algebra; other documented AMMs|Automated LP vault rebalancing; limit-order hooks|https://docs.gamma.xyz/gamma|Vault/product-specific fees unknown
C16|Arrakis Pro|adjacent institutional management|Token issuers and treasuries|Concentrated liquidity DEXs; EVM framework|Self-custodial vault; off-chain market making; dynamic inventory management|https://docs.arrakis.finance/|Contact-led commercial terms; public universal price not verified
C17|Jupiter Developer Platform|execution infrastructure|Solana app builders|Solana routed swaps|Swap quotes; transaction building; routing|https://developers.jup.ag/|Endpoint and rate-plan dependent; no uniform free unlimited access inferred
C18|Helius|data/execution infrastructure|Solana app and indexing teams|Solana RPC and indexed APIs|Historical transactions; parsed events; streaming; priority fees|https://www.helius.dev/docs|Free and paid plans documented; historical endpoint entitlements need checks
C19|Birdeye Data|market-data provider|Wallet and analytics builders|Solana plus supported chains|Historical prices; OHLCV; liquidity candles; wallet/trader analytics|https://data.birdeye.so/docs/getting-started|API key; endpoint/package dependent; current exact price not captured
C20|GeckoTerminal|DEX-data provider; CoinGecko group|Pool researchers and app builders|Multichain DEX pools|Pool charts; on-chain market data; OHLCV|https://apiguide.geckoterminal.com/|Redirects to CoinGecko docs; historical endpoint entitlements must be checked
C21|CoinGecko API|market-data provider; same group as C20|Market-data app builders|Aggregated and on-chain multichain market data|Coin history; DEX market data; API SDKs|https://docs.coingecko.com/|Free Demo and paid Pro documented; differing endpoint and rate availability
C22|Pyth|oracle infrastructure|Historical and executable-price researchers|Supported cross-chain feeds|Oracle observations; institutional low-latency feeds|https://docs.pyth.network/|Hermes API key now required; Pro subscription; historical entitlement unknown
C23|Dune|analytical warehouse|Analysts and indexer builders|Solana and other indexed chains|SQL analysis; dashboards; result API; data sharing|https://docs.dune.com/|Plan/compute dependent; public dashboard does not mean unrestricted API
C24|Flipside|historical warehouse alternative; status unresolved|Historical Solana analysts|Current blockchain coverage unknown|Previous blockchain SQL platform; current docs redirect to unrelated-purpose enterprise AI site|https://docs.flipsidecrypto.xyz/|Current Solana service and pricing unverified
C25|Solscan|verification/explorer provider|Solana users and developers|Solana|Transaction/account inspection; explorer analytics|https://docs.solscan.io/|Public explorer versus API entitlements differ; current API price unknown
C26|Triton One|RPC/indexing infrastructure|Solana application and trading teams|Solana plus supported chains|RPC; archival access; streaming; transaction delivery|https://docs.triton.one/|Account and service dependent; current commercial quote unknown
C27|Shyft|RPC/indexer infrastructure|Solana application teams|Solana|RPC; gRPC; parsed transactions; GraphQL SuperIndexer|https://docs.shyft.to/|Plan dependent; current full historical entitlement unknown
C28|Quicknode|RPC/indexing infrastructure|Application and data teams|Solana plus supported chains|Archive RPC; streams; webhooks; priority fees|https://www.quicknode.com/docs/solana|Plan and add-on dependent; archive advertised; exact workload quote unknown
C29|Alchemy|RPC infrastructure|Application and data teams|Solana plus supported chains|Solana RPC; account archive; historical transactions|https://www.alchemy.com/docs/reference/solana-api-quickstart|API key and compute-unit plans; archival method entitlement needs verification
C30|SQD|indexing infrastructure candidate|Blockchain indexing teams|Coverage not freshly verified|Historical blockchain datasets and indexer tooling; current Solana scope unverified|https://docs.sqd.dev/|Unknown; documentation access timed out
C31|Vybe|Solana market/wallet-data provider|Analytics developers and trading teams|Solana|Historical trades; wallet balances; WebSocket; swap building|https://docs.vybenetwork.com/|Free API key advertised; endpoint/history limits require checks
C32|DefiLlama|protocol-analytics provider|Researchers and protocol teams|Multichain protocols|TVL; fees; revenue; DEX volumes; yield adapters|https://docs.llama.fi/|Public datasets/adapters; API commercial terms differ by product
C33|DEX Screener|market analytics/indexer|Traders; pool researchers; developers|Supported multichain DEXs|Custom blockchain indexing; pool charts; public API|https://docs.dexscreener.com/|Free API documented; endpoint-specific limits; not a position-accounting API
C34|Jito Labs|execution infrastructure|Solana apps and searchers|Solana|Bundles; low-latency delivery; revert protection|https://docs.jito.wtf/|Tips and network costs; availability is not a free execution guarantee
C35|Turnkey|wallet/key infrastructure|Automated execution application builders|Supported chains including Solana integrations|Enclave-backed signing; programmable policies; embedded wallets|https://docs.turnkey.com/welcome|Commercial wallet/signing infrastructure; exact current plan not captured'''

def fetch(row):
    ident,name,relation,audience,chains,features,url,pricing=row
    meta={'id':ident,'url':url,'checked_as_of':AS_OF,'captured_at_utc':datetime.datetime.now(datetime.timezone.utc).isoformat(),'access':'public unauthenticated GET; TLS verified'}
    try:
        req=urllib.request.Request(url,headers={'User-Agent':'RANGE-public-research/1.0'})
        with urllib.request.urlopen(req,timeout=25) as r:
            data=r.read(4_000_000); meta.update(status=r.status,final_url=r.url,bytes=len(data),sha256=hashlib.sha256(data).hexdigest())
            (EVIDENCE/f'{ident}.html').write_bytes(data)
    except Exception as exc:
        meta.update(status='unavailable',error=str(exc)[:500])
    return dict(id=ident,name=name,relationship=relation,target_user=audience,chains_protocols=chains,documented_features=features,primary_source=url,pricing_evidence=pricing,checked_as_of=AS_OF,status='Public source reachable; runtime and transactions untested' if meta.get('status')==200 else 'Access failed; operational status unknown',social_accounts='Unknown unless linked by inspected official source',wallet_custody_model='Not independently security-audited; see deep dive',data_sources='See technical analysis; unverified vendors not inferred',roadmap='Only explicitly sourced announcements; no inferred commitments',adoption='See TRACTION_ANALYSIS.md; unknown is not zero'),meta

def main():
    EVIDENCE.mkdir(parents=True,exist_ok=True)
    rows=[line.split('|') for line in ROWS.splitlines() if line]
    with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
        results=list(pool.map(fetch,rows))
    # The browser reader independently reached these pages on AS_OF even where
    # this raw HTTP client was blocked. This is an explicit dated review, not a
    # claim that future reruns will establish the same service availability.
    browser_reached={'C16','C20','C21','C23','C24','C28','C31','C34'}
    metrics=json.loads((EVIDENCE/'defillama-protocols.json').read_text(encoding='utf-8')) if (EVIDENCE/'defillama-protocols.json').exists() else {}
    by_slug={r['slug']:r for r in metrics.get('records',[])}
    metric_ids={'C01':'meteora-dlmm','C03':'hawkfi','C05':'lp-agent','C06':'kamino-liquidity','C08':'defituna-liquidity','C09':'orca-dex','C10':'raydium-amm','C11':'revert-compoundor','C12':'krystal-auto-farm-vault','C15':'gamma','C16':'arrakis-modular'}
    for row,meta in results:
        row['raw_http_status']=str(meta.get('status'))
        row['status']='Public documentation/interface reachable; funded operations not tested' if meta.get('status')==200 or row['id'] in browser_reached else 'Fresh access limited; current operations not verified'
        if row['id']=='C07':row['status']='Operator announced dashboard/API/mobile wind-down 2025-11-04; not counted as active'
        if row['id']=='C24':row['status']='Former blockchain docs redirect to Edisyl enterprise AI; current Solana service unverified'
        row['tvl_entity']=metric_ids.get(row['id'],'Unknown')
        metric=by_slug.get(row['tvl_entity'],{})
        row['provider_tvl_usd']=metric.get('tvl') if metric.get('tvl') is not None else 'Unknown'
        row['tvl_scope']='Provider entity capital; not users, revenue or verified net performance' if metric else 'No like-for-like public TVL captured'
        row['metric_source']='https://api.llama.fi/protocols' if metric else 'Unknown'
        for key in ['active_wallets','transaction_activity','fees_revenue','retention','paying_users','historical_growth','github_development_activity']:
            row[key]='Unknown; not independently measured in this landscape'
    with (OUT/'COMPETITORS.csv').open('w',encoding='utf-8',newline='') as f:
        writer=csv.DictWriter(f,fieldnames=list(results[0][0]));writer.writeheader();writer.writerows(x[0] for x in results)
    (EVIDENCE/'manifest.json').write_text(json.dumps([x[1] for x in results],indent=2),encoding='utf-8')
    print(json.dumps({'projects':len(rows),'reachable':sum(x[1].get('status')==200 for x in results),'failed':[x[0]['id'] for x in results if x[1].get('status')!=200]}))

if __name__=='__main__':main()
