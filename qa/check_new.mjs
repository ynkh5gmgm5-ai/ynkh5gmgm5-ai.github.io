import { chromium } from '@playwright/test';

const OUT = 'C:/Users/Administrator/AppData/Local/Temp/vision_new';
import { mkdirSync } from 'node:fs';
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
const page = await ctx.newPage();
const errs = [];
page.on('pageerror', e => errs.push('PAGEERR ' + e.message));
page.on('response', r => { if (r.status() >= 400) errs.push('HTTP' + r.status() + ' ' + r.url()); });

// 首页 hero 背景
await page.goto('http://localhost:4321/', { waitUntil: 'networkidle' });
await page.waitForTimeout(1000);
const hero = await page.evaluate(() => {
  const h = document.querySelector('.home-hero');
  const cs = getComputedStyle(h);
  return { bgImage: cs.backgroundImage.slice(0, 200), color: cs.color };
});
console.log('HERO:', JSON.stringify(hero, null, 1));
await page.screenshot({ path: OUT + '/home_hero.png' });

// field-notes 页面
await page.goto('http://localhost:4321/listening/field-notes/', { waitUntil: 'networkidle' });
await page.waitForTimeout(800);
const notes = await page.evaluate(() => {
  return {
    title: document.querySelector('h1')?.textContent,
    text: document.querySelector('main')?.textContent.replace(/\s+/g, ' ').slice(0, 200),
    imgs: [...document.querySelectorAll('img')].map(i => ({ alt: i.alt.slice(0, 30), w: Math.round(i.getBoundingClientRect().width) })),
  };
});
console.log('FIELDNODES:', JSON.stringify(notes, null, 1));
await page.screenshot({ path: OUT + '/fieldnotes.png' });
console.log('ERRORS:', errs.length ? errs.join('\n') : 'none');
await browser.close();
