// Email-safety rules for every template file. Real-client rendering (Gmail, Outlook, Apple Mail) needs a real send;
// these tests catch the mistakes that break it.
import { describe, expect, test } from 'bun:test';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { APP_TEMPLATE_IDS, SUPABASE_TEMPLATE_IDS, SUPABASE_VARS, TEMPLATE_IDS, loadTemplate, type TemplateMeta } from '../../src/lib/templates';

const LANGS = ['en', 'th'] as const;
const root = join(process.cwd(), 'templates');
const ids = (lang: string) => [...new Set(readdirSync(join(root, lang)).map((f) => f.replace(/\.(html|txt|json)$/, '')))].sort();
const stripComments = (s: string) => s.replace(/<!--[\s\S]*?-->/g, '');
const placeholders = (s: string, group: TemplateMeta['group']) =>
  [...s.matchAll(group === 'supabase' ? /\{\{\s*\.([A-Za-z]+)\s*\}\}/g : /\{\{([a-z_]+)\}\}/g)].map((m) => m[1]!);

describe('template files', () => {
  test('en and th have the same ids, and they are the 11 known ones', () => {
    expect(ids('en')).toEqual(ids('th'));
    expect(ids('en')).toEqual([...TEMPLATE_IDS].sort());
    expect(APP_TEMPLATE_IDS.length).toBe(5);
    expect(SUPABASE_TEMPLATE_IDS.length).toBe(6);
  });

  for (const lang of LANGS) {
    for (const id of TEMPLATE_IDS) {
      describe(`${lang}/${id}`, () => {
        const files = ['html', 'txt', 'json'].map((e) => join(root, lang, `${id}.${e}`));
        const [html, txt, jsonRaw] = files.map((f) => readFileSync(f, 'utf8'));
        const meta = JSON.parse(jsonRaw!) as TemplateMeta;
        const visible = stripComments(html!);

        test('has html, txt and json, and the html is under 20 KB', () => {
          expect(html!.length).toBeGreaterThan(0);
          expect(txt!.length).toBeGreaterThan(0);
          expect(meta.id).toBe(id);
          expect(Buffer.byteLength(html!)).toBeLessThan(20 * 1024);
        });

        test('uses nothing email clients drop or block', () => {
          for (const bad of [/display\s*:\s*flex/i, /display\s*:\s*grid/i, /<script/i, /<form/i, /background-image/i, /@import/i, /<link\b/i, /<iframe/i, /<video/i, /\sonclick=/i]) expect(visible, String(bad)).not.toMatch(bad);
          expect(visible).not.toMatch(/url\(\s*['"]?https?:/i);
        });

        test('is table based with accessible structure', () => {
          expect(html).toMatch(/<table[^>]*role="presentation"/);
          for (const t of visible.matchAll(/<table\b[^>]*>/g)) expect(t[0], 'every layout table').toContain('role="presentation"');
          for (const img of html!.matchAll(/<img\b[^>]*>/g)) expect(img[0]).toMatch(/\balt="[^"]*"/);
          expect(html).toContain('<meta name="color-scheme" content="light dark">');
          expect(html).toMatch(/<html lang="(en|th)"/);
          expect(html).toMatch(/<span class="preheader" style="[^"]*display:none[^"]*">[^<]+<\/span>/);
          expect(meta.preheader.length).toBeGreaterThan(0);
          expect(html).toContain(meta.preheader);
          expect(html).toContain('max-width:600px');
          expect(html).toContain('Leelawadee UI');
          expect(html).toContain('#2563EB');
        });

        test('every placeholder is documented and every documented one is used', () => {
          const used = new Set(placeholders(visible, meta.group));
          const documented = meta.variables.map((v) => v.name);
          expect([...used].sort()).toEqual([...documented].sort());
          // nothing else that looks like a placeholder
          const all = [...visible.matchAll(/\{\{/g)].length;
          expect(all).toBe(placeholders(visible, meta.group).length);
          for (const name of placeholders(txt!, meta.group)) expect(documented, `txt uses ${name}`).toContain(name);
          for (const name of placeholders(meta.subject, meta.group)) expect(documented, `subject uses ${name}`).toContain(name);
          for (const v of meta.variables) {
            expect(v.description.length).toBeGreaterThan(0);
            expect(v.example.length).toBeGreaterThan(0);
          }
        });

        if (id.startsWith('supabase-')) {
          test('uses only variables Supabase gives this template', () => {
            expect(meta.group).toBe('supabase');
            expect(meta.supabaseTemplate).toBeTruthy();
            expect(meta.available).toEqual(SUPABASE_VARS[id]);
            for (const name of placeholders(visible, 'supabase')) expect(SUPABASE_VARS[id], `${id} uses ${name}`).toContain(name);
          });
        }

        if (lang === 'th') {
          test('Thai copy avoids the banned words', () => {
            // คุณ is banned as a pronoun; it stays legal inside ขอบคุณ (thank you), คุณภาพ and คุณสมบัติ
            for (const s of [html!, txt!, jsonRaw!]) {
              expect(s).not.toMatch(/(?<!ขอบ)คุณ(?!ภาพ|สมบัติ)/);
              for (const bad of ['ครับ', 'ค่ะ', '·']) expect(s).not.toContain(bad);
            }
          });
        }
      });
    }
  }

  test('reauthentication has no link variables, as Supabase gives it none', () => {
    const t = loadTemplate('en', 'supabase-reauthentication');
    expect(t.html).not.toContain('ConfirmationURL');
    expect(t.html).not.toContain('TokenHash');
    expect(t.html).not.toContain('RedirectTo');
  });

  test('OTP-style templates show the code large, monospace and letter-spaced', () => {
    for (const lang of LANGS) for (const id of ['otp', 'supabase-reauthentication', 'supabase-magic-link']) {
      const html = loadTemplate(lang, id).html;
      expect(html).toMatch(/letter-spacing:\s*8px/);
      expect(html).toMatch(/font-family:'SFMono-Regular', Menlo/);
    }
  });
});
