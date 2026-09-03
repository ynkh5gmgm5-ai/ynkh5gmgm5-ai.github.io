import { chromium } from '@playwright/test';

const OUT = 'C:/Users/Administrator/AppData/Local/Temp/footer_check';
import { mkdirSync } from 'node:fs';
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
const page = await ctx.newPage();

const paths = ['/', '/research/', '/listening/', '/photography/', '/about/'];
for (const p of paths) {
  await page.goto('http://localhost:4321' + p, { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);
  const hasFooter = await page.evaluate(() => !!document.querySelector('footer'));
  const scrollH = await page.evaluate(() => document.documentElement.scrollHeight);
  await page.screenshot({ path: OUT + '/bottom_' + p.replace(/\//g, '_') + '.png' });
  console.log(p, 'footer:', hasFooter, 'scrollH:', scrollH);
}
await browser.close();
