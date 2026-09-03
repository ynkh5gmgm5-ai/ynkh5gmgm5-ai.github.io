import { chromium } from '@playwright/test';

const OUT = 'C:/Users/Administrator/AppData/Local/Temp/vision_new2';
import { mkdirSync } from 'node:fs';
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
const page = await ctx.newPage();

// 首页 hero
await page.goto('http://localhost:4321/', { waitUntil: 'networkidle' });
await page.waitForTimeout(1200);
await page.screenshot({ path: OUT + '/hero_desktop.png' });

// field-notes 详情页
await page.goto('http://localhost:4321/listening/field-notes/chongqing-changsha-hifi-meetup/', { waitUntil: 'networkidle' });
await page.waitForTimeout(1000);
const imgs = await page.evaluate(() => [...document.querySelectorAll('img')].map(i => ({
  alt: i.alt.slice(0, 25), w: Math.round(i.getBoundingClientRect().width), loaded: i.complete && i.naturalWidth > 0,
})));
console.log('DETAIL IMGS:', JSON.stringify(imgs));
await page.screenshot({ path: OUT + '/fieldnotes_detail.png', fullPage: true });

// 移动端 hero
const ctxM = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, reducedMotion: 'reduce' });
const pageM = await ctxM.newPage();
await pageM.goto('http://localhost:4321/', { waitUntil: 'networkidle' });
await pageM.waitForTimeout(1000);
await pageM.screenshot({ path: OUT + '/hero_mobile.png' });
console.log('done');
await browser.close();
