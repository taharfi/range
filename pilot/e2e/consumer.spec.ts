import {openFirstPosition} from './navigation';
﻿import {test,expect} from '@playwright/test';
const address='21du6vEJaw4GMmttGFSy7eZRm5zB2dGCEVGunjiBCANU';
test('search makes no API or analytics calls; only one action exists and tabs reuse the brief',async({page})=>{
 const calls:string[]=[];page.on('request',r=>{if(r.url().includes('/api/'))calls.push(new URL(r.url()).pathname);});
 await page.goto('/app');await expect(page.getByRole('button',{name:'Analyze',exact:true})).toBeVisible();await page.waitForTimeout(150);expect(calls).toEqual([]);
 await expect(page.locator('details')).toHaveCount(1);await expect(page.locator('.coverage')).not.toHaveAttribute('open');await expect(page.locator('input')).toHaveCount(1);await expect(page.getByRole('region',{name:'Pilot access'})).toHaveCount(0);
 await page.getByRole('button',{name:'Try Demo'}).click();await openFirstPosition(page);await expect(page.locator('.search-screen')).toHaveCount(0);await expect(page.getByText('Bins',{exact:true})).toHaveCount(0);
 await page.getByRole('button',{name:'Compare options'}).click();const before=calls.length;
 for(const action of ['EXIT','REBALANCE','HOLD']){await page.getByRole('tab',{name:action,exact:true}).click();await expect(page.getByRole('tabpanel')).toHaveCount(1);}
 await page.waitForTimeout(1100);await expect(page.getByRole('tabpanel')).toHaveCount(1);
 expect(calls.length).toBe(before);await expect(page.getByText('Full execution cost unavailable',{exact:true})).toHaveCount(0);
 await page.getByRole('tab',{name:'REBALANCE',exact:true}).click();await expect(page.getByText('Full execution cost unavailable',{exact:true})).toBeVisible();
 await expect(page.getByText('Principal only; unclaimed fees and rewards are excluded.',{exact:false})).toBeVisible();
 await page.getByRole('button',{name:'Back to position',exact:false}).click();await expect(page.locator('.decision-screen')).toHaveCount(0);await expect(page.getByRole('button',{name:'Compare options'})).toBeVisible();
});
test('automatic address lookup, multiple positions, missing USD/fees and default/custom payloads stay accurate',async({page,request})=>{
 const b=await(await request.get('/api/demo')).json();b.mode='live';b.feedbackToken=null;b.position.warnings=[];b.position.confidence='indexed';b.position.fees={x:null,y:null};b.position.address='BrVyh2knHr83iQB4yPCHd6q5KRbJDPjqXpeAgfjeQtZp';b.position.inventory.x='123.456789123';
 const other={...b.position,address:'Bp9jYmh9ZGw1TmrWjVG3yESv5J1gVkCu4kFmYizRtjMY',pair:'Second test position',rangeStatus:'out-of-range'};const kinds:string[]=[];let settings:any;
 await page.route('**/api/positions',r=>{const input=r.request().postDataJSON();kinds.push(input.kind);return r.fulfill({json:{mode:'live',snapshotId:'test',positions:input.kind==='wallet'?[]:[b.position,other],warnings:[],hasNextPools:false,poolPage:1,morePositions:[],handles:{[b.position.address]:'first',[other.address]:'second'}}});});
 await page.route('**/api/brief',r=>{settings=r.request().postDataJSON();return r.fulfill({json:{...b,targetXPercent:settings.targetXPercent,slippageBps:settings.slippageBps,exitMint:settings.exitMint}});});
 await page.goto('/app');await page.getByLabel('Public Solana address').fill(address);await page.getByRole('button',{name:'Analyze',exact:true}).click();await expect(page.getByLabel('Select position')).toBeVisible();expect(kinds).toEqual(['wallet','position']);
 await expect(page.locator('.value-unavailable')).toHaveText('Unavailable');await expect(page.locator('.fee-amount')).toContainText('Unavailable');await expect(page.getByText('123.456789123',{exact:true})).toHaveCount(0);
 await page.getByRole('button',{name:'Compare options'}).click();await expect.poll(()=>settings?.targetXPercent).toBe(50);expect(settings.slippageBps).toBe(50);expect(settings.exitMint).toBe('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v');
 await page.getByText('Technical details & assumptions',{exact:true}).click();await expect(page.locator('.mono').filter({hasText:'123.456789123'})).toBeVisible();
 await page.getByText('Comparison settings',{exact:true}).click();await page.getByLabel('Target SOL share (%)').fill('70');await page.getByLabel('Slippage cap (bps)').fill('75');await expect(page.getByText('Settings changed.',{exact:false})).toBeVisible();
 await page.getByRole('button',{name:'Update quotes',exact:true}).click();await expect.poll(()=>settings?.targetXPercent).toBe(70);expect(settings.slippageBps).toBe(75);await expect(page.getByText('Settings changed.',{exact:false})).toHaveCount(0);
 await page.getByRole('button',{name:'Back to position',exact:false}).click();await page.getByLabel('Select position').selectOption(other.address);await expect(page.getByRole('heading',{level:1})).toHaveText('Second test position');await expect(page.getByRole('tablist')).toHaveCount(0);
});
