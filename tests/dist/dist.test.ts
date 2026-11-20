// Runs against dist/ after `bun run build`. Preview build (PUBLIC_ENV unset), the default for `bun run check`.
import { describe, expect, test } from 'bun:test';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { TEMPLATE_IDS, loadTemplate } from '../../src/lib/templates';
import { ENTITY_EN, GROUPS, PAGES, SITE, buildPages, mdPath, pagePath, toMarkdown } from '../../src/lib/pages';

const dist = join(process.cwd(), 'dist');
const html = (lang: string, slug: string) => readFileSync(join(dist, lang, slug, 'index.html'), 'utf8');
const md = (lang: string, slug: string) => readFileSync(join(dist, lang, `${slug}.md`), 'utf8');
const pages = buildPages();
const THAI = ['quickstart', 'ai-tools', 'domain', 'smtp', 'templates'];

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });
}

describe('pages', () => {
  test('every page in the nav builds in EN', () => {
    for (const d of PAGES) {
      expect(existsSync(join(dist, 'en', d.slug, 'index.html')), d.slug).toBe(true);
      expect(html('en', d.slug)).toContain(`<h1 id="_top">${d.title.en}</h1>`);
    }
  });

  test('the sidebar links every page, grouped as landing.md section 15', () => {
    const h = html('en', 'quickstart');
    for (const d of PAGES) expect(h).toContain(`href="${pagePath('en', d.slug)}"`);
    for (const label of ['Get started', 'Concepts', 'Reference', 'Switching']) expect(h).toContain(label);
  });

  test('the TH sidebar uses the Thai labels, also for pages that fall back to EN content', () => {
    const h = html('th', 'api');
    for (const d of PAGES) expect(h, d.slug).toContain(`>${d.title.th}</span>`);
    for (const g of GROUPS) expect(h).toContain(g.label.th);
  });

  test('the Thai pages are Thai; every other TH page shows EN content with the notice', () => {
    for (const slug of THAI) {
      expect(html('th', slug)).toContain('<html lang="th"');
      expect(html('th', slug)).not.toContain('หน้านี้ยังมีแค่ภาษาอังกฤษ');
    }
    for (const d of PAGES.filter((p) => !THAI.includes(p.slug))) {
      expect(html('th', d.slug)).toContain('หน้านี้ยังมีแค่ภาษาอังกฤษ');
      expect(html('th', d.slug)).toContain(`<h1 id="_top">${d.title.en}</h1>`);
    }
  });

  test('hreflang th, en and x-default on every page; x-default is the EN page', () => {
    for (const lang of ['en', 'th']) for (const d of PAGES) {
      const h = html(lang, d.slug);
      expect(h).toContain(`hreflang="en" href="${SITE}${pagePath('en', d.slug)}"`);
      expect(h).toContain(`hreflang="th" href="${SITE}${pagePath('th', d.slug)}"`);
      expect(h).toContain(`hreflang="x-default" href="${SITE}${pagePath('en', d.slug)}"`);
    }
  });

  test('the language toggle sets mm_lang', () => {
    expect(html('en', 'quickstart')).toContain('mm_lang=');
    expect(html('en', 'quickstart')).toContain('Max-Age=31536000; SameSite=Lax');
  });
});

describe('email templates page', () => {
  test('both languages build with one sandboxed preview per template and no script in it', () => {
    for (const lang of ['en', 'th'] as const) {
      const h = html(lang, 'templates');
      const frames = [...h.matchAll(/<iframe\b[^>]*>/g)].map((m) => m[0]);
      expect(frames.length, lang).toBe(TEMPLATE_IDS.length);
      for (const f of frames) {
        expect(f).toContain('sandbox=""');
        expect(f).toContain('srcdoc=');
        expect(f).toMatch(/\btitle="[^"]+"/);
      }
      for (const id of TEMPLATE_IDS) {
        const t = loadTemplate(lang, id);
        expect(h, `${lang}/${id}`).toContain(`>${t.title}</h3>`);
        expect(h, `${lang}/${id} html code block`).toContain('<details>');
      }
      expect(h).toContain('Authentication');
      expect(h).toContain('/auth/templates');
    }
  });

  test('the Markdown lists every template subject but not their HTML', () => {
    for (const lang of ['en', 'th'] as const) {
      const m = md(lang, 'templates');
      for (const id of TEMPLATE_IDS) expect(m).toContain(`\`${loadTemplate(lang, id).subject}\``);
      expect(m).not.toContain('<table');
      expect(m).not.toContain('<!doctype');
    }
  });
});

describe('Markdown for AI', () => {
  test('/{lang}/{page}.md exists for every page and equals the Copy for AI payload in the HTML', () => {
    for (const p of pages) {
      const served = md(p.lang, p.slug);
      expect(served).toBe(toMarkdown(p));
      const m = /<script type="text\/markdown" class="copy-ai-src">(.*?)<\/script>/s.exec(html(p.lang, p.slug));
      expect(m, `${p.lang}/${p.slug} has a copy button payload`).not.toBeNull();
      expect(JSON.parse(m![1]!)).toBe(served);
      expect(html(p.lang, p.slug)).toContain(`href="${mdPath(p.lang, p.slug)}"`);
    }
  });

  test('llms.txt opens with the entity sentence (landing.md section 9, EN) and lists every page', () => {
    const t = readFileSync(join(dist, 'llms.txt'), 'utf8');
    expect(t.startsWith(`# mailmeow\n\n> ${ENTITY_EN}\n`)).toBe(true);
    const landing = '../docs/copy/landing.md';
    if (existsSync(landing)) expect(readFileSync(landing, 'utf8')).toContain(ENTITY_EN);
    for (const d of PAGES) expect(t).toContain(`${SITE}${mdPath('en', d.slug)}`);
    expect(t.indexOf('AI integration guide')).toBeLessThan(t.indexOf('Quickstart'));
  });

  test('llms-full.txt contains every EN page body', () => {
    const t = readFileSync(join(dist, 'llms-full.txt'), 'utf8');
    expect(t.startsWith(`# mailmeow\n\n> ${ENTITY_EN}`)).toBe(true);
    for (const p of pages.filter((x) => x.lang === 'en')) expect(t).toContain(toMarkdown(p));
  });
});

