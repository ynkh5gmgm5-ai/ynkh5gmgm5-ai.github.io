import { chromium } from '@playwright/test';

const OUT = 'C:/Users/Administrator/AppData/Local/Temp/vision_check4';
import { mkdirSync } from 'node:fs';
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, reducedMotion: 'reduce' });
const page = await ctx.newPage();

// 移动端研究详情页 - 文献区
await page.goto('http://localhost:4321/research/china-hifi-competition-price-map/', { waitUntil: 'networkidle' });
await page.waitForTimeout(500);
await page.evaluate(() => {
  const bq = [...document.querySelectorAll('.article-body blockquote')].pop();
  bq?.scrollIntoView({ block: 'start' });
});
await page.waitForTimeout(300);
await page.screenshot({ path: OUT + '/m_detail_refs.png' });

// 移动端试听详情页 - 头部+正文
await page.goto('http://localhost:4321/listening/in-ear/oxygen-oxygen/', { waitUntil: 'networkidle' });
await page.waitForTimeout(800);
await page.screenshot({ path: OUT + '/m_listen_head.png' });
await page.evaluate(() => window.scrollBy(0, 500));
await page.waitForTimeout(300);
await page.screenshot({ path: OUT + '/m_listen_body.png' });

console.log('done');
await browser.close();
