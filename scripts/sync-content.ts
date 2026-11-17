// Refreshes the committed copies in content/source from the umbrella docs (../docs).
// The docs site deploys alone, so it cannot read ../docs at build time.
import { copyFileSync } from 'node:fs';
import { SOURCES } from '../src/lib/sources';

for (const [from, to] of SOURCES) copyFileSync(new URL(`../../docs/${from}`, import.meta.url), new URL(`../content/source/${to}`, import.meta.url));
console.log(`synced ${SOURCES.length} files from ../docs`);
