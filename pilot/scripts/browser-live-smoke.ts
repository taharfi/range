import {waitForWalletAggregation} from './aggregation-ready';
import {chromium} from '@playwright/test';
import {writeFile} from 'node:fs/promises';
const browser=await chromium.launch();const page=await browser.newPage({viewport:{width:1440,height:900}});
const report:{checkedAt:string;pageErrors:string[];requests:unknown[];status:string;error?:string}={checkedAt:new Date().toISOString(),pageErrors:[],requests:[],status:'started'};
page.on('pageerror',e=>report.pageErrors.push(e.message));
page.on('response',async r=>{if(r.url().includes('/api/positions')||r.url().includes('/api/brief')){try{const v=await r.json();report.requests.push({path:new URL(r.url()).pathname,status:r.status(),error:v.error,positions:v.positions?.length,warnings:v.warnings,exit:v.exit?.status,rebalance:v.rebalance?.status});}catch{}}});
try{
 await page.goto('http://127.0.0.1:3000/app');
 await page.getByLabel('Public Solana address').fill(process.env.PILOT_SMOKE_ADDRESS||'21du6vEJaw4GMmttGFSy7eZRm5zB2dGCEVGunjiBCANU');
 await page.getByRole('button',{name:'Analyze',exact:true}).click();
 const gate=page.getByRole('heading',{name:'Welcome to the ten-person pilot'});
 const portfolio=page.getByRole('region',{name:'Portfolio',exact:true});
 await gate.or(portfolio).or(page.getByRole('button',{name:'Compare options'})).waitFor({timeout:60000});
 if(await gate.isVisible()){
  const code=process.env.PILOT_TESTER_CODES?.split(',')[0]?.trim();if(!code)throw new Error('QA invitation not configured.');
  await page.getByLabel('Pilot access code').fill(code);await page.getByRole('button',{name:'Start private pilot'}).click();
  // Optional usage consent remains unchecked. This public research sample is not a tester.
 }
 await portfolio.or(page.getByRole('button',{name:'Compare options'})).waitFor({timeout:60000});
 if(await portfolio.isVisible()){await waitForWalletAggregation(page);if(!await page.locator('.portfolio-row').count())throw new Error('No supported open positions returned for the live smoke address.');await page.locator('.portfolio-row').first().click();}
 await page.getByRole('button',{name:'Compare options'}).waitFor({timeout:60000});
 await page.screenshot({path:'evidence/progressive/live-position-desktop.png',fullPage:true});
 await page.getByRole('button',{name:'Compare options'}).click();await page.getByRole('tablist',{name:'Position actions'}).waitFor({timeout:60000});
 for(const action of ['HOLD','REBALANCE','EXIT']){await page.getByRole('tab',{name:action,exact:true}).click();await page.screenshot({path:`evidence/progressive/live-decision-${action.toLowerCase()}-desktop.png`,fullPage:true});}
 if(await page.getByRole('tabpanel').count()!==1)throw new Error('Expected exactly one rendered action panel.');
 report.status='live decision rendered';
}catch(e){report.status='failed';report.error=(e as Error).message;}
finally{await page.screenshot({path:'evidence/live-interface.png',fullPage:true});await writeFile('evidence/browser-live-smoke.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));await browser.close();}
if(report.status==='failed')process.exitCode=1;
