import { chromium } from '@playwright/test';

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
const page = await ctx.newPage();

const paths = ['/', '/research/', '/research/china-hifi-competition-price-map/', '/listening/', '/listening/over-ear/', '/listening/in-ear/oxygen-oxygen/', '/photography/', '/about/'];

for (const p of paths) {
  await page.goto('http://localhost:4321' + p, { waitUntil: 'networkidle' });
  await page.waitForTimeout(600);
  const r = await page.evaluate((path) => {
    const de = document.documentElement;
    const docW = de.scrollWidth;
    const winW = window.innerWidth;
    // 找出超出视口右缘的元素
    const offenders = [];
    for (const el of document.querySelectorAll('h1,h2,h3,p,a,strong,span,nav,section,div')) {
      const b = el.getBoundingClientRect();
      if (b.right > winW + 1 && b.width > 0) {
        const t = (el.textContent || '').trim().slice(0, 25);
        if (t) offenders.push({ tag: el.tagName, text: t, right: Math.round(b.right), left: Math.round(b.left), w: Math.round(b.width) });
      }
    }
    offenders.sort((a, b) => b.right - a.right);
    return { path, docW, winW, overflow: docW > winW, offenders: offenders.slice(0, 12) };
  }, p);
  console.log(JSON.stringify(r));
}
await browser.close();
