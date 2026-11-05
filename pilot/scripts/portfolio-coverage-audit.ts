import {mkdir,writeFile} from 'node:fs/promises';
import {startAggregation} from '../lib/aggregation';
import {discoverWalletPoolPage} from '../lib/meteora';
const wallets=['ACUvKyTc7dEwR8oMqUZd5xpj19osaFZoXPauuy52adQM','BazUUKN4YLpKQ4NNYYUtuzd6CcniPn1jkFjB4FuVMyo7','8k2KVhVrBWAVov4zbBXciyA3KbVz8Az9uTc7uX8WJP5R'];
const results=[];
for(const wallet of wallets){
 const started=Date.now(),pages=[];
 try{
  for(let page=1;page<=10;page++){const r=await discoverWalletPoolPage(wallet,page);pages.push({page,...r});if(!r.hasNext)break;}
  const job=startAggregation(wallet,true);
  while(job.summary.status==='running'&&Date.now()-started<240000)await new Promise(r=>setTimeout(r,1000));
  results.push({wallet,at:new Date().toISOString(),elapsedMs:Date.now()-started,pages,summary:job.summary,positions:job.positions.map(p=>({address:p.address,pool:p.pool,pair:p.pair,inventory:p.inventory,fees:p.fees,updatedAt:p.updatedAt,retrievedAt:p.retrievedAt,x:p.x,y:p.y,coverage:p.valuationCoverage,sourceUrls:p.sourceUrls}))});
  console.log(JSON.stringify({wallet,status:job.summary.status,count:job.summary.discovered,valued:job.summary.valuation?.valuedPositions,feeValued:job.summary.valuation?.feeValuedPositions,complete:job.summary.complete}));
 }catch(e){results.push({wallet,pages,error:e instanceof Error?e.message:'Audit failed'});console.log(JSON.stringify({wallet,status:'failed'}));}
}
const directory=process.argv.includes('--token2022')?'evidence/token2022':'evidence/portfolio-correctness';
await mkdir(directory,{recursive:true});
const name=process.argv[2]==='before'?'before':'after';
await writeFile(`${directory}/${name}.json`,JSON.stringify({at:new Date().toISOString(),results},null,2));
