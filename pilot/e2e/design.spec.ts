import {openFirstPosition} from './navigation';
﻿import {test,expect} from '@playwright/test';
const sample='21du6vEJaw4GMmttGFSy7eZRm5zB2dGCEVGunjiBCANU';
test('RANGE screens are visually distinct, keyboard accessible and responsive',async({page,request})=>{
 await page.setViewportSize({width:1440,height:900});await page.goto('/app');await expect(page).toHaveTitle('range. — Know your position.');
 await page.keyboard.press('Tab');await expect(page.getByRole('link',{name:'Skip to content'})).toBeFocused();await page.keyboard.press('Enter');await expect(page.locator('#workspace')).toBeFocused();
 for(const asset of ['/brand/range-symbol.svg','/brand/range-wordmark.svg','/icon.svg'])expect((await request.get(asset)).status()).toBe(200);
 await page.screenshot({path:'evidence/progressive/search-desktop.png',fullPage:true});
 await page.getByRole('button',{name:'Try Demo'}).click();await openFirstPosition(page);await expect(page.getByRole('figure',{name:/inside the plotted boundaries/})).toBeVisible();
 await expect(page.locator('.screen-search')).toHaveCount(0);await expect(page.getByRole('tablist')).toHaveCount(0);
 await page.screenshot({path:'evidence/progressive/position-desktop.png',fullPage:true});
 const compareBox=(await page.getByRole('button',{name:'Compare options'}).boundingBox())!;expect(compareBox.y+compareBox.height).toBeLessThanOrEqual(900);
 await page.getByRole('button',{name:'Compare options'}).click();
 for(const action of ['HOLD','REBALANCE','EXIT']){await page.getByRole('tab',{name:action,exact:true}).click();await expect(page.getByRole('tabpanel')).toHaveCount(1);await page.screenshot({path:`evidence/progressive/decision-${action.toLowerCase()}-desktop.png`,fullPage:true});}
 await page.getByRole('tab',{name:'EXIT',exact:true}).focus();await page.keyboard.press('Home');await expect(page.getByRole('tab',{name:'HOLD',exact:true})).toBeFocused();await expect(page.getByRole('tab',{name:'HOLD',exact:true})).toHaveAttribute('aria-selected','true');
 await page.keyboard.press('ArrowRight');await expect(page.getByRole('tab',{name:'REBALANCE',exact:true})).toHaveAttribute('aria-selected','true');
 for(const width of [834,390,320]){
  await page.setViewportSize({width,height:844});await page.getByRole('button',{name:'Back to position',exact:false}).click();
  await page.screenshot({path:`evidence/progressive/position-${width}.png`,fullPage:true});
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await page.getByRole('button',{name:'Compare options'}).click();await page.getByRole('tab',{name:'EXIT',exact:true}).click();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);await page.screenshot({path:`evidence/progressive/decision-exit-${width}.png`,fullPage:true});
 }
 await page.getByRole('button',{name:'Back to position',exact:false}).click();await page.getByRole('button',{name:'Back to portfolio',exact:false}).click();await page.getByRole('button',{name:'New search',exact:false}).click();await page.setViewportSize({width:390,height:844});await page.screenshot({path:'evidence/progressive/search-mobile.png',fullPage:true});
 await page.emulateMedia({reducedMotion:'reduce'});expect(await page.locator('.primary').first().evaluate(el=>getComputedStyle(el).transitionDuration)).toBe('0s');
});
test('loading, invalid, provider error, empty, unknown range and stale estimates remain explicit',async({page,request})=>{
 const b=await(await request.get('/api/demo')).json();b.mode='live';b.feedbackToken=null;b.position.pair='SYNTHETIC QA / SOL-USDC';b.position.poolPrice='125';b.position.minPrice='90';b.position.maxPrice='110';b.position.rangeStatus='out-of-range';b.position.warnings=['SYNTHETIC QA FIXTURE — not financial observations'];
 let mode='loading';
 await page.route('**/api/positions',async r=>{if(mode==='loading')await new Promise(resolve=>setTimeout(resolve,700));if(mode==='failure')return r.fulfill({status:503,json:{error:'Synthetic provider failure. No fallback prices were substituted.'}});return r.fulfill({json:{mode:'live',snapshotId:'test-only',positions:mode==='empty'?[]:[b.position],warnings:mode==='empty'?['Synthetic incomplete coverage warning']:[],hasNextPools:false,poolPage:1,morePositions:[],handles:{[b.position.address]:'test-only'}}});});
 await page.route('**/api/brief',r=>r.fulfill({json:b}));
 await page.goto('/app');await page.getByLabel('Public Solana address').fill('invalid-public-address-xxxxxxxxxxxx');await page.getByRole('button',{name:'Analyze',exact:true}).click();await expect(page.getByRole('alert').filter({hasText:'public Solana'})).toBeVisible();await page.screenshot({path:'evidence/progressive/invalid-search.png',fullPage:true});
 await page.getByLabel('Public Solana address').fill(sample);await page.getByRole('button',{name:'Analyze',exact:true}).click();await expect(page.getByRole('status').filter({hasText:'Reading public position'})).toBeVisible();await page.screenshot({path:'evidence/progressive/loading.png',fullPage:true});
 await openFirstPosition(page);await expect(page.getByRole('figure',{name:/outside the plotted boundaries/})).toBeVisible();const band=(await page.locator('.range-band').boundingBox())!,marker=(await page.locator('.range-marker').boundingBox())!;expect(marker.x).toBeGreaterThan(band.x+band.width);await page.screenshot({path:'evidence/progressive/out-of-range.png',fullPage:true});
 for(const q of [...b.exit.swaps,...b.rebalance.swaps])q.receivedAt=Date.now()-60000;b.generatedAt=Date.now()-60000;
 await page.getByRole('button',{name:'Compare options'}).click();await page.getByRole('tab',{name:'EXIT',exact:true}).click();await expect(page.getByText('Quotes are over 30 seconds old.',{exact:false})).toBeVisible();await page.screenshot({path:'evidence/progressive/stale-decision.png',fullPage:true});
 await page.getByRole('button',{name:'Back to position',exact:false}).click();b.position.poolPrice=null;b.position.rangeStatus='unknown';mode='missing';await page.getByRole('button',{name:'Refresh position',exact:true}).click();await expect(page.getByText('Range visualization unavailable.',{exact:false})).toBeVisible();await page.screenshot({path:'evidence/progressive/unknown-range.png',fullPage:true});
 await page.getByRole('button',{name:'Back to portfolio',exact:false}).click();mode='empty';await page.getByRole('button',{name:'Refresh',exact:true}).click();await expect(page.getByRole('heading',{name:'Position discovery incomplete.'})).toBeVisible();await page.screenshot({path:'evidence/progressive/empty-position.png',fullPage:true});
 await page.getByRole('button',{name:'Try another address'}).click();mode='failure';await page.getByRole('button',{name:'Analyze',exact:true}).click();await expect(page.getByRole('alert').filter({hasText:'Synthetic provider failure'})).toBeVisible();await page.screenshot({path:'evidence/progressive/provider-failure.png',fullPage:true});
});
