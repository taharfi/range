import {chromium,expect} from '@playwright/test';
import {mkdir,writeFile} from 'node:fs/promises';
const root='http://127.0.0.1:3000',wallet='ACUvKyTc7dEwR8oMqUZd5xpj19osaFZoXPauuy52adQM',directory='var/reconciliation-pilot/browser';
const report:any={at:new Date().toISOString(),wallet,status:'started',errors:[],screens:[],consent:false,feedbackSubmitted:false};
await mkdir(directory,{recursive:true});const browser=await chromium.launch(),page=await browser.newPage({viewport:{width:1440,height:1000}});page.on('pageerror',e=>report.errors.push(e.message));
try{
 if(!process.env.PILOT_DEVELOPMENT_CODE)throw Error('Local invitation not configured');
 const auth=await page.request.post(root+'/api/session',{headers:{Origin:root},data:{code:process.env.PILOT_DEVELOPMENT_CODE,analyticsConsent:false}});if(!auth.ok())throw Error('Local invitation rejected');
 let ready=false;page.on('response',async r=>{if(!r.url().includes('/api/portfolio/aggregate'))return;try{const v=await r.json();if(v.aggregate?.status==='ready'||v.aggregate?.status==='failed')ready=true;}catch{}});
 await page.goto(root+'/app');await page.getByLabel('Public Solana address').fill(wallet);await page.getByRole('button',{name:'Analyze',exact:true}).click();await expect.poll(()=>ready,{timeout:180000,intervals:[1000,2000]}).toBe(true);await page.getByRole('tab',{name:'Closed',exact:true}).click();
 const section=page.getByRole('region',{name:'Saved on-chain evidence'});await section.getByText('Saved on-chain evidence',{exact:true}).click();
 const [response]=await Promise.all([page.waitForResponse(r=>r.url().endsWith('/api/portfolio')&&r.request().postDataJSON().kind==='reconciliation'),section.getByRole('button',{name:'Load saved evidence'}).click()]);const value=await response.json();if(!response.ok()||value.positions?.[0]?.quality!=='token-flow-reconciled')throw Error('Actual cached evidence unavailable');report.evidence={positions:value.positions.length,quality:value.positions[0].quality,transactionCount:value.positions[0].transactionCount,pnl:value.positions[0].historicalUsdPnl};
 await section.locator('details details').first().locator('summary').first().click();await expect(section).toContainText('Historical USD P&L and hold returns unavailable');
 await expect(page.getByRole('status').filter({hasText:'Reading indexed closed positions'})).toBeHidden({timeout:90000});
 for(const width of [1440,390]){await page.setViewportSize({width,height:1000});const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth);await page.screenshot({path:`${directory}/closed-${width}.png`,fullPage:true});report.screens.push({width,overflow});if(overflow)throw Error('Horizontal overflow');}
 report.status=report.errors.length?'failed':'passed';
}catch(e){report.status='failed';report.error=e instanceof Error?e.message:'Preflight failed';}finally{await writeFile(directory+'/result.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));await browser.close();}
if(report.status!=='passed')process.exitCode=1;
