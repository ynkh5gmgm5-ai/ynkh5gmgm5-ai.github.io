import path from 'node:path';
import type { SyncCollection } from './schema.ts';

export interface RouteConfig {
  collection: SyncCollection;
  outputDirectory: string;
  urlBase: string;
  inject?: Record<string, unknown>;
  singleton?: boolean;
}

const routes: Array<{ prefix: string; config: RouteConfig }> = [
  { prefix: '行业研究/', config: { collection: 'research', outputDirectory: 'research', urlBase: '/research/' } },
  { prefix: '试听档案/大耳/', config: { collection: 'listening', outputDirectory: 'listening', urlBase: '/listening/over-ear/', inject: { kind: 'over-ear' } } },
  { prefix: '试听档案/入耳/', config: { collection: 'listening', outputDirectory: 'listening', urlBase: '/listening/in-ear/', inject: { kind: 'in-ear' } } },
  { prefix: '试听档案/闪击探店与展会蹭听/', config: { collection: 'field-notes', outputDirectory: 'field-notes', urlBase: '/listening/field-notes/' } },
  { prefix: '摄影/', config: { collection: 'photography', outputDirectory: 'photography', urlBase: '/photography/', singleton: true } },
  { prefix: '关于/', config: { collection: 'profile', outputDirectory: 'profile', urlBase: '/about/', singleton: true } },
];

export function normalizeVaultPath(filePath: string) {
  return filePath.split(path.sep).join('/');
}

export function resolveRoute(relativeNotePath: string): RouteConfig | undefined {
  const normalized = normalizeVaultPath(relativeNotePath);
  if (normalized === '首页.md') {
    return { collection: 'homepage', outputDirectory: 'homepage', urlBase: '/', singleton: true };
  }
  return routes.find((route) => normalized.startsWith(route.prefix))?.config;
}

export const publicationDirectory = '网站发布';
export const imageExtensions = new Set(['.jpg', '.jpeg', '.png', '.webp', '.avif', '.gif']);

// 网站侧排除项：保留 Obsidian 原文，但不进入本地预览或正式构建。
export const excludedWebsiteResearchSlugs = new Set(['china-hifi-sales-manager']);
