import {openFirstPosition} from './navigation';
import {test,expect} from '@playwright/test';
const address='21du6vEJaw4GMmttGFSy7eZRm5zB2dGCEVGunjiBCANU';
const first='BrVyh2knHr83iQB4yPCHd6q5KRbJDPjqXpeAgfjeQtZp';
const second='Bp9jYmh9ZGw1TmrWjVG3yESv5J1gVkCu4kFmYizRtjMY';
function lookup(positions:any[],handles:Record<string,string>){return {mode:'live',snapshotId:'synthetic-qa',positions,warnings:[],hasNextPools:false,poolPage:1,morePositions:[],handles};}
function brief(base:any,position:any,input:any){return {...base,mode:'live',feedbackToken:null,position,exitMint:input.exitMint,targetXPercent:input.targetXPercent,slippageBps:input.slippageBps,generatedAt:Date.now()};}

test('decision recovery refreshes the selected position and quotes atomically, retaining tab and settings',async({page,request})=>{
 const base=await(await request.get('/api/demo')).json();
 const a={...base.position,address:first,warnings:['Synthetic QA fixture; not financial observations.']};
 const b={...a,address:second};const fresh={...b,inventory:{x:'4',y:'200'},updatedAt:Math.floor(Date.now()/1000)};
 let releaseLookup!:()=>void,releaseQuote!:()=>void;const lookupReady=new Promise<void>(r=>releaseLookup=r),quoteReady=new Promise<void>(r=>releaseQuote=r);
 const lookups:any[]=[],quotes:any[]=[];
 await page.route('**/api/positions',async r=>{const input=r.request().postDataJSON();lookups.push(input);if(input.kind==='position'){await lookupReady;return r.fulfill({json:lookup([a,fresh],{[first]:'first-new',[second]:'second-new'})});}return r.fulfill({json:lookup([a,b],{[first]:'first-old',[second]:'second-old'})});});
 await page.route('**/api/brief',async r=>{const input=r.request().postDataJSON();quotes.push(input);if(input.handle==='second-new')await quoteReady;
  const value=brief(base,input.handle==='second-new'?fresh:b,input);if(input.handle==='second-new'){value.rebalance={...value.rebalance,output:value.rebalance.output.map((o:any,i:number)=>i===0?{...o,amount:'4.398',minimum:'4.396'}:o)};}
  return r.fulfill({json:value});});
 await page.goto('/app');await page.getByLabel('Public Solana address').fill(address);await page.getByRole('button',{name:'Analyze',exact:true}).click();await openFirstPosition(page);await page.getByLabel('Select position').selectOption(second);
 await page.getByRole('button',{name:'Compare options'}).click();await page.getByRole('tab',{name:'REBALANCE',exact:true}).click();
 await page.getByText('Comparison settings',{exact:true}).click();await page.getByLabel('Target SOL share (%)').fill('65');await page.getByLabel('Slippage cap (bps)').fill('75');await page.getByLabel('Exit into').selectOption(base.position.x.mint);
 await page.getByRole('button',{name:'Refresh position & quotes',exact:true}).click();await expect(page.getByText('Previous analysis',{exact:true})).toBeVisible();await expect(page.getByRole('button',{name:'Export analysis'})).toBeDisabled();
 await expect(page.getByRole('status').filter({hasText:'Refreshing your position'})).toBeVisible();await expect(page.locator('.outcomes strong').first()).toHaveText('2.398');
 releaseLookup();await expect.poll(()=>quotes.length).toBe(2);await expect(page.locator('.outcomes strong').first()).toHaveText('2.398'); // fresh inventory is not committed ahead of its quotes
 releaseQuote();await expect(page.getByText('Position and quotes refreshed.',{exact:false})).toBeVisible();await expect(page.locator('.outcomes strong').first()).toHaveText('4.398');
 expect(lookups).toEqual([{kind:'wallet',address},{kind:'position',address:second}]);expect(quotes[1]).toMatchObject({handle:'second-new',targetXPercent:65,slippageBps:75,exitMint:base.position.x.mint});
 await expect(page.getByRole('tab',{name:'REBALANCE',exact:true})).toHaveAttribute('aria-selected','true');await expect(page.getByLabel('Target SOL share (%)')).toHaveValue('65');await expect(page.getByText('Previous analysis',{exact:true})).toHaveCount(0);
 await expect(page.getByText('Swap-only estimate.',{exact:false})).toBeVisible();await expect(page.getByText('Full execution cost unavailable',{exact:true})).toBeVisible();
 await page.getByText('Comparison settings',{exact:true}).click();
 for(const width of [1440,834,390,320]){await page.setViewportSize({width,height:900});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);await page.screenshot({path:`evidence/pilot-readiness/recovered-${width}.png`,fullPage:true});}
 await page.getByRole('button',{name:/Back to position/}).click();await expect(page.getByLabel('Select position')).toHaveValue(second);
});

