import {chromium,expect} from '@playwright/test';
import {mkdir,writeFile} from 'node:fs/promises';
const root='http://127.0.0.1:3000',wallet='ACUvKyTc7dEwR8oMqUZd5xpj19osaFZoXPauuy52adQM',directory=process.argv.includes('--pilot-sequence')?'evidence/pilot-sequence':process.argv.includes('--token2022')?'evidence/token2022':'evidence/portfolio-correctness';
const report={at:new Date().toISOString(),status:'started',error:'',summary:null as any,requests:[] as any[],screens:[] as any[],pageErrors:[] as string[],paginationStable:false,refreshChecked:false,quoteGate:null as any,warmReadRehearsal:null as any};
await mkdir(directory,{recursive:true});const browser=await chromium.launch(),page=await browser.newPage({viewport:{width:1440,height:900}});let ready:any=null,started=0;
page.on('pageerror',e=>report.pageErrors.push(e.message));
page.on('response',async r=>{const path=new URL(r.url()).pathname;if(!['/api/positions','/api/portfolio/aggregate'].includes(path))return;try{const raw=await r.text(),v=JSON.parse(raw);report.requests.push({path,status:r.status(),bytes:Buffer.byteLength(raw),rows:v.positions?.length,aggregationStatus:v.aggregate?.status});if(path==='/api/positions')started++;if(v.aggregate?.status==='ready')ready=v;}catch{/* Navigation may cancel a pending read. */}});
async function capture(name:string){for(const width of [1440,834,390,320]){await page.setViewportSize({width,height:900});const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth);report.screens.push({name,width,overflow});await page.screenshot({path:`${directory}/${name}-${width}.png`,fullPage:true});if(overflow)throw Error('Horizontal overflow');}}
try{
 await page.goto(root+'/app');await page.getByLabel('Public Solana address').fill(wallet);await page.getByRole('button',{name:'Analyze',exact:true}).click();await page.getByLabel('Pilot access code').waitFor();if(!process.env.PILOT_DEVELOPMENT_CODE)throw Error('Local development access is not configured');await page.getByLabel('Pilot access code').fill(process.env.PILOT_DEVELOPMENT_CODE);await page.getByRole('button',{name:'Start private pilot'}).click();
 await expect.poll(()=>ready?.aggregate?.status,{timeout:180000,intervals:[1000,2000,5000]}).toBe('ready');report.summary=ready.aggregate;await expect(page.locator('.portfolio-row')).toHaveCount(Math.min(5,ready.aggregate.discovered));
 const first=JSON.stringify(ready.aggregate);
 if(process.argv.includes('--pilot-sequence')){
  const reads=await Promise.all(Array.from({length:10},async()=>{const at=performance.now(),r=await page.request.get(root+'/api/portfolio/aggregate?id='+ready.aggregationId);return {ms:performance.now()-at,status:r.status(),bytes:(await r.body()).length};})),times=reads.map(r=>r.ms).sort((a,b)=>a-b);
  report.warmReadRehearsal={classification:'10 concurrent warm status reads under one development session, not ten testers or an upstream load test',requests:10,p95Ms:times[9],maxBytes:Math.max(...reads.map(r=>r.bytes)),statuses:reads.map(r=>r.status),withinLocalBudget:reads.every(r=>r.status===200)&&times[9]<2000};
  if(!report.warmReadRehearsal.withinLocalBudget)throw Error('Warm read rehearsal exceeded local 2-second/status budget');
 }
 if(await page.getByRole('button',{name:'Next positions',exact:true}).isVisible()){await page.getByRole('button',{name:'Next positions',exact:true}).click();await expect.poll(()=>ready.poolPage).toBe(2);if(JSON.stringify(ready.aggregate)!==first)throw Error('Summary changed on pagination');report.paginationStable=true;await page.getByRole('button',{name:'Previous positions',exact:true}).click();await expect.poll(()=>ready.poolPage).toBe(1);}
 await capture('portfolio');if(await page.getByText('Valuation coverage for this page',{exact:true}).isVisible())await page.getByText('Valuation coverage for this page',{exact:true}).click();await capture('coverage');
 await page.getByRole('tab',{name:'Performance',exact:true}).click();if(await page.getByText('Why some values are unavailable',{exact:true}).isVisible())await page.getByText('Why some values are unavailable',{exact:true}).click();if(await page.getByText('Valuation and conversion support',{exact:true}).isVisible())await page.getByText('Valuation and conversion support',{exact:true}).click();await capture('analytics');
 if(process.argv.includes('--token2022')){
  const position=ready.positions.find((p:any)=>[p.x,p.y].some(t=>t.valuationVerified&&!t.verified));if(!position)throw Error('No valuation-only position on the sampled page');
  const response=await page.request.post(root+'/api/brief',{headers:{Origin:root},data:{handle:ready.handles[position.address],exitMint:'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',targetXPercent:50,slippageBps:50}}),brief=await response.json();
  report.quoteGate={position:position.address,httpStatus:response.status(),exit:brief.exit?.status,rebalance:brief.rebalance?.status,error:brief.exit?.error};
  if(response.status()!==200||brief.exit?.status!=='unavailable'||brief.rebalance?.status!=='unavailable'||!brief.exit?.error?.includes('token program'))throw Error('Valuation-only quote gate did not hold');
 }
 const previousStart=started;ready=null;await page.getByRole('button',{name:'Refresh',exact:true}).click();await expect(page.locator('.terminal-accounting')).toContainText('Unavailable');await expect.poll(()=>ready?.aggregate?.status,{timeout:180000,intervals:[1000,2000,5000]}).toBe('ready');report.refreshChecked=started>previousStart;
 if(report.requests.some(r=>r.rows>5||r.bytes>32768))throw Error('Compact response budget exceeded');if(report.pageErrors.length)throw Error('Browser errors');report.status='passed';
}catch(e){report.status='blocked';report.error=e instanceof Error?e.message:'Browser check failed';}
finally{await writeFile(`${directory}/browser.json`,JSON.stringify(report,null,2));console.log(JSON.stringify({status:report.status,error:report.error,screens:report.screens.length,requests:report.requests.length,maxBytes:Math.max(0,...report.requests.map(r=>r.bytes))}));await browser.close();}
if(report.status!=='passed')process.exitCode=1;