describe('claims', () => {
  const texts = () => [...walk(join(dist, 'en')).filter((f) => f.endsWith('.md')), ...walk(join(dist, 'th')).filter((f) => f.endsWith('.md')), join(dist, 'llms.txt'), join(dist, 'llms-full.txt')];

  test('no unproven time claims (landing.md Open: proof needed before any time claim)', () => {
    for (const f of texts()) {
      const t = readFileSync(f, 'utf8');
      expect(t, f).not.toMatch(/\b(in|under|within|takes?|only|just) (about |less than |a few |\d+ )minutes?\b/i);
      expect(t, f).not.toMatch(/five minutes|\d+-minute|few minutes/i);
    }
  });

  test('`mailmeow` is never presented as installable; it only appears in the "coming soon" SDK page', () => {
    for (const f of texts()) {
      const t = readFileSync(f, 'utf8');
      expect(t, f).not.toMatch(/(npm|bun|pnpm|yarn)\s+(install|add|i)\s+mailmeow\b/);
      if (!f.endsWith('sdk-node.md') && !f.endsWith('llms-full.txt')) expect(t, f).not.toMatch(/from ['"]mailmeow['"]/);
    }
    for (const lang of ['en', 'th']) expect(md(lang, 'sdk-node').toLowerCase()).toContain('coming soon');
    expect(md('en', 'sdk-node').indexOf('Coming soon')).toBeLessThan(md('en', 'sdk-node').indexOf('## Set up'));
    expect(md('en', 'sdk-node')).toContain('resend');
  });

  test('the AI guide states every required rule', () => {
    const g = md('en', 'ai');
    const rules: [string, RegExp | string][] = [
      ['server-side only', 'Send from the server only'],
      ['browser 403', 'browser_request_blocked'],
      ['server-only guard', 'import "server-only"'],
      ['env var key', 'MAILMEOW_API_KEY'],
      ['env var base url', 'MAILMEOW_BASE_URL'],
      ['env var webhook secret', 'MAILMEOW_WEBHOOK_SECRET'],
      ['base URL', 'https://api.mailmeow.dev'],
      ['idempotency header', 'Idempotency-Key'],
      ['caller supplies the key', 'Take the key from the caller'],
      ['error shape', '"statusCode"'],
      ['daily quota', 'daily_quota_exceeded'],
      ['monthly quota', 'monthly_quota_exceeded'],
      ['retry 5xx and network', /network error.*\| Yes/],
      ['4xx no retry', 'Do not retry 4xx'],
      ['test keys', 'mm_test_'],
      ['simulator address', 'bounced@test.mailmeow.dev'],
      ['send-only cannot read status', 'restricted_api_key'],
      ['use webhooks for status', 'use webhooks'],
      ['svix headers', 'svix-signature'],
      ['5 minute tolerance', 'more than 5 minutes'],
      ['no open relay', 'open relay'],
      ['Resend SDK', 'resend'],
      ['422 fields', 'attachments'],
      ['422 fields', 'scheduled_at'],
    ];
    for (const [rule, needle] of rules) {
      if (typeof needle === 'string') expect(g, rule).toContain(needle);
      else expect(g, rule).toMatch(needle);
    }
  });

  test('preview build is noindex: meta, robots.txt and _headers; a sitemap exists', () => {
    expect(html('en', 'quickstart')).toContain('<meta name="robots" content="noindex, nofollow"');
    expect(readFileSync(join(dist, 'robots.txt'), 'utf8')).toBe('User-agent: *\nDisallow: /\n');
    expect(readFileSync(join(dist, '_headers'), 'utf8')).toContain('X-Robots-Tag: noindex');
    expect(readFileSync(join(dist, 'sitemap-0.xml'), 'utf8')).toContain(`${SITE}/en/quickstart/`);
  });
});

describe('no third-party requests', () => {
  test('html and css load nothing from another origin', () => {
    const own = (u: string) => !/^(https?:)?\/\//.test(u) || u.startsWith(SITE);
    const bad: string[] = [];
    for (const f of walk(dist)) {
      if (f.endsWith('.html')) {
        const h = readFileSync(f, 'utf8');
        for (const m of h.matchAll(/<(script|img|iframe|source|video|audio)\b[^>]*?\bsrc="([^"]+)"/g)) if (!own(m[2]!)) bad.push(`${f}: ${m[2]}`);
        for (const m of h.matchAll(/<link\b[^>]*>/g)) {
          const tag = m[0];
          const rel = /rel="([^"]+)"/.exec(tag)?.[1] ?? '';
          const href = /href="([^"]+)"/.exec(tag)?.[1] ?? '';
          if (/stylesheet|preload|prefetch|modulepreload|icon|preconnect|dns-prefetch/.test(rel) && !own(href)) bad.push(`${f}: ${href}`);
        }
      }
      if (f.endsWith('.css')) {
        const c = readFileSync(f, 'utf8');
        for (const m of c.matchAll(/(?:url\(\s*|@import\s+)["']?((?:https?:)?\/\/[^"')\s]+)/g)) bad.push(`${f}: ${m[1]}`);
      }
    }
    expect(bad).toEqual([]);
  });
});
