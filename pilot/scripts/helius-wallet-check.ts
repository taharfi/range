import {chromium} from '@playwright/test';
import {mkdir,writeFile} from 'node:fs/promises';
import {address,DLMM_PROGRAM,POSITION_DISCRIMINATOR,decodePositionPrefix} from '../lib/meteora';
import bs58 from 'bs58';

const wallets=['BazUUKN4YLpKQ4NNYYUtuzd6CcniPn1jkFjB4FuVMyo7','8k2KVhVrBWAVov4zbBXciyA3KbVz8Az9uTc7uX8WJP5R','6Gsjssm7u4i4TTbD51nxxmcpuKBN17T1QcpSSbNDwaGc','ACUvKyTc7dEwR8oMqUZd5xpj19osaFZoXPauuy52adQM'];
const rpc=process.env.SOLANA_RPC_URL,code=process.env.PILOT_DEVELOPMENT_CODE;
if(!rpc||!code||new URL(rpc).hostname!=='mainnet.helius-rpc.com')throw Error('Configure Helius mainnet and local pilot access first.');
const directory='evidence/helius-wallet-check-'+new Date().toISOString().replace(/[:.]/g,'-');
await mkdir(directory,{recursive:true});
const report:any={capturedAt:new Date().toISOString(),classification:'Read-only public-wallet diagnostic; no user feedback or transaction execution',wallets:[],browserErrors:[]};
async function read(url:string,init?:RequestInit){
 try{const r=await fetch(url,{...init,signal:AbortSignal.timeout(20000)});if(!r.ok)return {error:'HTTP '+r.status};return await r.json();}
 catch{return {error:'Provider timeout or network failure'};}
}
const browser=await chromium.launch(),page=await browser.newPage({viewport:{width:1440,height:1000}}),root='http://127.0.0.1:3000';
page.on('pageerror',e=>report.browserErrors.push(e.message));
try{
 const auth=await page.request.post(root+'/api/session',{headers:{Origin:root},data:{code,analyticsConsent:false}});
 if(!auth.ok())throw Error('Local pilot authentication failed: '+auth.status());
 for(const [i,wallet] of wallets.entries()){
  address(wallet);const row:any={wallet,observedAt:new Date().toISOString()};report.wallets.push(row);
  const result=await read(rpc,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({jsonrpc:'2.0',id:1,method:'getAccountInfo',params:[wallet,{encoding:'base64',commitment:'confirmed'}]})});
  const account=result.result?.value;
  row.addressAccount={slot:result.result?.context?.slot,exists:account!==null&&account!==undefined,ownerProgram:account?.owner,executable:account?.executable,error:result.error?typeof result.error==='string'?result.error:'RPC '+result.error.code:undefined};
  const scan=await read(rpc,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({jsonrpc:'2.0',id:2,method:'getProgramAccounts',params:[DLMM_PROGRAM,{encoding:'base64',commitment:'confirmed',withContext:true,dataSlice:{offset:0,length:72},filters:[{memcmp:{offset:0,bytes:bs58.encode(POSITION_DISCRIMINATOR)}},{memcmp:{offset:40,bytes:wallet}}]}]})});
  row.onchain={slot:scan.result?.context?.slot,positions:scan.result?.value?.map((a:any)=>({address:a.pubkey,...decodePositionPrefix(a.account.owner,Buffer.from(a.account.data[0],'base64'))})),error:scan.error?typeof scan.error==='string'?scan.error:'RPC '+scan.error.code:undefined};
  row.indexPages=[];for(let p=1;p<=10;p++){
   const index=await read('https://dlmm.datapi.meteora.ag/portfolio/open?'+new URLSearchParams({user:wallet,page:String(p),page_size:'50'}));
   row.indexPages.push({page:p,indexed:index.totalPositions,pools:index.pools?.map((v:any)=>v.poolAddress),hasNext:index.hasNext,error:index.error});
   if(index.hasNext!==true)break;await new Promise(r=>setTimeout(r,1100));
  }
  let latest:any=null;const listener=async(response:any)=>{const path=new URL(response.url()).pathname;if(!['/api/positions','/api/portfolio/aggregate'].includes(path))return;try{const body=await response.json();if(body.aggregate)latest=body;else if(body.error){const event={status:response.status(),error:body.error,code:body.code};if(['UNSUPPORTED_POSITION_ACCOUNT','POSITION_ACCOUNT_NOT_FOUND'].includes(body.code))row.directAddressProbe=event;else row.apiError=event;}}catch{}};
  page.on('response',listener);
  await page.goto(root+'/app');await page.getByLabel('Public Solana address').fill(wallet);await page.getByRole('button',{name:'Analyze',exact:true}).click();
  const until=Date.now()+240000;while(Date.now()<until&&!row.apiError&&latest?.aggregate?.status!=='ready'&&latest?.aggregate?.status!=='failed')await page.waitForTimeout(1500);
  row.application=latest?{status:latest.aggregate.status,summary:latest.aggregate,rows:latest.positions.map((p:any)=>({address:p.address,pool:p.pool,pair:p.pair,owner:p.owner,rangeStatus:p.rangeStatus,mintsVerified:p.x.verified&&p.y.verified,inventory:p.inventory,fees:p.fees})),hasNext:!!latest.rowCursor}:null;
  row.visibleText=(await page.locator('main').innerText().catch(()=>page.locator('body').innerText())).slice(0,16000);
  const summary=row.application?.summary,chainKeys=row.onchain.positions?.map((p:any)=>p.address).sort(),rowKeys=row.application?.rows.map((p:any)=>p.address).sort();
  row.checks={providersAgree:!!summary&&Array.isArray(chainKeys)&&summary.indexed===chainKeys.length&&summary.discovered===chainKeys.length,allCurrentAccountsLoaded:!!chainKeys&&JSON.stringify(chainKeys)===JSON.stringify(rowKeys),ready:row.application?.status==='ready',complete:summary?.complete===true,noDisplayedPositionProbeError:!row.visibleText.includes('This address is not a supported open Meteora DLMM PositionV2 account')};
  row.passed=Object.values(row.checks).every(Boolean)&&!row.apiError;
  await page.screenshot({path:directory+'/wallet-'+(i+1)+'.png',fullPage:true});page.off('response',listener);
  await writeFile(directory+'/results.json',JSON.stringify(report,null,2));
  console.log(JSON.stringify({wallet,onchain:row.onchain.positions?.length,indexed:row.indexPages[0]?.indexed,application:row.application?.summary?.discovered,complete:row.application?.summary?.complete,status:row.application?.status,error:row.apiError??row.onchain.error,issues:row.application?.summary?.issues}));
 }
}finally{report.passed=report.wallets.length===wallets.length&&report.wallets.every((w:any)=>w.passed)&&report.browserErrors.length===0;await writeFile(directory+'/results.json',JSON.stringify(report,null,2));await browser.close();console.log('Evidence: '+directory);if(!report.passed)process.exitCode=1;}
