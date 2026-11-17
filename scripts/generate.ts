// Writes src/content/docs/{lang}/{slug}.md(x) from the single pipeline in src/lib/pages.ts.
// Output is git-ignored; `bun run build` and `bun run dev` run it first.
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { aiToolsMdx, buildPages } from '../src/lib/pages';

const out = new URL('../src/content/docs/', import.meta.url).pathname;
rmSync(out, { recursive: true, force: true });
for (const p of buildPages()) {
  // A TH page that has no translation is not written: Starlight then serves the EN page there, with the notice.
  if (!p.translated) continue;
  const dir = `${out}${p.lang}/`;
  mkdirSync(dir, { recursive: true });
  const fm = `---\ntitle: ${JSON.stringify(p.title)}\ndescription: ${JSON.stringify(p.description)}\n---\n\n`;
  if (p.slug === 'ai-tools') writeFileSync(`${dir}${p.slug}.mdx`, fm + aiToolsMdx(p.lang));
  else writeFileSync(`${dir}${p.slug}.md`, fm + p.body);
}
console.log('generated docs content');
