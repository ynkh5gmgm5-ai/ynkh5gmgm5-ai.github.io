import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const publishFields = {
  publish: z.boolean().default(false),
  preview: z.boolean().default(false),
  featured: z.boolean().default(false),
  publishedAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date(),
};

const research = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/research' }),
  schema: ({ image }) =>
    z.object({
      ...publishFields,
      title: z.string().min(1),
      slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
      topic: z.enum(['market-competition', 'product-user', 'channel-growth']),
      researchQuestion: z.string().min(1),
      summary: z.string().min(1),
      conclusions: z.array(z.string().min(1)).length(3),
      researchDate: z
        .union([z.string().min(1), z.date()])
        .transform((value) => (value instanceof Date ? value.toISOString().slice(0, 10) : value)),
      scope: z.string().min(1),
      cover: image().optional(),
      coverAlt: z.string().min(1).optional(),
      sources: z
        .array(
          z.object({
            label: z.string().min(1),
            url: z.url().optional(),
            accessedAt: z.coerce.date().optional(),
          }),
        )
        .min(1),
      relatedResearch: z.array(z.string()).default([]),
      relatedListening: z.array(z.string()).default([]),
      relatedFieldNotes: z.array(z.string()).default([]),
    })
    .superRefine((data, context) => {
      if (data.cover && !data.coverAlt) {
        context.addIssue({
          code: 'custom',
          path: ['coverAlt'],
          message: '封面图存在时必须填写可访问性描述。',
        });
      }
      if (data.publish && !data.publishedAt) {
        context.addIssue({
          code: 'custom',
          path: ['publishedAt'],
          message: '正式发布时必须填写发布日期。',
        });
      }
    }),
});

const listening = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/listening' }),
  schema: ({ image }) =>
    z.object({
      ...publishFields,
      kind: z.enum(['over-ear', 'in-ear']),
      slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
      brand: z.string().min(1),
      model: z.string().min(1),
      date: z.coerce.date(),
      cover: image(),
      coverAlt: z.string().min(1),
      impression: z.string().min(1),
      traits: z.array(z.string().min(1)).default([]),
      context: z
        .object({
          location: z.string().optional(),
          player: z.string().optional(),
          amplifier: z.string().optional(),
          cable: z.string().optional(),
          duration: z.string().optional(),
        })
        .optional(),
      photoNotes: z
        .array(
          z.object({
            image: image(),
            alt: z.string().min(1),
            note: z.string().optional(),
          }),
        )
        .min(1),
      finalImpression: z
        .object({
          highlight: z.string().optional(),
          reservation: z.string().optional(),
          suitableFor: z.string().optional(),
        })
        .optional(),
      relatedListening: z.array(z.string()).default([]),
      relatedFieldNotes: z.array(z.string()).default([]),
      relatedResearch: z.array(z.string()).default([]),
    }),
});

const fieldNotes = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/field-notes' }),
  schema: ({ image }) =>
    z.object({
      ...publishFields,
      kind: z.enum(['store-visit', 'exhibition']),
      slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
      title: z.string().min(1),
      date: z.coerce.date(),
      city: z.string().min(1),
      cover: image(),
      coverAlt: z.string().min(1),
      overallImpression: z.string().min(1),
      photoNotes: z
        .array(
          z.object({
            image: image(),
            alt: z.string().min(1),
            note: z.string().optional(),
          }),
        )
        .min(1),
      featuredGear: z.array(z.string()).default([]),
      observations: z.array(z.string()).default([]),
      relatedListening: z.array(z.string()).default([]),
      relatedResearch: z.array(z.string()).default([]),
    }),
});

const photography = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/photography' }),
  schema: ({ image }) =>
    z.object({
      publish: z.boolean().default(false),
      preview: z.boolean().default(false),
      title: z.string().min(1),
      updatedAt: z.coerce.date(),
      photos: z
        .array(
          z.object({
            image: image(),
            alt: z.string().min(1),
          }),
        )
        .min(1),
    }),
});

const profile = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/profile' }),
  schema: z.object({
    publish: z.boolean().default(false),
    preview: z.boolean().default(false),
    name: z.string().min(1),
    role: z.string().min(1),
    biography: z.string().min(1),
    platforms: z
      .array(
        z.object({
          platform: z.string().min(1),
          accountName: z.string().min(1),
          direction: z.string().min(1),
          url: z.url(),
          qrCode: z.string().optional(),
        }),
      )
      .default([]),
    contacts: z
      .array(
        z.object({
          label: z.string().min(1),
          value: z.string().min(1),
          href: z.string().optional(),
        }),
      )
      .default([]),
    resume: z
      .object({
        path: z.string().regex(/\.pdf$/i),
        updatedAt: z.coerce.date(),
      })
      .optional(),
  }),
});

const homepage = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/homepage' }),
  schema: ({ image }) =>
    z.object({
      publish: z.boolean().default(false),
      preview: z.boolean().default(false),
      authorName: z.string().min(1),
      role: z.string().min(1),
      statement: z.string().min(1),
      heroImage: image(),
      heroImageAlt: z.string().min(1),
      currentFocus: z.object({
        title: z.string().min(1),
        summary: z.string().min(1),
        relatedResearch: z.array(z.string()).default([]),
        relatedListening: z.array(z.string()).default([]),
        relatedFieldNotes: z.array(z.string()).default([]),
      }),
      featuredResearch: z.array(z.string()).length(3),
      featuredListening: z.array(z.string()).max(2).default([]),
    }),
});

export const collections = {
  research,
  listening,
  'field-notes': fieldNotes,
  photography,
  profile,
  homepage,
};
