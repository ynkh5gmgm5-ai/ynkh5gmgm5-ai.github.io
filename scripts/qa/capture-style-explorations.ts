import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { chromium } from '@playwright/test';

const root = resolve(import.meta.dirname, '..', '..');
const outputDir = resolve(root, 'qa', 'style-explorations');
const prototypes = [
  { id: 'A', source: 'a-editorial.html', output: 'A-editorial-research-magazine.png' },
  { id: 'B', source: 'b-equipment.html', output: 'B-dark-hifi-equipment.png' },
  { id: 'C', source: 'c-analog.html', output: 'C-warm-analog-photo-zine.png' },
  { id: 'D', source: 'd-storm-city.html', output: 'D-storm-city-observer.png' }
];

await mkdir(outputDir, { recursive: true });
const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1 });
const reports = [];
let referenceText = '';

for (const prototype of prototypes) {
  const page = await context.newPage();
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  const sourcePath = resolve(root, 'prototypes', 'style-explorations', prototype.source);
  await page.goto(pathToFileURL(sourcePath).href, { waitUntil: 'load' });
  await Promise.race([
    page.evaluate(() => document.fonts.ready),
    page.waitForTimeout(2500)
  ]);

  const pageHeight = await page.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y < pageHeight; y += 700) {
    await page.evaluate((scrollY) => window.scrollTo(0, scrollY), y);
    await page.waitForTimeout(35);
  }
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(300);

  const metrics = await page.evaluate(() => {
    const h1 = document.querySelector('h1');
    if (!h1) throw new Error('缺少首页 H1');
    const style = getComputedStyle(h1);
    const lineHeight = Number.parseFloat(style.lineHeight);
    const lines = Math.round(h1.getBoundingClientRect().height / lineHeight);
    const text = (document.body.textContent ?? '').replace(/\s+/g, ' ').trim();
    return {
      width: document.documentElement.scrollWidth,
      viewportWidth: window.innerWidth,
      height: document.documentElement.scrollHeight,
      h1: h1.textContent?.trim(),
      h1Lines: lines,
      text
    };
  });

  if (metrics.width > metrics.viewportWidth) throw new Error(`${prototype.id} 存在横向溢出：${metrics.width}px`);
  if (metrics.h1 !== '欢迎来到我的个人网站') throw new Error(`${prototype.id} 首页标题不正确`);
  if (metrics.h1Lines > 2) throw new Error(`${prototype.id} 首页标题超过两行：${metrics.h1Lines}`);
  if (referenceText && metrics.text !== referenceText) {
    const mismatch = [...referenceText].findIndex((char, index) => char !== [...metrics.text][index]);
    throw new Error(`${prototype.id} 与 A 版内容不一致，首个差异位置 ${mismatch}：A=${referenceText.slice(mismatch, mismatch + 80)}；当前=${metrics.text.slice(mismatch, mismatch + 80)}`);
  }
  referenceText ||= metrics.text;

  const outputPath = resolve(outputDir, prototype.output);
  await page.screenshot({ path: outputPath, fullPage: true });
  reports.push({
    variant: prototype.id,
    screenshot: prototype.output,
    width: metrics.viewportWidth,
    height: metrics.height,
    h1Lines: metrics.h1Lines,
    horizontalOverflow: false,
    pageErrors: errors
  });
  await page.close();
}

await browser.close();
if (reports.some((report) => report.pageErrors.length)) {
  throw new Error(`页面脚本错误：${JSON.stringify(reports, null, 2)}`);
}
await writeFile(resolve(outputDir, 'report.json'), `${JSON.stringify(reports, null, 2)}\n`, 'utf8');
console.log(JSON.stringify(reports, null, 2));
