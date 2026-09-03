import { defineConfig } from 'astro/config';
import { unified } from '@astrojs/markdown-remark';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';
import remarkCallouts from './src/lib/markdown/remark-callouts.ts';

export default defineConfig({
  output: 'static',
  devToolbar: { enabled: false },
  integrations: [react()],
  markdown: {
    processor: unified({ remarkPlugins: [remarkCallouts] }),
  },
  vite: {
    plugins: [tailwindcss()],
  },
});
