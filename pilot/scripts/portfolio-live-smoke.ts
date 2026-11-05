import {waitForWalletAggregation} from './aggregation-ready';
import {chromium} from '@playwright/test';
import {mkdir,writeFile} from 'node:fs/promises';

// Public research addresses supplied by the owner; no tester feedback or analytics consent.
const wallets=['BazUUKN4YLpKQ4NNYYUtuzd6CcniPn1jkFjB4FuVMyo7','8k2KVhVrBWAVov4zbBXciyA3KbVz8Az9uTc7uX8WJP5R','6Gsjssm7u4i4TTbD51nxxmcpuKBN17T1QcpSSbNDwaGc','ACUvKyTc7dEwR8oMqUZd5xpj19osaFZoXPauuy52adQM'];
const report:{checkedAt:string;cases:unknown[];pageErrors:string[];status:string;error?:string}={checkedAt:new Date().toISOString(),cases:[],pageErrors:[],status:'started'};
await mkdir('evidence/portfolio',{recursive:true});
const browser=await chromium.launch();const page=await browser.newPage({viewport:{width:1440,height:1000}});
page.on('pageerror',e=>report.pageErrors.push(e.message));
let calls:unknown[]=[];
page.on('response',async r=>{if(new URL(r.url()).pathname==='/api/positions'){const v=await r.json();calls.push({kind:r.request().postDataJSON().kind,page:r.request().postDataJSON().page||1,status:r.status(),positions:v.positions?.length,indexedPositionCount:v.indexedPositionCount,hasNextPools:v.hasNextPools,warnings:v.warnings,error:v.error});}});
try{
 for(const [i,address] of wallets.entries()){
  calls=[];await page.goto('http://127.0.0.1:3000/app');await page.getByLabel('Public Solana address').fill(address);await page.getByRole('button',{name:'Analyze',exact:true}).click();
  if(i===0){await page.getByLabel('Pilot access code').waitFor();const code=process.env.PILOT_DEVELOPMENT_CODE||process.env.PILOT_TESTER_CODES?.split(',')[0]?.trim();if(!code)throw new Error('Local access code not configured.');await page.getByLabel('Pilot access code').fill(code);await page.getByRole('button',{name:'Start private pilot'}).click();}
  await page.getByRole('region',{name:'Portfolio',exact:true}).waitFor({timeout:85000});await waitForWalletAggregation(page);
  const firstPage=await page.locator('.portfolio-row').count();
  // One bounded extra page for the previously observed multi-position control.
  if(i===3&&await page.getByRole('button',{name:'More pools',exact:true}).isVisible()){
   await page.getByRole('button',{name:'More pools',exact:true}).click();await page.waitForFunction(()=>!document.querySelector('.progress'),{},{timeout:85000});
  }
  const loaded=await page.locator('.portfolio-row').count();report.cases.push({address,firstPage,loaded,calls:[...calls],remainingPools:await page.getByRole('button',{name:'More pools',exact:true}).isVisible()});
  if(i===3){
   for(const width of [1440,834,390,320]){await page.setViewportSize({width,height:900});if(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth))throw new Error('Portfolio horizontal overflow.');await page.screenshot({path:`evidence/portfolio/live-portfolio-${width}.png`,fullPage:true});}
   if(loaded){await page.locator('.portfolio-row').first().click();await page.screenshot({path:'evidence/portfolio/live-position-320.png',fullPage:true});await page.getByRole('button',{name:'Back to portfolio',exact:false}).click();if(await page.locator('.portfolio-row').count()!==loaded)throw new Error('Portfolio lost rows during navigation.');}
  }
 }
 report.status=report.pageErrors.length?'browser errors':'live portfolios checked';
}catch(e){report.status='blocked';report.error=(e as Error).message;}
finally{await writeFile('evidence/portfolio/live-smoke.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));await browser.close();}
if(report.status!=='live portfolios checked')process.exitCode=1;
