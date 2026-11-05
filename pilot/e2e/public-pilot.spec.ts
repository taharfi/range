import {test,expect} from '@playwright/test';
import {readFile,readdir,rm} from 'node:fs/promises';
import path from 'node:path';
const dataDir=path.resolve('test-results/public-isolated-feedback');
test.beforeAll(async()=>{
 // Only synthetic fixture storage, never the configured real-pilot data directory.
 if(path.dirname(dataDir)!==path.resolve('test-results')||path.basename(dataDir)!=='public-isolated-feedback')throw new Error('Unsafe fixture path');
 await rm(dataDir,{recursive:true,force:true});
});
const address='21du6vEJaw4GMmttGFSy7eZRm5zB2dGCEVGunjiBCANU';
test('invitation appears only after Analyze; declining analytics, consented visits and erasure work',async({page,request})=>{
 const b=await(await request.get('/api/demo')).json();b.position.warnings=[];b.position.pair='SYNTHETIC QA SOL/USDC';
 await page.route('**/api/positions',r=>r.fulfill({json:{mode:'live',snapshotId:'test',positions:[b.position],warnings:[],hasNextPools:false,poolPage:1,morePositions:[],handles:{[b.position.address]:'test'}}}));
 await page.goto('/app');await expect(page.getByRole('heading',{name:'Welcome to the ten-person pilot'})).toHaveCount(0);
 const unauthorized=await page.request.post('/api/positions',{headers:{origin:'http://127.0.0.1:3102'},data:{kind:'wallet',address}});expect(unauthorized.status()).toBe(401);
 await page.getByLabel('Public Solana address').fill(address);await page.getByRole('button',{name:'Analyze',exact:true}).click();await expect(page.getByRole('heading',{name:'Welcome to the ten-person pilot'})).toBeVisible();
 await page.screenshot({path:'evidence/progressive/invitation-desktop.png',fullPage:true});await page.setViewportSize({width:390,height:844});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);await page.screenshot({path:'evidence/progressive/invitation-mobile.png',fullPage:true});await page.setViewportSize({width:1280,height:720});
 await expect(page.getByLabel('Public Solana address')).toBeDisabled();await page.getByLabel('Pilot access code').fill('PUBLIC-TEST-CODE-0-1234567890');await expect(page.getByLabel('Optional: measure my pilot usage',{exact:false})).not.toBeChecked();await page.getByRole('button',{name:'Start private pilot'}).click();
 await expect(page.getByRole('region',{name:'Portfolio',exact:true})).toBeVisible();const cookie=(await page.context().cookies()).find(c=>c.name==='lp_pilot');expect(cookie?.httpOnly).toBe(true);expect(cookie?.sameSite).toBe('Strict');
 const count=async()=>{try{return(await readdir(path.join(dataDir,'analytics'))).filter(f=>f.endsWith('.json')).length;}catch{return 0;}};expect(await count()).toBe(0);
 await page.getByRole('button',{name:'Pilot access',exact:true}).click();await page.getByRole('button',{name:'Sign out & delete usage history'}).click();await expect(page.getByRole('button',{name:'Analyze',exact:true})).toBeVisible();
 await page.getByRole('button',{name:'Analyze',exact:true}).click();await page.getByLabel('Pilot access code').fill('PUBLIC-TEST-CODE-0-1234567890');await page.getByLabel('Optional: measure my pilot usage',{exact:false}).check();await page.getByRole('button',{name:'Start private pilot'}).click();await expect(page.getByRole('region',{name:'Portfolio',exact:true})).toBeVisible();expect(await count()).toBe(1);
 const file=(await readdir(path.join(dataDir,'analytics'))).find(f=>f.endsWith('.json'))!;const stored=JSON.parse(await readFile(path.join(dataDir,'analytics',file),'utf8'));expect(stored.events.map((e:{kind:string})=>e.kind)).toEqual(['visit']);expect(JSON.stringify(stored)).not.toContain('PUBLIC-TEST-CODE');
 await page.reload();await page.getByLabel('Public Solana address').fill(address);await page.getByRole('button',{name:'Analyze',exact:true}).click();await expect(page.getByRole('region',{name:'Portfolio',exact:true})).toBeVisible();expect(JSON.parse(await readFile(path.join(dataDir,'analytics',file),'utf8')).events.length).toBe(1);
 await page.getByRole('button',{name:'Pilot access',exact:true}).click();await expect(page.getByText('Usage measurement enabled by consent.',{exact:false})).toBeVisible();await page.getByRole('button',{name:'Sign out & delete usage history'}).click();await expect(page.getByRole('button',{name:'Analyze',exact:true})).toBeVisible();expect(await count()).toBe(0);
});
test('health, security headers and public-mode admission are explicit',async({request})=>{
 const live=await request.get('/api/health');expect(live.status()).toBe(200);expect((await live.json()).readOnly).toBe(true);
 const ready=await request.get('/api/health?ready=1');expect(ready.status()).toBe(200);expect((await ready.json()).status).toBe('ready');
 const storageChecks=(await ready.json()).checks;expect(storageChecks.storage).toBe(true);expect(storageChecks.ledgerStorage).toBe(true);expect(storageChecks.separateStores).toBe(true);
 const home=await request.get('/');expect(home.headers()['content-security-policy']).toContain("connect-src 'self'");expect(home.headers()['x-frame-options']).toBe('DENY');
 const huge=await request.post('/api/session',{headers:{origin:'http://127.0.0.1:3102','content-type':'application/json'},data:'x'.repeat(9000)});expect(huge.status()).toBe(413);
 const wrong=await request.post('/api/session',{headers:{origin:'https://other.example'},data:{code:'PUBLIC-TEST-CODE-0-1234567890',analyticsConsent:true}});expect(wrong.status()).toBe(403);
});

