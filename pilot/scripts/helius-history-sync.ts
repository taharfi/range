import {syncArchivalPage} from '../lib/archival';
const [account,from,until]=process.argv.slice(2);
if(!account||!from||!until){console.error('Usage: node --env-file-if-exists=.env.local --import tsx scripts/helius-history-sync.ts POSITION FROM_UNIX_SECONDS UNTIL_EXCLUSIVE_UNIX_SECONDS');process.exit(2);}
try{
 const result=await syncArchivalPage({address:account,from:Number(from),until:Number(until)});
 console.log(JSON.stringify({address:result.scope.address,interval:result.scope,pages:result.pages,transactions:result.transactions.length,queryExhausted:result.queryExhausted,coverage:result.coverage,failedTransactions:result.transactions.filter(t=>t.meta&&t.meta.err!==null).length,missingMetadata:result.transactions.filter(t=>!t.meta).length,signatures:result.transactions.map(t=>({signature:t.transaction.signatures[0],slot:t.slot,at:t.blockTime,observedTransactionFeeLamports:t.meta?.fee,solscan:'https://solscan.io/tx/'+t.transaction.signatures[0]})),notice:'One bounded page; rerun identical arguments to resume. Exhausting this query does not prove a complete lifecycle, closure, wallet history or P&L. Transaction fees may cover multiple positions and are not yet allocated.'},null,2));
}catch{console.error('Historical synchronization failed; no financial completeness inferred. Inspect configuration/provider coverage; credentials withheld.');process.exitCode=1;}
