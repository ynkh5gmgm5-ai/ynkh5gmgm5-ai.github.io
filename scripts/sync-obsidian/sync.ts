import { createHash } from 'node:crypto';
import { access, copyFile, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import matter from 'gray-matter';
import {
  excludedWebsiteResearchSlugs,
  imageExtensions,
  normalizeVaultPath,
  publicationDirectory,
  resolveRoute,
  type RouteConfig,
} from './config.ts';
import { validateFrontmatter } from './schema.ts';

interface NoteRecord {
  absolutePath: string;
  relativePath: string;
  data: Record<string, unknown>;
  body: string;
  published: boolean;
  preview: boolean;
  selected: boolean;
  excluded: boolean;
  route?: RouteConfig;
  slug?: string;
  url?: string;
}

export interface SyncOperation {
  source?: string;
  destination: string;
  content?: string;
  kind: 'write' | 'copy';
}

export interface SyncPlan {
  operations: SyncOperation[];
  staleFiles: string[];
  syncedNotes: Array<{ source: string; destination: string; url: string; status: 'published' | 'preview' }>;
  manifestPath: string;
  projectRoot: string;
}

export interface BuildSyncPlanOptions {
  vaultRoot: string;
  projectRoot: string;
  production?: boolean;
}

const excludedDirectories = new Set(['.obsidian', '.trash', '.git', 'node_modules']);
const manifestName = '.obsidian-sync-manifest.json';

async function exists(filePath: string) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

function ensureWithin(root: string, candidate: string, label: string) {
  const resolvedRoot = path.resolve(root);
  const resolvedCandidate = path.resolve(candidate);
  const relative = path.relative(resolvedRoot, resolvedCandidate);
  if (relative.startsWith('..') || path.isAbsolute(relative)) {
    throw new Error(`${label}越出允许目录：${resolvedCandidate}`);
  }
  return resolvedCandidate;
}

async function walk(root: string, current = root): Promise<string[]> {
  const entries = await readdir(current, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    if (entry.isDirectory() && excludedDirectories.has(entry.name)) continue;
    const absolute = path.join(current, entry.name);
    if (entry.isDirectory()) files.push(...(await walk(root, absolute)));
    else if (entry.isFile()) files.push(absolute);
  }
  return files;
}

function sanitizeFileName(fileName: string) {
  const extension = path.extname(fileName).toLowerCase();
  const base = path.basename(fileName, path.extname(fileName))
    .normalize('NFKD')
    .replace(/[^a-zA-Z0-9\u4e00-\u9fff]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'asset';
  return `${base}${extension}`;
}

function stripNoteExtension(value: string) {
  return normalizeVaultPath(value).replace(/\.md$/i, '').replace(/^\.\//, '');
}

function noteKey(value: string) {
  return stripNoteExtension(value).toLocaleLowerCase('zh-CN');
}

function headingAnchor(heading: string) {
  return heading.trim().toLocaleLowerCase('zh-CN').replace(/\s+/g, '-');
}

function removeExcludedReferences(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value
      .filter((item) => !(typeof item === 'string' && excludedWebsiteResearchSlugs.has(item)))
      .map((item) => removeExcludedReferences(item));
  }
  if (value && typeof value === 'object' && !(value instanceof Date)) {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, removeExcludedReferences(item)]));
  }
  return value;
}

function stripExcludedLinks(body: string) {
  let result = body;
  for (const slug of excludedWebsiteResearchSlugs) {
    const escapedSlug = slug.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    result = result.replace(
      new RegExp(`^\\s*[-*+]\\s+!?\\[\\[${escapedSlug}(?:\\|[^\\]]+)?\\]\\].*\\r?$`, 'gm'),
      '',
    );
    result = result.replace(
      new RegExp(`^\\s*[-*+]\\s+\\[[^\\]]+\\]\\(/research/${escapedSlug}/?(?:#[^)]+)?\\).*\\r?$`, 'gm'),
      '',
    );
    result = result.replace(
      new RegExp(`\\[([^\\]]+)\\]\\(/research/${escapedSlug}/?(?:#[^)]+)?\\)`, 'g'),
      '$1',
    );
  }
  return result;
}