test('failed, missing and partial refreshes never relabel old quotes as current or replace the position',async({page,request})=>{
 const base=await(await request.get('/api/demo')).json(),p={...base.position,address:first,warnings:[]};let phase='initial',quoteCount=0;
 await page.route('**/api/positions',r=>{
  if(phase==='provider')return r.fulfill({status:429,json:{error:'Synthetic QA provider limit. Try again later.'}});
  if(phase==='missing')return r.fulfill({json:lookup([{...p,address:second}],{[second]:'other'})});
  return r.fulfill({json:lookup([p],{[first]:'fresh-'+phase})});
 });
 await page.route('**/api/brief',r=>{quoteCount++;if(phase==='quotes')return r.fulfill({status:503,json:{error:'Synthetic QA quote provider unavailable.'}});
  const value=brief(base,p,r.request().postDataJSON());if(phase==='partial')value.rebalance={status:'unavailable',output:[],swaps:[],warnings:[],error:'Synthetic QA: no route.'};return r.fulfill({json:value});});
 await page.goto('/app');await page.getByLabel('Public Solana address').fill(address);await page.getByRole('button',{name:'Analyze',exact:true}).click();await openFirstPosition(page);await page.getByRole('button',{name:'Compare options'}).click();await page.getByRole('tab',{name:'REBALANCE',exact:true}).click();
 for(const value of ['provider','quotes','missing']){phase=value;const previousCount=quoteCount;await page.getByRole('button',{name:'Refresh position & quotes',exact:true}).click();await expect(page.getByText('Refresh incomplete.',{exact:false})).toBeVisible();await expect(page.locator('.outcomes strong').first()).toHaveText('2.398');await expect(page.getByText('Previous analysis',{exact:true})).toBeVisible();await expect(page.getByRole('button',{name:'Export analysis'})).toBeDisabled();if(value==='missing')expect(quoteCount).toBe(previousCount);}
 phase='partial';await page.getByRole('button',{name:'Refresh position & quotes',exact:true}).click();await expect(page.getByText('Analysis updated. Some conversion estimates are unavailable;', {exact:false})).toBeVisible();await expect(page.getByText('Estimate unavailable',{exact:true})).toBeVisible();await expect(page.locator('.outcomes strong')).toHaveCount(0);await expect(page.getByText('Previous analysis',{exact:true})).toHaveCount(0);
});

test('expired invitation is renewed through the existing gate before decision recovery resumes',async({page,request})=>{
 const base=await(await request.get('/api/demo')).json(),p={...base.position,address:first,warnings:[]};let expired=false,expireNext=false,refreshes=0;
 await page.route('**/api/session',r=>{
  if(r.request().method()==='POST'){expect(r.request().postDataJSON()).toMatchObject({code:'QA-INVITATION-ONLY',analyticsConsent:false});expired=false;return r.fulfill({json:{required:true,authenticated:true,analyticsConsent:false}});}
  return r.fulfill({json:{required:expired,authenticated:false,analyticsConsent:false}});
 });
 await page.route('**/api/positions',r=>{if(expireNext){expireNext=false;expired=true;return r.fulfill({status:401,json:{error:'Enter your tester invitation code to use live lookups.'}});}refreshes++;return r.fulfill({json:lookup([p],{[first]:'fresh'})});});
 await page.route('**/api/brief',r=>r.fulfill({json:brief(base,p,r.request().postDataJSON())}));
 await page.goto('/app');await page.getByLabel('Public Solana address').fill(address);await page.getByRole('button',{name:'Analyze',exact:true}).click();await openFirstPosition(page);await page.getByRole('button',{name:'Compare options'}).click();await page.getByRole('tab',{name:'EXIT',exact:true}).click();expireNext=true;
 await page.getByRole('button',{name:'Refresh position & quotes',exact:true}).click();await expect(page.getByRole('heading',{name:'Welcome to the ten-person pilot'})).toBeVisible();await expect(page.getByText('Previous analysis',{exact:true})).toBeVisible();expect(refreshes).toBe(1);
 await page.getByLabel('Pilot access code').fill('QA-INVITATION-ONLY');await page.getByRole('button',{name:'Start private pilot'}).click();await expect(page.getByText('Position and quotes refreshed.',{exact:false})).toBeVisible();expect(refreshes).toBe(2);await expect(page.getByRole('tab',{name:'EXIT',exact:true})).toHaveAttribute('aria-selected','true');await expect(page.getByRole('region',{name:'Decision',exact:true})).toBeVisible();
});

test('coverage stays collapsed and explains provider sharing and excluded costs without extra tracking',async({page})=>{
 const calls:string[]=[];page.on('request',r=>{if(r.url().includes('/api/'))calls.push(r.url());});
 await page.goto('/app');await expect(page.locator('.coverage')).not.toHaveAttribute('open');await page.getByText('Coverage & data sources',{exact:true}).click();
 for(const text of ['Token-2022 conversions','Public lookup addresses are sent to Meteora','without a taker wallet','Incomplete estimates are never a total execution cost','Missing or stale information stays unavailable'])await expect(page.locator('.coverage')).toContainText(text);
 expect(calls).toEqual([]);await page.setViewportSize({width:320,height:844});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});
