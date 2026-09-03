import { z } from 'zod';

const slug = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, '路径标识只能包含小写字母、数字和连字号。');
const imagePath = z.string().min(1);
const dated = z.union([z.string().min(1), z.date()]);
const base = {
  publish: z.boolean(),
  preview: z.boolean().optional().default(false),
  featured: z.boolean().optional().default(false),
};

const photoNote = z.object({
  image: imagePath,
  alt: z.string().min(1, '每张公开图片必须有可访问性描述。'),
  note: z.string().optional(),
});

const schemas = {
  research: z.object({
    ...base,
    title: z.string().min(1),
    slug,
    topic: z.enum(['market-competition', 'product-user', 'channel-growth']),
    researchQuestion: z.string().min(1),
    summary: z.string().min(1),
    conclusions: z.array(z.string().min(1)).length(3),
    publishedAt: dated.optional(),
    updatedAt: dated,
    researchDate: z
      .union([z.string().min(1), z.date()])
      .transform((value) => (value instanceof Date ? value.toISOString().slice(0, 10) : value)),
    scope: z.string().min(1),
    cover: imagePath.optional(),
    coverAlt: z.string().min(1).optional(),
    sources: z.array(z.object({ label: z.string().min(1), url: z.url().optional(), accessedAt: dated.optional() })).min(1),
  }).catchall(z.unknown()).superRefine((data, context) => {
    if (data.cover && !data.coverAlt) {
      context.addIssue({ code: 'custom', path: ['coverAlt'], message: '封面图存在时必须填写可访问性描述。' });
    }
  }),
  listening: z.object({
    ...base,
    kind: z.enum(['over-ear', 'in-ear']),
    slug,
    brand: z.string().min(1),
    model: z.string().min(1),
    date: dated,
    publishedAt: dated.optional(),
    updatedAt: dated,
    cover: imagePath,
    coverAlt: z.string().min(1),
    impression: z.string().min(1),
    traits: z.array(z.string()).optional().default([]),
    photoNotes: z.array(photoNote).min(1),
  }).catchall(z.unknown()),
  'field-notes': z.object({
    ...base,
    kind: z.enum(['store-visit', 'exhibition']),
    slug,
    title: z.string().min(1),
    date: dated,
    publishedAt: dated.optional(),
    updatedAt: dated,
    city: z.string().min(1),
    cover: imagePath,
    coverAlt: z.string().min(1),
    overallImpression: z.string().min(1),
    photoNotes: z.array(photoNote).min(1),
  }).catchall(z.unknown()),
  photography: z.object({
    publish: z.boolean(),
    preview: z.boolean().optional().default(false),
    title: z.string().min(1),
    updatedAt: dated,
    photos: z.array(z.object({ image: imagePath, alt: z.string().min(1) })).min(1),
  }).catchall(z.unknown()),
  profile: z.object({
    publish: z.boolean(),
    preview: z.boolean().optional().default(false),
    name: z.string().min(1),
    role: z.string().min(1),
    biography: z.string().min(1),
    platforms: z.array(z.object({
      platform: z.string().min(1),
      accountName: z.string().min(1),
      direction: z.string().min(1),
      url: z.url(),
      qrCode: z.string().optional(),
    })).optional().default([]),
    contacts: z.array(z.object({
      label: z.string().min(1),
      value: z.string().min(1),
      href: z.string().optional(),
    })).optional().default([]),
    resume: z.object({ path: z.string().regex(/\.pdf$/i), updatedAt: dated }).optional(),
  }).catchall(z.unknown()),
  homepage: z.object({
    publish: z.boolean(),
    preview: z.boolean().optional().default(false),
    authorName: z.string().min(1),
    role: z.string().min(1),
    statement: z.string().min(1),
    heroImage: imagePath,
    heroImageAlt: z.string().min(1),
    currentFocus: z.object({
      title: z.string().min(1),
      summary: z.string().min(1),
      relatedResearch: z.array(z.string()).optional().default([]),
      relatedListening: z.array(z.string()).optional().default([]),
      relatedFieldNotes: z.array(z.string()).optional().default([]),
    }),
    featuredResearch: z.array(z.string()).length(3),
    featuredListening: z.array(z.string()).max(2).optional().default([]),
  }).catchall(z.unknown()),
} as const;

export type SyncCollection = keyof typeof schemas;

export function validateFrontmatter(collection: SyncCollection, data: unknown, notePath: string) {
  const result = schemas[collection].safeParse(data);
  if (result.success) {
    const validated = result.data as Record<string, unknown>;
    if (validated.publish === true && !validated.publishedAt && ['research', 'listening', 'field-notes'].includes(collection)) {
      throw new Error(`${notePath} 内容字段校验失败：publishedAt: 正式发布时必须填写发布日期。`);
    }
    return validated;
  }

  const details = result.error.issues
    .map((issue) => `${issue.path.join('.') || '根字段'}: ${issue.message}`)
    .join('；');
  throw new Error(`${notePath} 内容字段校验失败：${details}`);
}