async function replaceAsync(input: string, pattern: RegExp, replacer: (...args: string[]) => Promise<string>) {
  const matches = [...input.matchAll(pattern)];
  let result = '';
  let cursor = 0;
  for (const match of matches) {
    result += input.slice(cursor, match.index);
    result += await replacer(...(match as unknown as string[]));
    cursor = (match.index ?? 0) + match[0].length;
  }
  return result + input.slice(cursor);
}

function outputRelativePath(projectRoot: string, destination: string) {
  return normalizeVaultPath(path.relative(projectRoot, destination));
}

async function readPreviousManifest(manifestPath: string) {
  if (!(await exists(manifestPath))) return [] as string[];
  const raw = JSON.parse(await readFile(manifestPath, 'utf8')) as { files?: unknown };
  if (!Array.isArray(raw.files) || raw.files.some((item) => typeof item !== 'string')) {
    throw new Error(`同步清单格式无效：${manifestPath}`);
  }
  return raw.files as string[];
}

export async function buildSyncPlan(options: BuildSyncPlanOptions): Promise<SyncPlan> {
  const vaultRoot = path.resolve(options.vaultRoot);
  const projectRoot = path.resolve(options.projectRoot);
  const publicationRoot = path.join(vaultRoot, publicationDirectory);
  const contentRoot = path.join(projectRoot, 'src', 'content');
  const assetRoot = path.join(contentRoot, '_assets');
  const manifestPath = path.join(contentRoot, manifestName);

  if (!(await exists(publicationRoot))) {
    throw new Error(`未找到发布区：${publicationRoot}。不会自动创建或移动 Vault 内容。`);
  }

  const publicationFiles = await walk(publicationRoot);
  const noteFiles = publicationFiles.filter((file) => path.extname(file).toLowerCase() === '.md');
  const notes: NoteRecord[] = [];

  for (const absolutePath of noteFiles) {
    const parsed = matter(await readFile(absolutePath, 'utf8'));
    const relativePath = normalizeVaultPath(path.relative(publicationRoot, absolutePath));
    const route = resolveRoute(relativePath);
    const published = parsed.data.publish === true;
    const preview = parsed.data.preview === true;
    const excluded = route?.collection === 'research'
      && typeof parsed.data.slug === 'string'
      && excludedWebsiteResearchSlugs.has(parsed.data.slug);
    const selected = !excluded && (published || (!options.production && preview));
    if (selected && !route) throw new Error(`${relativePath} 已进入同步，但不在允许的网站栏目中。`);

    const injected = route?.inject ?? {};
    const data = { ...parsed.data, ...injected } as Record<string, unknown>;
    const slug = route?.singleton ? 'index' : typeof data.slug === 'string' ? data.slug : undefined;
    const url = selected && route && slug
      ? route.singleton ? route.urlBase : `${route.urlBase}${slug}/`
      : undefined;
    notes.push({ absolutePath, relativePath, data, body: parsed.content, published, preview, selected, excluded, route, slug, url });
  }

  const notesByRelative = new Map<string, NoteRecord>();
  const notesByName = new Map<string, NoteRecord[]>();
  for (const note of notes) {
    notesByRelative.set(noteKey(note.relativePath), note);
    const name = noteKey(path.basename(note.relativePath));
    notesByName.set(name, [...(notesByName.get(name) ?? []), note]);
  }

  const vaultFiles = await walk(vaultRoot);
  const attachmentsByName = new Map<string, string[]>();
  for (const file of vaultFiles) {
    if (path.extname(file).toLowerCase() === '.md') continue;
    const key = path.basename(file).toLocaleLowerCase('zh-CN');
    attachmentsByName.set(key, [...(attachmentsByName.get(key) ?? []), file]);
  }

  const operations: SyncOperation[] = [];
  const syncedNotes: SyncPlan['syncedNotes'] = [];
  const destinations = new Set<string>();

  const addOperation = (operation: SyncOperation) => {
    const resolved = ensureWithin(projectRoot, operation.destination, '同步输出');
    if (destinations.has(resolved)) {
      const existing = operations.find((item) => path.resolve(item.destination) === resolved);
      if (existing && existing.source === operation.source && existing.kind === operation.kind) return;
      throw new Error(`多个公开内容将写入同一路径：${outputRelativePath(projectRoot, resolved)}`);
    }
    destinations.add(resolved);
    operations.push({ ...operation, destination: resolved });
  };

  const resolveAttachment = async (note: NoteRecord, rawTarget: string) => {
    const target = decodeURIComponent(rawTarget.split('#')[0].trim());
    const relativeCandidate = ensureWithin(vaultRoot, path.resolve(path.dirname(note.absolutePath), target), '附件引用');
    if (await exists(relativeCandidate)) return relativeCandidate;

    const rootCandidate = ensureWithin(vaultRoot, path.resolve(vaultRoot, target), '附件引用');
    if (await exists(rootCandidate)) return rootCandidate;

    const byName = attachmentsByName.get(path.basename(target).toLocaleLowerCase('zh-CN')) ?? [];
    if (byName.length === 1) return byName[0];
    if (byName.length > 1) throw new Error(`${note.relativePath} 的附件引用不唯一：${rawTarget}`);
    throw new Error(`${note.relativePath} 引用的附件不存在：${rawTarget}`);
  };

  const copyPublicFile = async (note: NoteRecord, rawTarget: string, outputFile: string, fieldPath: string) => {
    const source = await resolveAttachment(note, rawTarget);
    const extension = path.extname(source).toLowerCase();
    if (fieldPath === 'resume.path') {
      if (extension !== '.pdf') throw new Error(`${note.relativePath} 的简历必须是 PDF：${rawTarget}`);
      const destination = path.join(projectRoot, 'public', 'downloads', 'resume.pdf');
      addOperation({ kind: 'copy', source, destination });
      return '/downloads/resume.pdf';
    }
    if (!imageExtensions.has(extension)) {
      throw new Error(`${note.relativePath} 的公开图片格式不受支持：${rawTarget}`);
    }
    const buffer = await readFile(source);
    const hash = createHash('sha256').update(buffer).digest('hex').slice(0, 12);
    const destination = path.join(assetRoot, `${hash}-${sanitizeFileName(source)}`);
    addOperation({ kind: 'copy', source, destination });
    let relative = normalizeVaultPath(path.relative(path.dirname(outputFile), destination));
    if (!relative.startsWith('.')) relative = `./${relative}`;
    return relative;
  };

  const processData = async (value: unknown, note: NoteRecord, outputFile: string, keys: string[] = []): Promise<unknown> => {
    if (Array.isArray(value)) return Promise.all(value.map((item, index) => processData(item, note, outputFile, [...keys, String(index)])));
    if (value && typeof value === 'object' && !(value instanceof Date)) {
      const entries = await Promise.all(Object.entries(value).map(async ([key, item]) => [key, await processData(item, note, outputFile, [...keys, key])] as const));
      return Object.fromEntries(entries);
    }
    if (typeof value !== 'string') return value;
    const fieldPath = keys.filter((key) => !/^\d+$/.test(key)).join('.');
    const lastKey = keys.at(-1);
    const isImageField = ['cover', 'heroImage', 'image', 'qrCode'].includes(lastKey ?? '');
    const isResumePath = fieldPath === 'resume.path';
    if (!isImageField && !isResumePath) return value;
    return copyPublicFile(note, value, outputFile, fieldPath);
  };

  const resolveNoteLink = (note: NoteRecord, rawTarget: string) => {
    const [targetPart, heading] = rawTarget.split('#', 2);
    const normalized = noteKey(targetPart);
    let target = notesByRelative.get(normalized);
    if (!target) {
      const byName = notesByName.get(noteKey(path.basename(targetPart))) ?? [];
      if (byName.length > 1) throw new Error(`${note.relativePath} 的 Wikilink 指向不唯一：${rawTarget}`);
      target = byName[0];
    }
    if (!target) throw new Error(`${note.relativePath} 的 Wikilink 目标不存在：${rawTarget}`);
    if (target.excluded) return undefined;
    if (!target.selected || !target.url) throw new Error(`${note.relativePath} 引用了未进入本次同步或属于私人内容的笔记：${target.relativePath}`);
    return heading ? `${target.url}#${headingAnchor(heading)}` : target.url;
  };

  for (const note of notes.filter((item) => item.selected)) {
    if (!note.route || !note.slug || !note.url) throw new Error(`${note.relativePath} 缺少稳定路径标识 slug。`);
    const outputName = note.route.singleton ? 'index.md' : `${note.slug}.md`;
    const outputFile = path.join(contentRoot, note.route.outputDirectory, outputName);
    const injectedData = { ...note.data, ...(note.route.inject ?? {}) };
    const validated = validateFrontmatter(note.route.collection, injectedData, note.relativePath);
    const cleanedData = removeExcludedReferences(validated) as Record<string, unknown>;
    const processedData = await processData(cleanedData, note, outputFile) as Record<string, unknown>;

    let body = stripExcludedLinks(note.body);
    body = await replaceAsync(body, /(!)?\[\[([^\]]+)\]\]/g, async (_whole, embed, raw) => {
      const [target, label] = raw.split('|', 2).map((item) => item.trim());
      if (embed) {
        const extension = path.extname(target.split('#')[0]).toLowerCase();
        if (!imageExtensions.has(extension)) throw new Error(`${note.relativePath} 不允许嵌入另一篇笔记：${target}`);
        const source = await copyPublicFile(note, target, outputFile, 'body.image');
        return `![${label || path.basename(target, extension)}](${source})`;
      }
      const resolved = resolveNoteLink(note, target);
      if (resolved === undefined) return label ? label : '__EXCLUDED_WEBSITE_LINK__';
      return `[${label || target}](${resolved})`;
    });

    body = await replaceAsync(body, /!\[([^\]]*)\]\(([^)]+)\)/g, async (_whole, alt, rawTarget) => {
      if (/^(?:https?:|data:|\/)/i.test(rawTarget) || /(?:^|\/)_assets\//.test(rawTarget)) {
        if (/^https?:/i.test(rawTarget)) throw new Error(`${note.relativePath} 引用了未受控的远程图片：${rawTarget}`);
        return _whole;
      }
      const source = await copyPublicFile(note, rawTarget.trim(), outputFile, 'body.image');
      return `![${alt}](${source})`;
    });
    body = body.replace(/^\s*[-*+]\s*__EXCLUDED_WEBSITE_LINK__.*\r?$/gm, '');
    body = body.replaceAll('__EXCLUDED_WEBSITE_LINK__', '');
    body = stripExcludedLinks(body);

    const output = matter.stringify(body.trimStart(), processedData);
    if (/[A-Za-z]:\\/.test(output)) throw new Error(`${note.relativePath} 的公开输出包含本机绝对路径。`);
    if (options.production && output.includes('待补充')) throw new Error(`${note.relativePath} 仍包含“待补充”，不能进入正式构建。`);

    addOperation({ kind: 'write', destination: outputFile, content: output });
    syncedNotes.push({
      source: note.relativePath,
      destination: outputRelativePath(projectRoot, outputFile),
      url: note.url,
      status: note.published ? 'published' : 'preview',
    });
  }

  const newFiles = operations.map((operation) => outputRelativePath(projectRoot, operation.destination)).sort();
  const previousFiles = await readPreviousManifest(manifestPath);
  const staleFiles = previousFiles
    .filter((file) => !newFiles.includes(file))
    .map((file) => ensureWithin(projectRoot, path.join(projectRoot, file), '旧同步文件'));
  const manifestContent = `${JSON.stringify({ version: 1, files: newFiles }, null, 2)}\n`;
  addOperation({ kind: 'write', destination: manifestPath, content: manifestContent });

  return { operations, staleFiles, syncedNotes, manifestPath, projectRoot };
}

export async function executeSyncPlan(plan: SyncPlan) {
  for (const stale of plan.staleFiles) {
    if (await exists(stale)) await rm(stale, { force: true });
  }
  for (const operation of plan.operations) {
    await mkdir(path.dirname(operation.destination), { recursive: true });
    if (operation.kind === 'copy' && operation.source) await copyFile(operation.source, operation.destination);
    else if (operation.kind === 'write' && operation.content !== undefined) await writeFile(operation.destination, operation.content, 'utf8');
    else throw new Error(`无效的同步操作：${operation.destination}`);
  }
}
