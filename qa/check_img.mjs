import { chromium } from '@playwright/test';

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
const page = await ctx.newPage();
const errs = [];
page.on('pageerror', e => errs.push('PAGEERR ' + e.message));
page.on('console', m => { if (m.type() === 'error') errs.push('CONSOLE ' + m.text()); });
page.on('requestfailed', r => errs.push('REQFAIL ' + r.url() + ' ' + (r.failure()?.errorText || '')));
page.on('response', r => { if (r.status() >= 400) errs.push('HTTP' + r.status() + ' ' + r.url()); });

await page.goto('http://localhost:4321/listening/in-ear/oxygen-oxygen/', { waitUntil: 'networkidle' });
await page.waitForTimeout(1000);

const imgs = await page.evaluate(() => {
  return [...document.querySelectorAll('img')].map(img => {
    const r = img.getBoundingClientRect();
    return {
      src: img.src,
      w: Math.round(r.width), h: Math.round(r.height),
      top: Math.round(r.top + scrollY), left: Math.round(r.left),
      loaded: img.complete && img.naturalWidth > 0,
      natural: img.naturalWidth + 'x' + img.naturalHeight,
      display: getComputedStyle(img).display,
      visibility: getComputedStyle(img).visibility,
      opacity: getComputedStyle(img).opacity,
    };
  });
});
console.log('IMGS:', JSON.stringify(imgs, null, 1));
console.log('ERRORS:', errs.length ? errs.join('\n') : 'none');
await browser.close();
