import {test,expect} from '@playwright/test';
const address='34kjDvJ49xbg9VtX2N1ReQeWtFSAaGZUh6UqFHGPmzaw';
const empty={mode:'live',snapshotId:'synthetic-qa',positions:[],warnings:[],hasNextPools:false,poolPage:1,morePositions:[],handles:{}};
test('empty wallet does not display the fallback unsupported-position error',async({page})=>{
 const paths:string[]=[];await page.route('**/api/positions',r=>{const kind=r.request().postDataJSON().kind;paths.push(kind);return kind==='wallet'?r.fulfill({json:empty}):r.fulfill({status:400,json:{error:'Not a PositionV2 account',code:'UNSUPPORTED_POSITION_ACCOUNT'}});});
 await page.goto('/app');await page.getByLabel('Public Solana address').fill(address);await page.getByRole('button',{name:'Analyze',exact:true}).click();
 await expect(page.getByRole('heading',{name:'No supported positions returned.'})).toBeVisible();expect(paths).toEqual(['wallet','position']);await expect(page.getByText('Not a PositionV2 account')).toHaveCount(0);await expect(page.getByText('closed positions and other Meteora protocols',{exact:false})).toBeVisible();
 await page.screenshot({path:'evidence/wallet-discovery/empty-wallet-desktop.png',fullPage:true});await page.setViewportSize({width:390,height:844});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);await page.screenshot({path:'evidence/wallet-discovery/empty-wallet-mobile.png',fullPage:true});
});
test('partial coverage and remaining pages never become a conclusive empty wallet',async({page})=>{
 for(const response of [{...empty,warnings:['Synthetic QA: a position could not be decoded.']},{...empty,hasNextPools:true}]){
  const paths:string[]=[];await page.route('**/api/positions',r=>{paths.push(r.request().postDataJSON().kind);return r.fulfill({json:response});});
  await page.goto('/app');await page.getByLabel('Public Solana address').fill(address);await page.getByRole('button',{name:'Analyze',exact:true}).click();await expect(page.getByRole('heading',{name:'Position discovery incomplete.'})).toBeVisible();expect(paths).toEqual(['wallet']);await expect(page.getByText('This is not confirmation that no positions exist.',{exact:false})).toBeVisible();await page.unroute('**/api/positions');
 }
});
test('provider and arbitrary fallback failures are errors rather than no-position results',async({page})=>{
 for(const [initial,status] of [[true,503],[false,404]] as const){
  await page.route('**/api/positions',r=>r.request().postDataJSON().kind==='wallet'&&!initial?r.fulfill({json:empty}):r.fulfill({status,json:{error:'Synthetic QA discovery unavailable'}}));
  await page.goto('/app');await page.getByLabel('Public Solana address').fill(address);await page.getByRole('button',{name:'Analyze',exact:true}).click();await expect(page.getByRole('alert').filter({hasText:'discovery unavailable'})).toBeVisible();await expect(page.getByRole('heading',{name:'No supported positions returned.'})).toHaveCount(0);await page.unroute('**/api/positions');
 }
});
