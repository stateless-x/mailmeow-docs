// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { GROUPS, PAGES, SITE } from './src/lib/pages.ts';
import { isProduction } from './src/lib/env.ts';

const prod = isProduction(process.env);

/** Non-production builds also send X-Robots-Tag: noindex (Cloudflare Pages reads dist/_headers). */
function noindexHeaders() {
  return {
    name: 'mailmeow-docs-noindex-headers',
    hooks: {
      'astro:build:done': async (/** @type {{ dir: URL }} */ { dir }) => {
        if (prod) return;
        await writeFile(fileURLToPath(new URL('_headers', dir)), '/*\n  X-Robots-Tag: noindex\n');
      },
    },
  };
}

export default defineConfig({
  site: SITE,
  output: 'static',
  trailingSlash: 'always',
  // The Cloudflare Pages Function in functions/index.ts decides by cookie and Accept-Language; this is the fallback.
  redirects: { '/': '/en/' },
  integrations: [
    starlight({
      title: 'mailmeow docs',
      description: 'Docs for mailmeow, an email API that works like Resend.',
      favicon: '/favicon-32.png',
      defaultLocale: 'en',
      locales: {
        en: { label: 'English', lang: 'en' },
        th: { label: 'ไทย', lang: 'th' },
      },
      customCss: ['./src/styles/docs.css'],
      components: {
        PageTitle: './src/components/PageTitle.astro',
        LanguageSelect: './src/components/LanguageSelect.astro',
      },
      head: prod ? [] : [{ tag: 'meta', attrs: { name: 'robots', content: 'noindex, nofollow' } }],
      sidebar: GROUPS.map((g) => ({
        label: g.label.en,
        translations: { th: g.label.th },
        items: PAGES.filter((p) => p.group === g.id).map((p) => ({ slug: p.slug, label: p.title.en, translations: { th: p.title.th } })),
      })),
    }),
    noindexHeaders(),
  ],
});
