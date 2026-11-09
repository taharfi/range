import {test,expect} from '@playwright/test';
import {readFile} from 'node:fs/promises';
import {demoBrief} from '../lib/demo';
const report=JSON.parse(await readFile(new URL('../../data/evidence/closed-position-reconciliation.json',import.meta.url),'utf8'));
test('saved-evidence API retains invitation, origin, validation and honest no-cache states',async({request})=>{
 const privateResponse=await request.post('http://127.0.0.1:3102/api/portfolio',{data:{kind:'reconciliation',address:report.owner}});expect(privateResponse.status()).toBe(401);
 const cross=await request.post('/api/portfolio',{headers:{Origin:'https://foreign.invalid'},data:{kind:'reconciliation',address:report.owner}});expect(cross.status()).toBe(403);
 const malformed=await request.post('/api/portfolio',{data:{kind:'reconciliation',address:'not-a-public-key'}});expect(malformed.status()).toBe(400);
 const absent=await request.post('/api/portfolio',{data:{kind:'reconciliation',address:report.owner}});expect(absent.status()).toBe(200);expect((await absent.json()).status).toBe('not-indexed');
});
test('saved closed evidence remains optional, scoped and explicit about unavailable economic returns',async({page})=>{
 const brief=await demoBrief(),p=brief.position;let requests=0,fail=false;
 await page.route('**/api/session',r=>r.fulfill({json:{required:false,authenticated:false,analyticsConsent:false}}));
 await page.route('**/api/positions',r=>r.fulfill({json:{mode:'live',snapshotId:'test',positions:[p],handles:{[p.address]:'test'},warnings:[],hasNextPools:false,morePositions:[],poolPage:1}}));
 await page.route('**/api/portfolio',async route=>{const body=route.request().postDataJSON();if(body.kind==='reconciliation'){requests++;await route.fulfill({status:fail?503:200,json:fail?{error:'Saved lifecycle evidence failed validation.'}:{positions:[report],coverage:'saved-operator-evidence-only',status:'available'}});}else await route.fulfill({json:{positions:[],poolPage:1,hasNextPools:false,morePositions:[],indexedAllTimeCount:990,warnings:[],retrievedAt:Date.now(),sourceUrls:[],windowDays:365}});});
 await page.goto('/app');await page.getByLabel('Public Solana address').fill(report.owner);await page.getByRole('button',{name:'Analyze',exact:true}).click();await page.getByRole('tab',{name:'Closed',exact:true}).click();expect(requests).toBe(0);
 const region=page.getByRole('region',{name:'Saved on-chain evidence'});await region.getByText('Saved on-chain evidence',{exact:true}).click();await region.getByRole('button',{name:'Load saved evidence'}).click();await expect(region).toContainText('Token flows reconciled');await region.locator('details details').first().locator('summary').first().click();await expect(region).toContainText('Historical USD P&L and hold returns unavailable');await expect(region).toContainText('not allocated as a complete position cost');
 for(const width of [1440,390]){await page.setViewportSize({width,height:900});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);}
 fail=true;await region.getByRole('button',{name:'Reload saved evidence'}).click();await expect(region.getByRole('alert')).toContainText('Previously loaded evidence is retained');await expect(region).toContainText('Token flows reconciled');
});
