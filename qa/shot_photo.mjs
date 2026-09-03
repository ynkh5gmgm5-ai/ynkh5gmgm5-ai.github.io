import { chromium } from '@playwright/test';

const OUT = 'C:/Users/Administrator/AppData/Local/Temp/vision_photos';
import { mkdirSync } from 'node:fs';
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();
const ctxD = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
const pageD = await ctxD.newPage();
const errs = [];
pageD.on('pageerror', e => errs.push('PAGEERR ' + e.message));
pageD.on('response', r => { if (r.status() >= 400) errs.push('HTTP' + r.status() + ' ' + r.url()); });

await pageD.goto('http://localhost:4321/photography/', { waitUntil: 'networkidle' });
await pageD.waitForTimeout(1500);
await pageD.screenshot({ path: OUT + '/desktop_photo.png', fullPage: true });

// 检查图片数量和加载状态
const imgs = await pageD.evaluate(() => {
  return [...document.querySelectorAll('.photo-gallery img')].map(img => ({
    alt: (img.alt || '').slice(0, 20),
    w: Math.round(img.getBoundingClientRect().width),
    h: Math.round(img.getBoundingClientRect().height),
    loaded: img.complete && img.naturalWidth > 0,
  }));
});
console.log('IMAGES:', imgs.length);
console.log(JSON.stringify(imgs.slice(0, 12)));
console.log('ERRORS:', errs.length ? errs.join('\n') : 'none');

// 移动端
const ctxM = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, reducedMotion: 'reduce' });
const pageM = await ctxM.newPage();
await pageM.goto('http://localhost:4321/photography/', { waitUntil: 'networkidle' });
await pageM.waitForTimeout(1200);
await pageM.screenshot({ path: OUT + '/mobile_photo.png', fullPage: true });
console.log('mobile done');

await browser.close();
