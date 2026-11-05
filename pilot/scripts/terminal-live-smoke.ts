import {waitForWalletAggregation} from './aggregation-ready';
import {chromium} from '@playwright/test';
import {mkdir,writeFile} from 'node:fs/promises';
// Owner-supplied public research wallet. Local credentials are read internally, never printed.
const wallet='ACUvKyTc7dEwR8oMqUZd5xpj19osaFZoXPauuy52adQM';
const report={at:new Date().toISOString(),wallet,pageErrors:[] as string[],responses:[] as unknown[],screens:[] as unknown[],open:0,closed:0,events:0,status:'started',error:''};
await mkdir('evidence/terminal',{recursive:true});const browser=await chromium.launch();const page=await browser.newPage({viewport:{width:1440,height:1000}});
page.on('pageerror',e=>report.pageErrors.push(e.message));
page.on('response',async r=>{if(['/api/positions','/api/portfolio','/api/brief'].includes(new URL(r.url()).pathname)){const v=await r.json();report.responses.push({path:new URL(r.url()).pathname,kind:r.request().postDataJSON()?.kind,status:r.status(),positions:v.positions?.length,events:v.events?.length,warnings:v.warnings,error:v.error,exit:v.exit?.status,rebalance:v.rebalance?.status});}});
async function capture(name:string,widths=[1440,390]){for(const width of widths){await page.setViewportSize({width,height:900});await page.mouse.move(0,0);const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth);report.screens.push({name,width,overflow});await page.screenshot({path:`evidence/terminal/${name}-${width}.png`,fullPage:true});if(overflow)throw Error(`Horizontal overflow: ${name} at ${width}`);}}
try{
 await page.goto('http://127.0.0.1:3000/app');await page.getByLabel('Public Solana address').fill(wallet);await page.getByRole('button',{name:'Analyze',exact:true}).click();await page.getByLabel('Pilot access code').waitFor();const code=process.env.PILOT_DEVELOPMENT_CODE;if(!code)throw Error('Local development code not configured.');await page.getByLabel('Pilot access code').fill(code);await page.getByRole('button',{name:'Start private pilot'}).click();await page.getByRole('region',{name:'Portfolio',exact:true}).waitFor({timeout:85000});await waitForWalletAggregation(page);
 if(await page.getByRole('button',{name:'More pools',exact:true}).isVisible()){await page.getByRole('button',{name:'More pools',exact:true}).click();await page.waitForFunction(()=>!document.querySelector('.progress'),{},{timeout:85000});}
 report.open=await page.locator('.portfolio-row').count();await capture('open',[1440,834,390,320]);
 if(report.open){await page.locator('.position-entry-meta details > summary').first().click();await capture('inspector');await page.locator('.position-entry-meta details > summary').first().click();}
 await page.locator('.attention-queue > summary').click();await capture('attention');await page.locator('.attention-queue > summary').click();
 await page.getByRole('button',{name:'Cards',exact:true}).click();await capture('cards',[1440,390,320]);await page.getByRole('button',{name:'List',exact:true}).click();
 await page.getByRole('tab',{name:'Closed',exact:true}).click();await page.locator('.closed-position').first().waitFor({timeout:85000});report.closed=await page.locator('.closed-position').count();await page.locator('.closed-position>summary').first().click();await capture('closed',[1440,390,320]);
 await page.getByRole('button',{name:'View position activity'}).first().click();await page.getByRole('button',{name:'Load activity',exact:true}).click();await page.locator('.activity-event').first().waitFor({timeout:85000});report.events=await page.locator('.activity-event').count();await capture('history',[1440,390,320]);
 await page.getByRole('tab',{name:'Performance',exact:true}).click();await capture('performance');await page.getByRole('tab',{name:/^Open \(/}).click();
 if(report.open){await page.locator('.portfolio-row').first().click();await capture('position');await page.getByRole('button',{name:'Compare options',exact:true}).click();await page.getByRole('tablist',{name:'Position actions'}).waitFor({timeout:85000});await capture('decision');}
 report.status=report.pageErrors.length?'browser errors':'passed';
}catch(e){report.status='blocked';report.error=(e as Error).message;}
finally{await writeFile('evidence/terminal/live-smoke.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));await browser.close();}
if(report.status!=='passed')process.exitCode=1;
