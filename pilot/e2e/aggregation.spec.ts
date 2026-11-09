import {test,expect} from '@playwright/test';
import {demoBrief} from '../lib/demo';
import {valuePositions,valuedPositions,type Mark} from '../lib/current-prices';
const wallet='ACUvKyTc7dEwR8oMqUZd5xpj19osaFZoXPauuy52adQM',id='d740fa64-c28d-4c41-9819-81096db09a11';

test('position reference value expires visibly and refresh replaces it without requesting a swap',async({page})=>{
 const now=Date.now();await page.clock.install({time:now});const base={...(await demoBrief()).position,updatedAt:Math.floor(now/1000)};let calls=0,quotes=0;
 await page.route('**/api/positions',async r=>{
  const time=now+(calls++?11000:0),tokens=[base.x,base.y];
  const marks:Mark[]=tokens.map((t,i)=>({mint:t.mint,decimals:t.decimals,usd:i?'1':'100',slot:1,at:time,retrievedAt:time,status:'fresh',source:'Jupiter Price V3'}));
  const p=valuedPositions([{...base,updatedAt:Math.floor(time/1000),inventory:calls>1?{x:'1',y:'20'}:base.inventory}],marks,false,time).positions[0];
  if(calls===1)p.currentValuation!.expiresAt=now+10000;
  return r.fulfill({json:{mode:'live',snapshotId:id,positions:[p],handles:{[p.address]:'synthetic-handle'},warnings:['Synthetic browser fixture, not a live observation.'],hasNextPools:false,poolPage:1,morePositions:[]}});
 });
 await page.route('**/api/brief',r=>{quotes++;return r.abort();});
 await page.goto('/app');await page.getByLabel('Public Solana address').fill(wallet);await page.getByRole('button',{name:'Analyze',exact:true}).click();await page.locator('.portfolio-row').click();
 const metric=page.locator('.position-metrics > div').first();await expect(metric).toContainText('$400');await expect(metric).toContainText('Unclaimed fees: $2 estimated');await expect(metric).toContainText('excludes unclaimed fees');
 for(const width of [1440,834,390,320]){await page.setViewportSize({width,height:900});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);await page.screenshot({path:`var/local-validation/position-value-${width}.png`,fullPage:true});}
 await page.clock.fastForward(11000);await expect(metric).toContainText('Reference valuation expired');await expect(metric.locator('strong')).toHaveText('Unavailable');
 await page.getByRole('button',{name:'Refresh position',exact:true}).click();await expect(metric.locator('strong')).toHaveText('$120');expect(quotes).toBe(0);expect(calls).toBe(2);
 await page.getByText('Valuation sources',{exact:true}).click();await expect(metric).toContainText('Jupiter Price V3');await expect(metric).toContainText('Not execution proceeds or historical P&L');expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});

test('valuation expiry explains unavailable values while retaining snapshot-time coverage',async({page})=>{
 const now=Date.now();await page.clock.install({time:now});const p={...(await demoBrief()).position,updatedAt:Math.floor(now/1000)};
 const marks:Mark[]=[p.x,p.y].map(t=>({mint:t.mint,decimals:t.decimals,usd:'1',slot:1,at:now,retrievedAt:now,status:'fresh',source:'Jupiter Price V3'}));const valuation={...valuePositions([p],marks,true,now),expiresAt:now+10000};
 await page.route('**/api/positions',r=>r.fulfill({json:{mode:'live',snapshotId:id,aggregationId:id,positions:[p],handles:{},warnings:[],hasNextPools:false,poolPage:1,morePositions:[],aggregate:{status:'ready',discovered:1,indexed:1,pools:1,inRange:1,outOfRange:0,unknownRange:0,complete:true,issues:[],valuation,updatedAt:now,verifiedOpen:1}}}));
 await page.goto('/app');await page.getByLabel('Public Solana address').fill(wallet);await page.getByRole('button',{name:'Analyze',exact:true}).click();await page.getByRole('tab',{name:'Performance',exact:true}).click();await expect(page.locator('.current-value-metrics')).toContainText('$202');
 await page.clock.fastForward(11000);await expect(page.locator('.current-value-metrics')).toContainText('Unavailable');await expect(page.locator('.current-analytics .notice')).toContainText('Valuation snapshot expired');await expect(page.locator('.current-value-metrics')).toContainText('valued at snapshot time');
});

