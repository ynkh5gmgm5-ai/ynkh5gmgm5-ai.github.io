import { chromium } from '@playwright/test';

const OUT = 'C:/Users/Administrator/AppData/Local/Temp/vision_check3';
import { mkdirSync } from 'node:fs';
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
const page = await ctx.newPage();

const url = 'http://localhost:4321/research/china-hifi-competition-price-map/';
await page.goto(url, { waitUntil: 'networkidle' });
await page.waitForTimeout(600);

// 头部
await page.screenshot({ path: OUT + '/d_detail_head.png' });
// 滚动到第一个表格
await page.evaluate(() => document.querySelector('.article-body table')?.scrollIntoView({ block: 'start' }));
await page.waitForTimeout(300);
await page.screenshot({ path: OUT + '/d_detail_table1.png' });
// 滚动到文献区（blockquote）
await page.evaluate(() => {
  const bq = [...document.querySelectorAll('.article-body blockquote')].pop();
  bq?.scrollIntoView({ block: 'start' });
});
await page.waitForTimeout(300);
await page.screenshot({ path: OUT + '/d_detail_refs.png' });
// 页脚
await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
await page.waitForTimeout(300);
await page.screenshot({ path: OUT + '/d_detail_bottom.png' });
console.log('done');
await browser.close();
