import {openFirstPosition} from './navigation';
import {test,expect} from '@playwright/test';

test('public homepage is static, responsive and connects to the preserved application',async({page})=>{
 const calls:string[]=[];page.on('request',r=>{if(r.url().includes('/api/'))calls.push(r.url());});
 await page.goto('/');await expect(page.getByRole('heading',{level:1})).toHaveText('Your liquidity.Your next move.');
 await expect(page.getByText('Illustrative · not live data',{exact:true})).toBeVisible();
 await expect(page.getByRole('textbox')).toHaveCount(0);
 await page.keyboard.press('Tab');await expect(page.getByRole('link',{name:'Skip to content'})).toBeFocused();await page.keyboard.press('Enter');await expect(page.locator('#main')).toBeFocused();
 for(const width of [1440,834,390,320]){
  await page.setViewportSize({width,height:900});await page.evaluate(()=>scrollTo(0,0));
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await expect(page.getByRole('link',{name:'Open App',exact:false}).last()).toBeVisible();
  await page.screenshot({path:`evidence/landing/home-${width}.png`,fullPage:true});
 }
 await page.getByRole('link',{name:'See how it works'}).click();await expect(page).toHaveURL(/#how-it-works$/);
 await expect(page.getByRole('heading',{name:'Analyze',exact:true})).toBeInViewport();
 await page.locator('summary').focus();await page.keyboard.press('Enter');await expect(page.getByText(/an incomplete estimate is never a total execution cost/)).toBeVisible();
 await page.screenshot({path:'evidence/landing/methodology-mobile.png',fullPage:true});
 expect(calls).toEqual([]);
 for(const link of await page.getByRole('link',{name:'Open App',exact:false}).all())await expect(link).toHaveAttribute('href','/app');
 await page.getByRole('link',{name:'Open App',exact:false}).last().click();await expect(page).toHaveURL(/\/app$/);
 await expect(page.getByRole('button',{name:'Analyze',exact:true})).toBeVisible();expect(calls).toEqual([]);
 await page.getByRole('button',{name:'Try Demo'}).click();await openFirstPosition(page);await expect(page.getByRole('button',{name:'Compare options'})).toBeVisible();
});

test('public homepage does not authorize private pilot data',async({browser})=>{
 const context=await browser.newContext({baseURL:'http://127.0.0.1:3102'});
 try{
  const page=await context.newPage();await page.goto('/');await expect(page.getByRole('heading',{level:1})).toContainText('Your liquidity.');
  const response=await context.request.post('/api/positions',{data:{kind:'wallet',address:'21du6vEJaw4GMmttGFSy7eZRm5zB2dGCEVGunjiBCANU'}});expect(response.status()).toBe(401);
  await page.getByRole('link',{name:'Open App',exact:false}).last().click();await expect(page.getByRole('button',{name:'Analyze',exact:true})).toBeVisible();
  await page.getByLabel('Public Solana address').fill('21du6vEJaw4GMmttGFSy7eZRm5zB2dGCEVGunjiBCANU');await page.getByRole('button',{name:'Analyze',exact:true}).click();await expect(page.getByRole('heading',{name:'Welcome to the ten-person pilot'})).toBeVisible();
 }finally{await context.close();}
});