test('lost server snapshot gives an explicit refresh path without fabricating an empty wallet',async({page})=>{
 const p=(await demoBrief()).position;let starts=0;
 const response=()=>({mode:'live',snapshotId:id,aggregationId:id,positions:[p],handles:{},warnings:[],hasNextPools:true,poolPage:1,morePositions:[],rowCursor:'next',aggregate:{status:'ready',discovered:9,indexed:9,pools:9,inRange:9,outOfRange:0,unknownRange:0,complete:true,issues:[],valuation:null,updatedAt:Date.now(),verifiedOpen:9}});
 await page.route('**/api/positions',r=>{starts++;return r.fulfill({json:response()});});await page.route('**/api/portfolio/aggregate?*',r=>r.fulfill({status:409,json:{error:'Portfolio snapshot expired. Refresh the wallet.'}}));
 await page.goto('/app');await page.getByLabel('Public Solana address').fill(wallet);await page.getByRole('button',{name:'Analyze',exact:true}).click();await page.getByRole('button',{name:'Next positions',exact:true}).click();
 await expect(page.locator('main .error[role="alert"]')).toContainText('Portfolio snapshot expired');await expect(page.locator('.portfolio-row')).toHaveCount(1);expect(starts).toBe(1);await expect(page.getByText('No open position found.',{exact:true})).toHaveCount(0);
 await page.getByRole('button',{name:'Refresh',exact:true}).click();await expect.poll(()=>starts).toBe(2);await expect(page.locator('main .error[role="alert"]')).toHaveCount(0);
});

test('valuation-only token support is distinguished from conversion eligibility',async({page})=>{
 const now=Date.now(),base=(await demoBrief()).position,p={...base,x:{...base.x,verified:false,valuationVerified:true},updatedAt:Math.floor(now/1000)};
 const marks:Mark[]=[p.x,p.y].map(t=>({mint:t.mint,decimals:t.decimals,usd:'1',slot:1,at:now,retrievedAt:now,status:'fresh',source:'Jupiter Price V3'}));
 const summary={status:'ready',discovered:1,indexed:1,pools:1,inRange:1,outOfRange:0,unknownRange:0,complete:true,issues:[],verifiedOpen:1,valuation:valuePositions([p],marks,true,now),updatedAt:now};
 await page.route('**/api/positions',r=>r.fulfill({json:{mode:'live',snapshotId:id,aggregationId:id,positions:[p],handles:{},warnings:[],hasNextPools:false,poolPage:1,morePositions:[],aggregate:summary}}));
 await page.goto('/app');await page.getByLabel('Public Solana address').fill(wallet);await page.getByRole('button',{name:'Analyze',exact:true}).click();await page.getByRole('tab',{name:'Performance',exact:true}).click();
 await page.getByText('Valuation and conversion support',{exact:true}).click();await expect(page.getByText('Token-2022 conversion quotes remain blocked.',{exact:false})).toBeVisible();await expect(page.locator('.current-value-metrics')).not.toContainText('Unavailable');
});

