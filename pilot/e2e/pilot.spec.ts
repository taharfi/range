import {openFirstPosition} from './navigation';
﻿import {test,expect} from '@playwright/test';
import {createHmac,randomUUID} from 'node:crypto';
const address='21du6vEJaw4GMmttGFSy7eZRm5zB2dGCEVGunjiBCANU';
test('minimal search, invalid input, demo position and one-action decision tabs',async({page})=>{
 await page.goto('/app');await expect(page.getByRole('heading',{level:1})).toHaveText('Know your position.');
 await expect(page.getByRole('button',{name:'Analyze',exact:true})).toBeVisible();await expect(page.getByRole('button',{name:'Try Demo'})).toBeVisible();
 await expect(page.getByRole('region',{name:'Pilot access'})).toHaveCount(0);await expect(page.getByRole('tablist')).toHaveCount(0);
 await page.getByLabel('Public Solana address').fill('invalid-public-address-xxxxxxxxxxxx');await page.getByRole('button',{name:'Analyze',exact:true}).click();
 await expect(page.getByRole('alert').filter({hasText:'public Solana'})).toBeVisible();
 await page.getByRole('button',{name:'Try Demo'}).click();await openFirstPosition(page);await expect(page.getByRole('region',{name:'Position',exact:true})).toBeVisible();
 await expect(page.getByText('Demo · synthetic data',{exact:true})).toBeVisible();await expect(page.getByLabel('Public Solana address')).toHaveCount(0);
 await expect(page.getByText('Bins',{exact:true})).toHaveCount(0);
 await page.getByRole('button',{name:'Compare options'}).click();await expect(page.getByRole('tabpanel')).toHaveCount(1);await expect(page.getByRole('heading',{name:'Keep your position'})).toBeVisible();
 await page.getByRole('tab',{name:'REBALANCE',exact:true}).click();await expect(page.getByRole('heading',{name:'Change your token mix'})).toBeVisible();await expect(page.getByRole('heading',{name:'Keep your position'})).toHaveCount(0);
 await expect(page.getByText('Full execution cost unavailable',{exact:true})).toBeVisible();
 await page.getByRole('tab',{name:'EXIT',exact:true}).click();await expect(page.getByRole('heading',{name:'Convert your liquidity'})).toBeVisible();await expect(page.getByRole('tabpanel')).toHaveCount(1);
 await page.getByText('Pilot feedback',{exact:true}).click();await expect(page.getByText('Example mode is excluded from tester results.',{exact:false})).toBeVisible();
 await expect(page.getByRole('button',{name:/connect wallet|execute|sign transaction/i})).toHaveCount(0);
 await page.getByRole('button',{name:'Back to position',exact:false}).click();await expect(page.getByRole('tablist')).toHaveCount(0);
});
test('all three screens and action tabs remain inside mobile viewports',async({page})=>{
 for(const width of [320,390,768]){
  await page.setViewportSize({width,height:844});await page.goto('/app');await page.getByRole('button',{name:'Try Demo'}).click();await openFirstPosition(page);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await page.getByRole('button',{name:'Compare options'}).click();
  for(const action of ['HOLD','REBALANCE','EXIT']){await page.getByRole('tab',{name:action,exact:true}).click();expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);await expect(page.getByRole('tabpanel')).toHaveCount(1);}
 }
});
test('multiple positions, partial quote failure and consent-based feedback remain functional',async({page,request})=>{
 const b=await(await request.get('/api/demo')).json();b.mode='live';b.id='11111111-1111-4111-8111-111111111111';b.feedbackToken='browser-test-receipt-not-real';b.position.address='BrVyh2knHr83iQB4yPCHd6q5KRbJDPjqXpeAgfjeQtZp';b.position.warnings=[];
 b.exit={status:'unavailable',output:[],swaps:[],warnings:[],error:'Provider is rate limited. No substitute quote was used.'};
 const other={...b.position,address:'Bp9jYmh9ZGw1TmrWjVG3yESv5J1gVkCu4kFmYizRtjMY',pair:'Second test position'};
 await page.route('**/api/positions',r=>r.fulfill({json:{mode:'live',snapshotId:'test',positions:[b.position,other],warnings:[],hasNextPools:false,poolPage:1,morePositions:[],handles:{[b.position.address]:'first',[other.address]:'second'}}}));
 await page.route('**/api/brief',r=>r.fulfill({json:b}));let saved=false;
 await page.route('**/api/feedback',async r=>{if(r.request().method()==='DELETE'){saved=false;return r.fulfill({json:{deleted:true}});}const body=r.request().postDataJSON();expect(body.consent).toBe(true);expect(body.selfReportedLp).toBe(true);saved=true;return r.fulfill({status:201,json:{id:'test-only',receipt:'a'.repeat(64),deleteToken:'b'.repeat(64)}});});
 await page.goto('/app');await page.getByLabel('Public Solana address').fill(address);await page.getByRole('button',{name:'Analyze',exact:true}).click();await openFirstPosition(page);await expect(page.getByLabel('Select position')).toBeVisible();
 await page.getByRole('button',{name:'Compare options'}).click();await page.getByRole('tab',{name:'EXIT',exact:true}).click();await expect(page.getByText('Estimate unavailable',{exact:true})).toBeVisible();await expect(page.getByText('Provider is rate limited.',{exact:false})).toBeVisible();
 await page.getByRole('tab',{name:'REBALANCE',exact:true}).click();await expect(page.getByText('Estimated mix after swap',{exact:true})).toBeVisible();
 await page.getByText('Pilot feedback',{exact:true}).click();await page.getByLabel('Tester invitation code').fill('TESTER-ONLY');await page.getByLabel('I currently provide',{exact:false}).check();
 for(const [label,value] of [['Could you understand','yes'],['Does the quoted minimum','no'],['Did you find','yes'],['Did it reveal','yes'],['What did you intend before','hold'],['What do you intend after','exit'],['Would you use','yes'],['Would you pay','maybe']])await page.getByLabel(label,{exact:false}).selectOption(value);
 await page.getByRole('button',{name:'Save feedback with consent'}).click();expect(saved).toBe(false);
 await page.getByLabel('I consent to storing',{exact:false}).check();await page.getByRole('button',{name:'Save feedback with consent'}).click();await expect(page.getByText('Feedback saved with your consent.')).toBeVisible();expect(saved).toBe(true);
 await page.getByRole('button',{name:'Delete my feedback now'}).click();await expect(page.getByText('Your feedback has been deleted.')).toBeVisible();expect(saved).toBe(false);
 await page.getByRole('button',{name:'Back to position',exact:false}).click();await page.getByLabel('Select position').selectOption(other.address);await expect(page.getByRole('heading',{level:1})).toHaveText('Second test position');
 await page.getByRole('button',{name:'Back to portfolio',exact:false}).click();await page.getByRole('button',{name:'New search',exact:false}).click();await page.getByLabel('Public Solana address').fill('So11111111111111111111111111111111111111112');await expect(page.getByRole('tablist')).toHaveCount(0);
});
test("malformed and cross-origin API writes are rejected",async({request})=>{
  const invalid=await request.post("/api/positions",{data:{kind:"wallet",address:"not-an-address"}});expect(invalid.status()).toBe(400);
  const browserOrigin=await request.post("/api/positions",{headers:{origin:"http://127.0.0.1:3101"},data:{kind:"wallet",address:"not-an-address"}});expect(browserOrigin.status()).toBe(400);
  const cross=await request.post("/api/feedback",{headers:{origin:"https://other.example"},data:{consent:true}});expect(cross.status()).toBe(403);
  const fabricated=await request.post("/api/brief",{data:{handle:"11111111-1111-4111-8111-111111111111",exitMint:"So11111111111111111111111111111111111111112",targetXPercent:50,slippageBps:50}});expect(fabricated.status()).toBe(409);
});

