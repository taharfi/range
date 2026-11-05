import type {Page} from '@playwright/test';
export async function openFirstPosition(page:Page){await page.locator('.portfolio-row').first().click();}
