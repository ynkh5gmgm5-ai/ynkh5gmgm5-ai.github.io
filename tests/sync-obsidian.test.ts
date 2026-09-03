import assert from 'node:assert/strict';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { buildSyncPlan, executeSyncPlan } from '../scripts/sync-obsidian/sync.ts';

async function createFixture() {
  const root = await mkdtemp(path.join(os.tmpdir(), 'hifi-site-sync-'));
  const vaultRoot = path.join(root, 'vault');
  const projectRoot = path.join(root, 'project');
  await mkdir(path.join(vaultRoot, '网站发布', '行业研究'), { recursive: true });
  await mkdir(path.join(projectRoot, 'src', 'content', 'research'), { recursive: true });
  await writeFile(path.join(vaultRoot, 'cover.png'), 'fixture-image');
  return { root, vaultRoot, projectRoot };
}

function researchNote(options: { slug: string; title: string; body?: string; publish?: boolean; preview?: boolean }) {
  return `---
publish: ${options.publish ?? true}
preview: ${options.preview ?? false}
featured: false
title: ${options.title}
slug: ${options.slug}
topic: market-competition
researchQuestion: 测试问题
summary: 测试摘要
conclusions:
  - 结论一
  - 结论二
  - 结论三
publishedAt: 2026-08-27
updatedAt: 2026-08-27
researchDate: 2026-08-27
scope: 仅用于自动测试
cover: cover.png
coverAlt: 测试图片
sources:
  - label: 测试来源
    url: https://example.com/source
---

${options.body ?? '测试正文'}
`;
}

test('只同步明确发布的笔记，并转换 Wikilink、图片和 Callout', async (t) => {
  const fixture = await createFixture();
  t.after(() => rm(fixture.root, { recursive: true, force: true }));
  const researchDirectory = path.join(fixture.vaultRoot, '网站发布', '行业研究');

  await writeFile(path.join(researchDirectory, 'second.md'), researchNote({ slug: 'second', title: '第二份研究' }));
  await writeFile(path.join(researchDirectory, 'first.md'), researchNote({
    slug: 'first',
    title: '第一份研究',
    body: '> [!note] 证据边界\n> 测试说明\n\n[[second|相关研究]]\n\n![[cover.png|测试图片]]',
  }));
  await writeFile(path.join(researchDirectory, 'private.md'), researchNote({ slug: 'private', title: '私人草稿', publish: false }));

  const plan = await buildSyncPlan({ vaultRoot: fixture.vaultRoot, projectRoot: fixture.projectRoot });
  assert.equal(plan.syncedNotes.length, 2);
  assert.equal(plan.syncedNotes.some((note) => note.source === '行业研究/private.md'), false);

  const firstWrite = plan.operations.find((operation) => operation.destination.endsWith(`${path.sep}first.md`));
  assert.ok(firstWrite?.content?.includes('[相关研究](/research/second/)'));
  assert.ok(firstWrite?.content?.includes('![测试图片](../_assets/'));
  assert.ok(firstWrite?.content?.includes('> [!note] 证据边界'));

  await executeSyncPlan(plan);
  const output = await readFile(path.join(fixture.projectRoot, 'src', 'content', 'research', 'first.md'), 'utf8');
  assert.ok(output.includes('/research/second/'));
  const manifest = await readFile(path.join(fixture.projectRoot, 'src', 'content', '.obsidian-sync-manifest.json'), 'utf8');
  assert.ok(manifest.includes('src/content/research/first.md'));
});

test('公开笔记引用未发布笔记时阻止同步', async (t) => {
  const fixture = await createFixture();
  t.after(() => rm(fixture.root, { recursive: true, force: true }));
  const researchDirectory = path.join(fixture.vaultRoot, '网站发布', '行业研究');

  await writeFile(path.join(researchDirectory, 'public.md'), researchNote({ slug: 'public', title: '公开研究', body: '[[private]]' }));
  await writeFile(path.join(researchDirectory, 'private.md'), researchNote({ slug: 'private', title: '私人草稿', publish: false }));

  await assert.rejects(
    buildSyncPlan({ vaultRoot: fixture.vaultRoot, projectRoot: fixture.projectRoot }),
    /未进入本次同步或属于私人内容/,
  );
});