test('coverage reasons are contextual and refresh withdraws the expired financial snapshot',async({page})=>{
 const p={...(await demoBrief()).position,updatedAt:Math.floor(Date.now()/1000)},now=Date.now();
 const valuation=valuePositions([p],[],true,now),issues=[{component:'principal',side:'x',mint:p.x.mint,code:'PRICE_MISSING'}];
 let refreshing=false;
 const summary={status:'ready',discovered:1,indexed:1,pools:1,inRange:1,outOfRange:0,unknownRange:0,complete:true,issues:[],verifiedOpen:1,valuation,updatedAt:now};
 const response=()=>({mode:'live',snapshotId:id,aggregationId:id,positions:refreshing?[]:[{...p,valuationCoverage:{principal:false,fees:false,issues}}],handles:{},warnings:[],hasNextPools:false,poolPage:1,morePositions:[],aggregate:refreshing?{...summary,status:'running',discovered:0,valuation:null}:summary});
 await page.route('**/api/positions',r=>{refreshing=!!r.request().postDataJSON().refresh;return r.fulfill({json:response()});});
 await page.route('**/api/portfolio/aggregate?*',r=>r.fulfill({json:response()}));
 await page.goto('/app');await page.getByLabel('Public Solana address').fill(wallet);await page.getByRole('button',{name:'Analyze',exact:true}).click();
 await page.getByText('Valuation coverage for this page',{exact:true}).click();await expect(page.getByText('Liquidity · SOL: No current price returned',{exact:true})).toBeVisible();
 await page.getByRole('tab',{name:'Performance',exact:true}).click();await page.getByText('Why some values are unavailable',{exact:true}).click();await expect(page.getByText('No current price returned · 1 position',{exact:true})).toBeVisible();
 await page.getByRole('button',{name:'Refresh',exact:true}).click();await expect(page.locator('.terminal-accounting')).toContainText('Unavailable');await expect(page.locator('.portfolio-summary')).toContainText('Discovered so far');
});
test('500-position summary stays independent of five-row pages, current values, currencies and refresh',async({page})=>{
 const p=(await demoBrief()).position,now=Date.now(),all=Array.from({length:500},(_,i)=>({...p,address:'qa-position-'+i,updatedAt:Math.floor(now/1000)}));
 const marks:Mark[]=[p.x,p.y].map((t,i)=>({mint:t.mint,decimals:t.decimals,usd:i===0?'100':'1',slot:1,at:now,retrievedAt:now,status:'fresh',source:'Jupiter Price V3'}));
 const summary={status:'ready',discovered:500,indexed:500,pools:500,inRange:500,outOfRange:0,unknownRange:0,complete:true,issues:[],verifiedOpen:500,valuation:valuePositions(all,marks,true,now),updatedAt:now};
 const response=(offset=0)=>({mode:'live',snapshotId:id,aggregationId:id,aggregate:summary,positions:all.slice(offset,offset+5),handles:Object.fromEntries(all.slice(offset,offset+5).map(p=>[p.address,'qa-handle'])),warnings:[],hasNextPools:true,poolPage:offset/5+1,morePositions:[],rowCursor:'b740fa64-c28d-4c41-9819-81096db09a11'});
 let starts=0,pages=0,quotes=0;const requests:any[]=[];
 await page.route('**/api/positions',r=>{starts++;requests.push(r.request().postDataJSON());return r.fulfill({json:{...response(),positions:[],handles:{},aggregate:{...summary,status:'running',discovered:0,valuation:null}}});});
 await page.route('**/api/portfolio/aggregate?*',r=>{pages++;const cursor=new URL(r.request().url()).searchParams.get('cursor');return r.fulfill({json:response(cursor?5:0)});});
 await page.route('**/api/brief',r=>{quotes++;return r.abort();});
 await page.goto('/app');await page.getByLabel('Public Solana address').fill(wallet);await page.getByRole('button',{name:'Analyze',exact:true}).click();await expect(page.locator('.portfolio-row')).toHaveCount(5);await expect(page.locator('.portfolio-summary')).toContainText('500');await expect(page.locator('.terminal-accounting')).toContainText('$200,000');expect(starts).toBe(1);expect(pages).toBe(1);
 await page.getByRole('button',{name:'Next positions',exact:true}).click();await expect(page.locator('.portfolio-row').first()).toContainText('qa-po');await expect(page.locator('.portfolio-row').first()).toHaveAttribute('data-position','qa-position-5');await expect(page.locator('.portfolio-row')).toHaveCount(5);await expect(page.locator('.terminal-accounting')).toContainText('$200,000');expect(pages).toBe(2);expect(quotes).toBe(0);
 await page.getByRole('tab',{name:'Performance',exact:true}).click();await expect(page.getByRole('region',{name:'Current portfolio valuation'})).toBeVisible();await expect(page.locator('.current-value-metrics')).toContainText('$1,000');await expect(page.locator('.current-analytics')).toContainText('Unclaimed fees are not realized income');await page.getByLabel('Display currency',{exact:true}).selectOption('SOL');await expect(page.locator('.current-value-metrics')).toContainText('2,000 SOL');
 for(const width of [1440,390,320]){await page.setViewportSize({width,height:900});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);}
 await page.getByRole('button',{name:'Refresh',exact:true}).click();await expect.poll(()=>starts).toBe(2);expect(requests[1].refresh).toBe(true);await expect(page.getByRole('tab',{name:'Performance',exact:true})).toHaveAttribute('aria-selected','true');await expect(page.locator('.current-value-metrics')).toContainText('2,000 SOL');await page.getByRole('tab',{name:'Open (500)',exact:true}).click();await expect(page.locator('.portfolio-row')).toHaveCount(5);
});
test('partial current prices stay subtotals; failed aggregation never becomes an empty-wallet claim',async({page})=>{
 const p=(await demoBrief()).position,now=Date.now(),v=valuePositions([p],[],false,now);
 const base={mode:'live',snapshotId:id,aggregationId:id,positions:[p],handles:{},warnings:[],hasNextPools:false,poolPage:1,morePositions:[],aggregate:{status:'ready',discovered:1,indexed:9,pools:9,inRange:1,outOfRange:0,unknownRange:0,complete:false,issues:[{address:null,reason:'QA hydration failure'}],valuation:v,updatedAt:now,verifiedOpen:1}};
 await page.route('**/api/positions',r=>r.fulfill({json:base}));await page.goto('/app');await page.getByLabel('Public Solana address').fill(wallet);await page.getByRole('button',{name:'Analyze',exact:true}).click();await page.getByRole('tab',{name:'Performance',exact:true}).click();await expect(page.locator('.current-analytics .notice')).toContainText('not complete wallet totals');await expect(page.locator('.current-value-metrics')).toContainText('Unavailable');await expect(page.locator('.current-analytics')).toContainText('Net performance');
});
test('aggregate status requires an invitation before exposing cached portfolio data',async({request})=>{
 const r=await request.get(`http://127.0.0.1:3102/api/portfolio/aggregate?id=${id}`);expect(r.status()).toBe(401);
});
test('a completed empty wallet aggregate still probes a direct position address exactly once',async({page})=>{
 const p=(await demoBrief()).position,calls:string[]=[];
 const empty={mode:'live',snapshotId:id,aggregationId:id,positions:[],handles:{},warnings:[],hasNextPools:false,poolPage:1,morePositions:[],aggregate:{status:'running',discovered:0,indexed:0,pools:0,inRange:0,outOfRange:0,unknownRange:0,complete:false,issues:[],valuation:null,updatedAt:Date.now(),verifiedOpen:0}};
 await page.route('**/api/positions',r=>{const v=r.request().postDataJSON();calls.push(v.kind);return r.fulfill({json:v.kind==='wallet'?empty:{mode:'live',snapshotId:'direct',positions:[{...p,address:wallet}],handles:{[wallet]:'direct'},warnings:[],hasNextPools:false,poolPage:1,morePositions:[]}});});
 await page.route('**/api/portfolio/aggregate?*',r=>r.fulfill({json:{...empty,aggregate:{...empty.aggregate,status:'ready',complete:true}}}));
 await page.goto('/app');await page.getByLabel('Public Solana address').fill(wallet);await page.getByRole('button',{name:'Analyze',exact:true}).click();await expect(page.getByRole('region',{name:'Position',exact:true})).toBeVisible();expect(calls).toEqual(['wallet','position']);
});
