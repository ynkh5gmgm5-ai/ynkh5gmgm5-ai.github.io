import { chromium } from '@playwright/test';

const OUT = 'C:/Users/Administrator/AppData/Local/Temp/vision_check2';
import { mkdirSync } from 'node:fs';
mkdirSync(OUT, { recursive: true });

const base = 'http://localhost:4321';
const pages = [
  ['home-full', '/'],
  ['research', '/research/'],
  ['listening', '/listening/'],
  ['listening-over-ear', '/listening/over-ear/'],
  ['listening-in-ear', '/listening/in-ear/'],
  ['listening-detail', '/listening/in-ear/oxygen-oxygen/'],
  ['photography', '/photography/'],
  ['about', '/about/'],
];

const browser = await chromium.launch();

// 桌面端 + reduced motion
const ctxD = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
const pageD = await ctxD.newPage();
for (const [name, path] of pages) {
  await pageD.goto(base + path, { waitUntil: 'networkidle' });
  await pageD.waitForTimeout(500);
  await pageD.screenshot({ path: `${OUT}/desktop_${name}.png`, fullPage: true });
  console.log('D saved', name);
}

// 移动端 + reduced motion
const ctxM = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, reducedMotion: 'reduce' });
const pageM = await ctxM.newPage();
for (const [name, path] of pages.slice(0, 7)) {
  await pageM.goto(base + path, { waitUntil: 'networkidle' });
  await pageM.waitForTimeout(500);
  await pageM.screenshot({ path: `${OUT}/mobile_${name}.png`, fullPage: true });
  console.log('M saved', name);
}

await browser.close();
