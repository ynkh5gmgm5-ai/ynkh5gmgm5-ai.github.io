import { chromium } from '@playwright/test';
import { mkdirSync } from 'node:fs';

const OUT = 'C:/Users/Administrator/AppData/Local/Temp/vision_check';
mkdirSync(OUT, { recursive: true });

const base = 'http://localhost:4321';
const pages = [
  ['home-top', '/', 900],
  ['home-full', '/', 900],
  ['research', '/research/', 1400],
  ['research-detail', '/research/china-hifi-competition-price-map/', 1600],
  ['listening', '/listening/', 1400],
  ['listening-over-ear', '/listening/over-ear/', 1400],
  ['listening-in-ear', '/listening/in-ear/', 1400],
  ['listening-detail', '/listening/in-ear/oxygen-oxygen/', 1400],
  ['photography', '/photography/', 900],
  ['about', '/about/', 900],
];

const browser = await chromium.launch();

// 桌面端
const ctxD = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
const pageD = await ctxD.newPage();
const errorsD = [];
pageD.on('pageerror', e => errorsD.push('PAGEERROR: ' + e.message));
pageD.on('console', m => { if (m.type() === 'error') errorsD.push('CONSOLE: ' + m.text()); });

for (const [name, path] of pages) {
  await pageD.goto(base + path, { waitUntil: 'networkidle' });
  await pageD.waitForTimeout(800);
  if (name === 'home-top') {
    await pageD.screenshot({ path: `${OUT}/desktop_${name}.png` });
  } else {
    await pageD.screenshot({ path: `${OUT}/desktop_${name}.png`, fullPage: true, clip: undefined });
  }
  console.log('D saved', name);
}

// 移动端
const ctxM = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
const pageM = await ctxM.newPage();
for (const [name, path] of pages.slice(0, 6)) {
  await pageM.goto(base + path, { waitUntil: 'networkidle' });
  await pageM.waitForTimeout(600);
  await pageM.screenshot({ path: `${OUT}/mobile_${name}.png` });
  console.log('M saved', name);
}

console.log('ERRORS:', errorsD.length ? errorsD.join('\n') : 'none');
await browser.close();
