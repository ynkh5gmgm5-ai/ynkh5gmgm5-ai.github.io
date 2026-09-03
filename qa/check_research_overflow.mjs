import { chromium } from '@playwright/test';

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
const page = await ctx.newPage();

const slugs = [
  'china-hifi-competition-price-map',
  'hifi-channel-entry-strategy',
  'hifi-new-user-pc-channel-growth',
  'hifi-user-needs-product-opportunities',
  'shanling-sku-user-positioning',
  'street-listening-marketing',
];

for (const slug of slugs) {
  await page.goto('http://localhost:4321/research/' + slug + '/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);
  const r = await page.evaluate((path) => {
    const de = document.documentElement;
    const winW = window.innerWidth;
    const offenders = [];
    for (const el of document.querySelectorAll('a,td,th,code,pre,blockquote,div,span')) {
      const b = el.getBoundingClientRect();
      if (b.right > winW + 1 && b.width > 0) {
        const t = (el.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 40);
        if (t) offenders.push({ tag: el.tagName, cls: (el.className || '').toString().slice(0, 20), text: t, right: Math.round(b.right), w: Math.round(b.width) });
      }
    }
    offenders.sort((a, b) => b.right - a.right);
    const tbls = [...document.querySelectorAll('.article-body table')].map(t => {
      const r2 = t.getBoundingClientRect();
      return { w: Math.round(r2.width), scrollW: t.scrollWidth, hasScroll: t.scrollWidth > r2.width };
    });
    return { path, docW: de.scrollWidth, winW, overflow: de.scrollWidth > winW, offenders: offenders.slice(0, 6), tables: tbls.slice(0, 5) };
  }, slug);
  console.log(slug, JSON.stringify(r));
}
await browser.close();
