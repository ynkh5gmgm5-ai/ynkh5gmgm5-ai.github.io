import { readFileSync, writeFileSync } from 'node:fs';

const base = 'D:/我的文档/Documents/ChatGPT/个人网站/src/content/';
const PUB_DATE = '2026-09-03';

const groups = {
  research: [
    'china-hifi-competition-price-map.md',
    'hifi-channel-entry-strategy.md',
    'hifi-new-user-pc-channel-growth.md',
    'hifi-user-needs-product-opportunities.md',
    'shanling-sku-user-positioning.md',
    'street-listening-marketing.md',
  ],
  listening: ['hifiman-ef500-edxs.md', 'oxygen-oxygen.md'],
  'field-notes': ['chongqing-changsha-hifi-meetup.md'],
  photography: ['snapshots.md'],
  profile: ['profile.md'],
};

function publish(file, addPublishedAt) {
  const text = readFileSync(file, 'utf8');
  const m = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n/);
  if (!m) { console.log('NO FM:', file); return; }
  let fm = m[1];
  const lines = fm.split(/\r?\n/).filter((l) => l.trim() !== 'preview: true' && l.trim() !== 'preview: false');
  const out = [];
  for (const l of lines) {
    if (l.trim() === 'publish: false') {
      out.push('publish: true');
      if (addPublishedAt && !lines.some((x) => x.trim().startsWith('publishedAt:'))) {
        out.push(`publishedAt: ${PUB_DATE}`);
      }
    } else {
      out.push(l);
    }
  }
  fm = out.join('\n');
  const updated = text.replace(m[1], fm);
  writeFileSync(file, updated, 'utf8');
  const name = file.split('/').pop();
  // 简单回读校验
  const check = readFileSync(file, 'utf8');
  console.log(name, '| publish:true:', check.includes('publish: true'), '| preview removed:', !check.includes('preview: true'), addPublishedAt ? '| publishedAt:' + check.includes('publishedAt:') : '');
}

for (const [collection, files] of Object.entries(groups)) {
  const addDate = collection === 'research' || collection === 'listening' || collection === 'field-notes';
  for (const f of files) {
    publish(base + collection + '/' + f, addDate);
  }
}
console.log('done');
