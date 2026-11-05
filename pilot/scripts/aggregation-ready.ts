import type {Page} from '@playwright/test';
export async function waitForWalletAggregation(page:Page){
 await page.waitForFunction(()=>!document.querySelector('.portfolio-valuation')?.textContent?.startsWith('Aggregating wallet positions'),{},{timeout:180000});
 const error=page.locator('.error[role="alert"]').first();if(await error.isVisible())throw Error(await error.innerText());
 if(await page.getByRole('heading',{name:'Portfolio aggregation failed.',exact:true}).isVisible())throw Error('Wallet aggregation failed; no empty result was inferred.');
}