test("actual feedback HTTP route stores consented test answers and accepts deletion receipt",async({request})=>{
  const payload=Buffer.from(JSON.stringify({id:randomUUID(),at:Date.now(),mode:"live"})).toString("base64url");
  const signature=createHmac("sha256","e2e-test-only-secret-not-production-123456").update("analysis:"+payload).digest("hex");
  const answer={consent:true,testerCode:"E2E-TESTER-ONLY",token:payload+"."+signature,selfReportedLp:true,understood:"yes",withdrawalCostsIncluded:"no",usefulInsight:"no",overlookedCosts:"no",intendedBefore:"hold",intendedAfter:"hold",useAgain:"unsure",payIntent:"no",monthlyAmount:0,comment:""};
  const denied=await request.post("/api/feedback",{data:{...answer,consent:false}});expect(denied.status()).toBe(400);
  const saved=await request.post("/api/feedback",{data:answer});expect(saved.status()).toBe(201);
  const receipt=await saved.json();
  const duplicate=await request.post("/api/feedback",{data:answer});expect(duplicate.status()).toBe(409);
  const deleted=await request.delete("/api/feedback",{data:{receipt:receipt.receipt,deleteToken:receipt.deleteToken}});expect(deleted.status()).toBe(200);expect((await deleted.json()).deleted).toBe(true);
});

