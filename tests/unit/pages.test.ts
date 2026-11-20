import { describe, expect, test } from 'bun:test';
import { existsSync, readFileSync } from 'node:fs';
import GithubSlugger from 'github-slugger';
import { PAGES, buildPages, patch, rewriteLinks, takeSection } from '../../src/lib/pages';
import { SOURCES } from '../../src/lib/sources';
import { renderRobots } from '../../src/lib/env';

const pages = buildPages();

describe('content pipeline', () => {
  test('committed source copies match ../docs when the umbrella repo is present', () => {
    for (const [from, to] of SOURCES) {
      const orig = `../docs/${from}`;
      if (!existsSync(orig)) continue; // the docs site deploys alone
      expect(readFileSync(`content/source/${to}`, 'utf8')).toBe(readFileSync(orig, 'utf8'));
    }
  });

  test('a patch that no longer matches the source fails loudly', () => {
    expect(() => patch('abc', 'zzz', 'y')).toThrow();
  });

  test('takeSection splits a section off', () => {
    const { section, rest } = takeSection('# T\n\n## A\n\nx\n\n## B\n\ny\n', 'A');
    expect(section).toBe('x\n');
    expect(rest).not.toContain('## A');
    expect(rest).toContain('## B');
  });

  test('links to the old .md files are rewritten', () => {
    expect(rewriteLinks('[a](concepts.md#domains) [b](api-reference.md#errors) [c](webhooks.md#x)')).toBe('[a](/en/domain/) [b](/en/errors/) [c](/en/webhooks/#x)');
  });

  test('every page exists in EN and TH, and the five Thai pages are translated', () => {
    for (const def of PAGES) {
      expect(pages.find((p) => p.lang === 'en' && p.slug === def.slug)?.translated).toBe(true);
      expect(pages.find((p) => p.lang === 'th' && p.slug === def.slug)).toBeDefined();
    }
    const translated = pages.filter((p) => p.lang === 'th' && p.translated).map((p) => p.slug).sort();
    expect(translated).toEqual(['ai-tools', 'domain', 'quickstart', 'smtp', 'templates']);
  });

  test('internal links and anchors point at real pages and headings', () => {
    const headings = (md: string) => {
      const s = new GithubSlugger();
      return new Set([...md.matchAll(/^#{1,6} (.+)$/gm)].map((m) => s.slug(m[1]!.replace(/`/g, ''))));
    };
    const byRoute = new Map(pages.map((p) => [`/${p.lang}/${p.slug}/`, p]));
    for (const p of pages) {
      expect(p.body).not.toMatch(/\]\([a-z-]+\.md/);
      for (const m of p.body.matchAll(/\]\((\/(?:en|th)\/[a-z-]+\/)(#[^)]*)?\)/g)) {
        // a TH page without a translation shows the EN content, so its anchors resolve against EN
        const target = byRoute.get(m[1]!);
        expect(target, `${p.lang}/${p.slug} links to ${m[1]}`).toBeDefined();
        if (m[2]) expect(headings(target!.body).has(m[2].slice(1)), `${p.lang}/${p.slug} -> ${m[1]}${m[2]}`).toBe(true);
      }
    }
  });

  test('robots: preview disallows everything, production allows all and lists the sitemap', () => {
    expect(renderRobots(false, 'https://x')).toBe('User-agent: *\nDisallow: /\n');
    const prod = renderRobots(true, 'https://x');
    expect(prod).toContain('Allow: /');
    expect(prod).not.toContain('Disallow');
    expect(prod).toContain('Sitemap: https://x/sitemap-index.xml');
  });
});
