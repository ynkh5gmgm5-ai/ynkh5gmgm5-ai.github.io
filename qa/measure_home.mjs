import { chromium } from '@playwright/test';

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
await page.goto('http://localhost:4321/', { waitUntil: 'networkidle' });
await page.waitForTimeout(800);

// 定位所有 section 和关键元素的位置
const info = await page.evaluate(() => {
  const out = [];
  const sections = document.querySelectorAll('section');
  for (const s of sections) {
    const r = s.getBoundingClientRect();
    const h2 = s.querySelector('h2');
    const h3s = [...s.querySelectorAll('h3')].map(h => h.textContent.trim().slice(0, 30));
    out.push({
      section: s.getAttribute('aria-labelledby') || s.getAttribute('aria-label') || s.className.slice(0, 40),
      top: Math.round(r.top + scrollY),
      height: Math.round(r.height),
      h2: h2 ? h2.textContent.trim() : null,
      h3: h3s,
    });
  }
  // 各 h1/h2 文本
  const headings = [...document.querySelectorAll('h1,h2,h3')].map(h => ({
    tag: h.tagName,
    text: h.textContent.trim().slice(0, 40),
    top: Math.round(h.getBoundingClientRect().top + scrollY),
  }));
  const empty = [...document.querySelectorAll('[role="status"]')].map(e => ({
    text: e.textContent.trim().slice(0, 40),
    top: Math.round(e.getBoundingClientRect().top + scrollY),
    rect: (() => { const r = e.getBoundingClientRect(); return { top: Math.round(r.top + scrollY), h: Math.round(r.height) }; })(),
  }));
  return { sections: out, headings, empty, scrollHeight: document.documentElement.scrollHeight };
});
console.log(JSON.stringify(info, null, 1));

await browser.close();