test('预览稿只进入本地同步，不进入正式构建', async (t) => {
  const fixture = await createFixture();
  t.after(() => rm(fixture.root, { recursive: true, force: true }));
  const researchDirectory = path.join(fixture.vaultRoot, '网站发布', '行业研究');
  await writeFile(path.join(researchDirectory, 'preview.md'), researchNote({
    slug: 'preview',
    title: '预览研究',
    publish: false,
    preview: true,
  }).replace('publishedAt: 2026-08-27\n', ''));

  const previewPlan = await buildSyncPlan({ vaultRoot: fixture.vaultRoot, projectRoot: fixture.projectRoot });
  assert.equal(previewPlan.syncedNotes.length, 1);
  assert.equal(previewPlan.syncedNotes[0]?.status, 'preview');

  const productionPlan = await buildSyncPlan({
    vaultRoot: fixture.vaultRoot,
    projectRoot: fixture.projectRoot,
    production: true,
  });
  assert.equal(productionPlan.syncedNotes.length, 0);
});

test('网站排除项不会被同步，并会移除指向它的链接', async (t) => {
  const fixture = await createFixture();
  t.after(() => rm(fixture.root, { recursive: true, force: true }));
  const researchDirectory = path.join(fixture.vaultRoot, '网站发布', '行业研究');

  await writeFile(path.join(researchDirectory, '中国Hi-Fi行业销售经理研究.md'), researchNote({
    slug: 'china-hifi-sales-manager',
    title: '中国 Hi-Fi 行业销售经理研究',
  }));
  await writeFile(path.join(researchDirectory, 'public.md'), researchNote({
    slug: 'public',
    title: '公开研究',
    body: '[[中国Hi-Fi行业销售经理研究|已移除研究]]\n\n- [[中国Hi-Fi行业销售经理研究]] — 删除条目\n\n[直接链接](/research/china-hifi-sales-manager/)',
  }));
  await mkdir(path.join(fixture.projectRoot, 'src', 'content'), { recursive: true });
  await writeFile(
    path.join(fixture.projectRoot, 'src', 'content', '.obsidian-sync-manifest.json'),
    JSON.stringify({ files: ['src/content/research/china-hifi-sales-manager.md'] }),
  );

  const plan = await buildSyncPlan({ vaultRoot: fixture.vaultRoot, projectRoot: fixture.projectRoot });
  assert.equal(plan.syncedNotes.length, 1);
  assert.deepEqual(plan.staleFiles.map((file) => path.basename(file)), ['china-hifi-sales-manager.md']);
  const publicWrite = plan.operations.find((operation) => operation.destination.endsWith(`${path.sep}public.md`));
  assert.ok(publicWrite?.content?.includes('已移除研究'));
  assert.ok(publicWrite?.content?.includes('直接链接'));
  assert.equal(publicWrite?.content?.includes('删除条目'), false);
  assert.equal(publicWrite?.content?.includes('/research/china-hifi-sales-manager/'), false);

  await executeSyncPlan(plan);
  await assert.rejects(readFile(path.join(fixture.projectRoot, 'src', 'content', 'research', 'china-hifi-sales-manager.md')));
});

test('正式模式阻止待补充内容', async (t) => {
  const fixture = await createFixture();
  t.after(() => rm(fixture.root, { recursive: true, force: true }));
  const researchDirectory = path.join(fixture.vaultRoot, '网站发布', '行业研究');
  await writeFile(path.join(researchDirectory, 'draft.md'), researchNote({ slug: 'draft', title: '待补充测试' }));

  await assert.rejects(
    buildSyncPlan({ vaultRoot: fixture.vaultRoot, projectRoot: fixture.projectRoot, production: true }),
    /待补充/,
  );
});

test('发布区不存在时不会自动创建', async (t) => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'hifi-site-sync-missing-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  const vaultRoot = path.join(root, 'vault');
  const projectRoot = path.join(root, 'project');
  await mkdir(vaultRoot, { recursive: true });
  await mkdir(projectRoot, { recursive: true });

  await assert.rejects(buildSyncPlan({ vaultRoot, projectRoot }), /未找到发布区/);
});
