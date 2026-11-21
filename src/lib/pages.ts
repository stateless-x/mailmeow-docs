// One pure content pipeline. Every output (Starlight entries, /{lang}/{slug}.md, llms*.txt,
// the "Copy for AI" payload) is built from buildPages(), so they cannot drift apart.
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { AI_GUIDE } from './ai-guide';
import { templatesMarkdown } from './templates-page';

export type Lang = 'en' | 'th';
export const LANGS: Lang[] = ['en', 'th'];
export const SITE = 'https://docs.mailmeow.dev';
export const API_URL = 'https://api.mailmeow.dev';

/** docs/copy/landing.md section 9, EN. Opens llms.txt and llms-full.txt. */
export const ENTITY_EN =
  "mailmeow is an email API for Thai builders who make apps with AI. It sends email from your app, such as login codes and confirmation emails, prepares your SPF, DKIM and DMARC values, and tells you whether each email was sent, delivered, bounced or marked as spam. Pooh (Purin Buriwong) built it for his own apps first. It is not open for signup yet; join the waitlist.";

export const BETA_NOTICE = {
  en: 'mailmeow is in private beta and not open for signup yet. These pages describe the API as planned.',
  th: 'mailmeow ยังอยู่ในช่วง private beta และยังไม่เปิดให้สมัคร หน้าเหล่านี้อธิบาย API ตามที่วางแผนไว้',
} satisfies Record<Lang, string>;

export type GroupId = 'get-started' | 'concepts' | 'reference' | 'switching';
export interface PageDef {
  slug: string;
  group: GroupId;
  title: Record<Lang, string>;
  description: string;
}

/** Nav order. Labels: docs/copy/landing.md section 15. Labels marked (new) have no entry there. */
export const GROUPS: { id: GroupId; label: Record<Lang, string> }[] = [
  { id: 'get-started', label: { en: 'Get started', th: 'เริ่มต้น' } },
  { id: 'concepts', label: { en: 'Concepts', th: 'เรื่องที่ควรรู้' } },
  { id: 'reference', label: { en: 'Reference', th: 'Reference' } }, // (new)
  { id: 'switching', label: { en: 'Switching', th: 'ย้ายมา mailmeow' } }, // (new)
];

export const PAGES: PageDef[] = [
  { slug: 'quickstart', group: 'get-started', title: { en: 'Quickstart', th: 'ส่งอีเมลแรก' }, description: 'Get a test key, send your first email with cURL or the Resend SDK, check its status, and go live.' },
  { slug: 'ai-tools', group: 'get-started', title: { en: 'Use with AI tools', th: 'ใช้กับเครื่องมือ AI' }, description: 'Copy-paste prompts that make Claude Code, Cursor, Lovable, Bolt or any AI tool add server-side email sending with mailmeow.' },
  { slug: 'ai', group: 'get-started', title: { en: 'AI integration guide', th: 'คู่มือสำหรับ AI' }, description: 'Rules for AI agents that write code against mailmeow: server-side only, env vars, idempotency, errors and retries, test keys, webhook verification.' }, // TH label (new)
  { slug: 'domain', group: 'get-started', title: { en: 'Set up your domain', th: 'ตั้งค่าโดเมน' }, description: 'Add the DNS records (DKIM, return path, SPF, DMARC) that let you send live email from your own domain.' },
  { slug: 'smtp', group: 'get-started', title: { en: 'Send with SMTP', th: 'ส่งผ่าน SMTP' }, description: 'Send through SMTP from Supabase Auth and other tools that only speak SMTP: settings, Supabase steps, limits and troubleshooting.' },
  { slug: 'templates', group: 'get-started', title: { en: 'Email templates', th: 'เทมเพลตอีเมล' }, description: 'Copy-paste HTML email templates in Thai and English: login code, welcome, password reset, receipt, contact form, and the six Supabase sign-in emails.' },
  { slug: 'concepts', group: 'concepts', title: { en: 'Concepts', th: 'เรื่องที่ควรรู้' }, description: 'Test mode, server-side keys, streams, domains, email statuses, suppressions, idempotency and limits.' },
  { slug: 'api', group: 'reference', title: { en: 'API reference', th: 'API reference' }, description: 'POST /emails, GET /emails/{id} and GET /emails: fields, examples and responses.' },
  { slug: 'webhooks', group: 'reference', title: { en: 'Webhooks', th: 'Webhooks' }, description: 'Delivery events, payload, signature verification and retries.' },
  { slug: 'sdk-node', group: 'reference', title: { en: 'Node.js SDK', th: 'Node.js SDK' }, description: 'The planned mailmeow Node.js SDK (not published yet). Use the Resend SDK today.' },
  { slug: 'errors', group: 'reference', title: { en: 'Errors', th: 'Errors' }, description: 'Error format, every error name, and what to do about each one.' }, // TH label (new)
  { slug: 'migrate-from-resend', group: 'switching', title: { en: 'Migrate from Resend', th: 'ย้ายจาก Resend' }, description: 'Switch from Resend by changing two environment variables, and what is different.' },
];

export const TH_DESCRIPTIONS: Record<string, string> = {
  quickstart: 'ขอ API key ทดสอบ ส่งอีเมลแรกด้วย cURL หรือ Resend SDK เช็กสถานะ แล้วเปลี่ยนไปใช้จริง',
  smtp: 'ตั้งค่า Supabase Auth และเครื่องมือที่ส่งได้แค่ผ่าน SMTP ให้ส่งอีเมลผ่าน mailmeow พร้อมขั้นตอน ขีดจำกัด และวิธีแก้ปัญหา',
  'ai-tools': 'พรอมต์ให้ก๊อปไปวางใน Claude Code, Cursor, Lovable, Bolt หรือเครื่องมือ AI อื่น เพื่อให้มันทำระบบส่งอีเมลฝั่ง server ด้วย mailmeow',
  templates: 'เทมเพลตอีเมล HTML ภาษาไทยและอังกฤษ ก๊อปไปใช้ได้เลย มีรหัส OTP ต้อนรับสมาชิก ตั้งรหัสผ่านใหม่ ใบเสร็จ ฟอร์มติดต่อ และอีเมลล็อกอินทั้ง 6 แบบของ Supabase',
  domain: 'เพิ่ม DNS record (DKIM, return path, SPF, DMARC) เพื่อส่งอีเมลจริงจากโดเมนตัวเอง',
};

export interface Page {
  lang: Lang;
  slug: string;
  title: string;
  description: string;
  /** Markdown body, without the H1. Internal links are root-relative (/en/...). */
  body: string;
  /** false when a TH page falls back to the EN content. */
  translated: boolean;
}

// Bundled code has no stable import.meta.url; every command (build, dev, test) runs from the project root.
const root = join(process.cwd(), 'content') + '/';
const read = (rel: string) => readFileSync(root + rel, 'utf8');

// ---------- transform helpers ----------
export function stripFrontmatter(md: string): string {
  return md.replace(/^---\n[\s\S]*?\n---\n/, '');
}
export function stripH1(md: string): string {
  return md.replace(/^\s*# .*\n+/, '');
}
/** Replace `from` with `to`; fail loudly when the source drifted and the patch no longer applies. */
export function patch(md: string, from: string, to: string): string {
  if (!md.includes(from)) throw new Error(`content patch no longer matches the source: ${from.slice(0, 60)}`);
  return md.replace(from, () => to);
}
/** Split `## <heading>` off `md`: returns its body and the rest. */
export function takeSection(md: string, heading: string): { section: string; rest: string } {
  const start = md.indexOf(`\n## ${heading}\n`);
  if (start < 0) throw new Error(`section not found: ${heading}`);
  const bodyStart = start + `\n## ${heading}\n`.length;
  const next = md.indexOf('\n## ', bodyStart);
  const end = next < 0 ? md.length : next;
  return { section: md.slice(bodyStart, end).trim() + '\n', rest: md.slice(0, start) + (next < 0 ? '\n' : md.slice(end)) };
}

const LINKS: [RegExp, string][] = [
  [/\]\(https:\/\/docs\.mailmeow\.dev\/concepts#/g, '](/en/concepts/#'],
  [/\]\(concepts\.md#domains\)/g, '](/en/domain/)'],
  [/\]\(api-reference\.md#errors\)/g, '](/en/errors/)'],
  [/\]\(api-reference\.md/g, '](/en/api/'],
  [/\]\(quickstart\.md/g, '](/en/quickstart/'],
  [/\]\(concepts\.md/g, '](/en/concepts/'],
  [/\]\(webhooks\.md/g, '](/en/webhooks/'],
  [/\]\(sdk-node\.md/g, '](/en/sdk-node/'],
  [/\]\(migrate-from-resend\.md/g, '](/en/migrate-from-resend/'],
  [/\]\(templates\.md/g, '](/en/templates/'],
];
export function rewriteLinks(md: string): string {
  return LINKS.reduce((s, [re, to]) => s.replace(re, to), md);
}

// ---------- EN pages from docs/user ----------
const RESEND_CLIENT = `import { Resend } from 'resend';

const resend = new Resend(process.env.MAILMEOW_API_KEY, {
  baseUrl: '${API_URL}',
});`;

function enBodies(): Record<string, string> {
  const src = (n: string) => stripH1(stripFrontmatter(read(`source/user/${n}.md`)));

  let quickstart = src('quickstart');
  quickstart = patch(quickstart, '**Node.js**', '**Node.js (Resend SDK)**');
  quickstart = patch(quickstart, 'npm install mailmeow', 'npm install resend');
  quickstart = patch(quickstart, `import { MailMeow } from 'mailmeow';\n\nconst meow = new MailMeow(); // reads MAILMEOW_API_KEY\n\nconst { data, error } = await meow.emails.send({`, `${RESEND_CLIENT}\n\nconst { data, error } = await resend.emails.send({`);
  quickstart = patch(quickstart, 'Already using the `resend` package? Keep it. See [Migrate from Resend](migrate-from-resend.md).', 'The `mailmeow` package is not published yet, so this example uses the `resend` package, which mailmeow is compatible with. Already using it? Keep it. See [Migrate from Resend](migrate-from-resend.md).');

  let concepts = src('concepts');
  concepts = patch(concepts, 'import { MailMeow } from "mailmeow";\n\nconst meow = new MailMeow(); // reads MAILMEOW_API_KEY', `import { Resend } from "resend";\n\nconst meow = new Resend(process.env.MAILMEOW_API_KEY, {\n  baseUrl: "${API_URL}",\n});`);
  concepts = patch(concepts, 'Verification usually takes a few minutes, and up to 72 hours if your DNS is slow.', 'Verification can take up to 72 hours if your DNS is slow.');
  concepts = patch(concepts, 'The `mailmeow` Node SDK adds a key for you and reuses it when it retries.', 'The planned `mailmeow` Node SDK will add a key for you and reuse it when it retries. Until it ships, send your own key.');
  const smtp = src('smtp');
  const domain = takeSection(concepts, 'Domains').section;

  let webhooks = src('webhooks');
  webhooks = patch(webhooks, '**With the SDK**', '**With the Resend SDK** (the `mailmeow` package is not published yet)');
  webhooks = patch(
    webhooks,
    `import { MailMeow } from 'mailmeow';\n\nconst meow = new MailMeow();\n\n// rawBody must be the exact request body string, not re-serialized JSON\nconst event = meow.webhooks.verify({\n  payload: rawBody,\n  headers: request.headers,\n  secret: process.env.MAILMEOW_WEBHOOK_SECRET,\n}); // throws if the signature is wrong`,
    `import { Resend } from 'resend';\n\nconst resend = new Resend(process.env.MAILMEOW_API_KEY, { baseUrl: '${API_URL}' });\n\n// rawBody must be the exact request body string, not re-serialized JSON\nconst event = resend.webhooks.verify({\n  payload: rawBody,\n  headers: {\n    id: request.headers.get('svix-id')!,\n    timestamp: request.headers.get('svix-timestamp')!,\n    signature: request.headers.get('svix-signature')!,\n  },\n  webhookSecret: process.env.MAILMEOW_WEBHOOK_SECRET!,\n}); // throws if the signature is wrong`,
  );

  let sdk = src('sdk-node');
  sdk = patch(sdk, '```bash\nnpm install mailmeow\n```\n\n', '');
  sdk = `> **Coming soon.** The \`mailmeow\` npm package is not published yet, so there is nothing to install today. Everything below describes the planned package. To send now, use the \`resend\` package: see [Quickstart](/en/quickstart/) and [Migrate from Resend](/en/migrate-from-resend/).\n\n${sdk}`;

  const apiFull = src('api-reference');
  const { section: errors, rest: api } = takeSection(apiFull, 'Errors');

  return {
    quickstart,
    concepts,
    domain,
    smtp,
    api,
    errors,
    webhooks,
    'sdk-node': sdk,
    'migrate-from-resend': src('migrate-from-resend'),
    ai: AI_GUIDE,
  };
}

// ---------- AI tools (from ai-prompts.md) ----------
export interface Prompt { tool: string; thIntro: string; enIntro: string; prompt: string }
const EN_INTRO: Record<string, string> = {
  'Claude Code': 'Paste this into Claude Code, opened in your project folder.',
  Cursor: 'Open Agent mode in Cursor and paste this. It is written for Next.js projects.',
  Lovable: 'Paste this into the Lovable chat. It builds a server-side function and asks you to add the key yourself.',
  Bolt: 'Paste this into the Bolt chat. If the project already has a server, it uses that. If not, it uses a server-side function.',
  'Any other AI tool': 'Works with any other AI tool, in any language or framework. Paste it into its chat.',
};
export function parsePrompts(): Prompt[] {
  const md = read('source/ai-prompts.md');
  const out: Prompt[] = [];
  for (const block of md.split(/^## /m).slice(1)) {
    const tool = block.split('\n')[0]!.trim();
    const th = /^TH intro: (.+)$/m.exec(block);
    const code = /````text\n([\s\S]*?)\n````/.exec(block);
    if (!th || !code) continue;
    const enIntro = EN_INTRO[tool];
    if (!enIntro) throw new Error(`no EN intro for ${tool}`);
    out.push({ tool, thIntro: th[1]!.trim(), enIntro, prompt: code[1]!.replaceAll('{{BASE_URL}}', API_URL) });
  }
  if (out.length !== 5) throw new Error(`expected 5 prompts, got ${out.length}`);
  return out;
}

const AI_TOOLS_INTRO: Record<Lang, string> = {
  en: `Pick your tool, copy the prompt, and paste it into its chat. The AI sets up server-side sending with a test key (\`mm_test_\`), so nothing reaches a real inbox.

You never paste your key into the chat. The prompt tells the AI to leave that to you: put the key in your project's env or secrets settings yourself.

The prompts are in English because AI tools follow English best. They use the \`resend\` package or plain \`fetch\`, because the \`mailmeow\` package is not published yet. A key that can only send cannot read an email's status back, so the prompts do not ask for it: use [webhooks](/en/webhooks/) for that.

Building something else, or want the full rule list? See the [AI integration guide](/en/ai/).`,
  th: `เลือกเครื่องมือ AI ที่ใช้ ก๊อปพรอมต์ แล้ววางในแชตของมัน AI จะทำระบบส่งอีเมลฝั่ง server ให้ด้วย API key ทดสอบ (\`mm_test_\`) เลยไม่มีอีเมลไปถึงคนจริง

ไม่ต้องพิมพ์ API key ในแชต พรอมต์สั่งให้ AI ปล่อยส่วนนี้ไว้ให้ทำเอง คือเอา API key ไปใส่ในหน้าตั้งค่า env หรือ secrets ของโปรเจกต์

พรอมต์เป็นภาษาอังกฤษ เพราะเครื่องมือ AI ทำตามภาษาอังกฤษได้แม่นกว่า ใช้วางได้เลยไม่ต้องแปล พรอมต์ใช้แพ็กเกจ \`resend\` หรือ \`fetch\` เพราะแพ็กเกจ \`mailmeow\` ยังไม่ได้ปล่อยบน npm API key สิทธิ์ส่งอีเมลอย่างเดียวดึงสถานะอีเมลกลับมาดูไม่ได้ พรอมต์เลยไม่ให้ทำ ถ้าอยากรู้สถานะให้ใช้ [webhooks](/th/webhooks/)

ทำโปรเจกต์แบบอื่น หรืออยากอ่านกฎทั้งหมด ดู [คู่มือสำหรับ AI](/en/ai/) (มีแค่ภาษาอังกฤษ)`,
};

const MCP_SECTION: Record<Lang, string> = {
  en: `## Connect with MCP

mailmeow has a hosted MCP server, so your AI tool can send a test email and read it back. There is nothing to install: give the tool the URL and an API key.

- URL: \`${API_URL}/mcp\`
- Header: \`Authorization: Bearer <your test key>\`
- Test keys only (\`mm_test_\`). A live key is refused. Emails are saved and simulated, never delivered to a real inbox.
- Tools: \`send_test_email\`, \`get_email\`, \`list_emails\`. The last two need a key with Full access.

### Claude Code

\`\`\`bash
claude mcp add --transport http mailmeow ${API_URL}/mcp \\
  --header "Authorization: Bearer mm_test_..."
\`\`\`

This saves the key on your machine for the current project. Run \`/mcp\` inside Claude Code to check that it connected. See the [Claude Code MCP docs](https://code.claude.com/docs/en/mcp).

### Cursor

Add this to \`.cursor/mcp.json\` in your project, or to \`~/.cursor/mcp.json\` for every project. The key is read from an environment variable, so it never lands in a file you commit.

\`\`\`json
{
  "mcpServers": {
    "mailmeow": {
      "url": "${API_URL}/mcp",
      "headers": {
        "Authorization": "Bearer \${env:MAILMEOW_API_KEY}"
      }
    }
  }
}
\`\`\`

Set \`MAILMEOW_API_KEY\` to your test key before you start Cursor. See the [Cursor MCP docs](https://cursor.com/docs/context/mcp).

### Any other tool

Pick the Streamable HTTP transport (sometimes called "HTTP"), then give it the URL \`${API_URL}/mcp\` and the header \`Authorization: Bearer <your test key>\`.`,
  th: `## เชื่อมต่อด้วย MCP

ต่อ MCP server ของ mailmeow แล้ว เครื่องมือ AI จะส่งอีเมลทดสอบและเช็กผลได้เอง ไม่ต้องติดตั้งอะไร แค่ใส่ URL กับ API key

- URL: \`${API_URL}/mcp\`
- Header: \`Authorization: Bearer <API key ทดสอบ>\`
- ใช้ได้เฉพาะ API key ทดสอบ (\`mm_test_\`) ถ้าใส่ API key จริง (live) จะถูกปฏิเสธ อีเมลที่ส่งแค่ถูกบันทึกและจำลอง ไม่ถึงกล่องจดหมายของใครจริง
- เครื่องมือมี 3 ตัว: \`send_test_email\`, \`get_email\`, \`list_emails\` สองตัวหลังต้องใช้ API key ที่มีสิทธิ์ Full access

### Claude Code

\`\`\`bash
claude mcp add --transport http mailmeow ${API_URL}/mcp \\
  --header "Authorization: Bearer mm_test_..."
\`\`\`

คำสั่งนี้เก็บ API key ไว้ในเครื่องตัวเอง ใช้กับโปรเจกต์ที่เปิดอยู่ พิมพ์ \`/mcp\` ใน Claude Code เพื่อเช็กว่าเชื่อมต่อแล้ว ดู [เอกสาร MCP ของ Claude Code](https://code.claude.com/docs/en/mcp)

### Cursor

เพิ่มโค้ดนี้ใน \`.cursor/mcp.json\` ของโปรเจกต์ หรือ \`~/.cursor/mcp.json\` ถ้าอยากใช้ทุกโปรเจกต์ API key อ่านจาก environment variable จึงไม่ติดไปในไฟล์ที่ commit

\`\`\`json
{
  "mcpServers": {
    "mailmeow": {
      "url": "${API_URL}/mcp",
      "headers": {
        "Authorization": "Bearer \${env:MAILMEOW_API_KEY}"
      }
    }
  }
}
\`\`\`

ตั้งค่า \`MAILMEOW_API_KEY\` เป็น API key ทดสอบก่อนเปิด Cursor ดู [เอกสาร MCP ของ Cursor](https://cursor.com/docs/context/mcp)

### เครื่องมืออื่น

เลือก transport แบบ Streamable HTTP (บางที่เรียกแค่ "HTTP") แล้วใส่ URL \`${API_URL}/mcp\` กับ header \`Authorization: Bearer <API key ทดสอบ>\``,
};

/** Plain Markdown for llms-full.txt, .md routes and Copy for AI. */
function aiToolsMarkdown(lang: Lang): string {
  const parts = parsePrompts().map((p) => `## ${p.tool}\n\n${lang === 'th' ? p.thIntro : p.enIntro}\n\n\`\`\`\`text\n${p.prompt}\n\`\`\`\``);
  return `${AI_TOOLS_INTRO[lang]}\n\n${parts.join('\n\n')}\n\n${MCP_SECTION[lang]}\n`;
}

/** MDX for the Starlight entry: one tab per tool. Same data as aiToolsMarkdown. */
export function aiToolsMdx(lang: Lang): string {
  const tabs = parsePrompts().map((p) => `<TabItem label="${p.tool}">\n\n${lang === 'th' ? p.thIntro : p.enIntro}\n\n\`\`\`\`text\n${p.prompt}\n\`\`\`\`\n\n</TabItem>`);
  return `import { Tabs, TabItem } from '@astrojs/starlight/components';\n\n${AI_TOOLS_INTRO[lang]}\n\n<Tabs syncKey="ai-tool">\n\n${tabs.join('\n\n')}\n\n</Tabs>\n\n${MCP_SECTION[lang]}\n`;
}

// ---------- public API ----------
function thPage(slug: string): { title: string; description: string; body: string } | null {
  const file = `th/${slug}.md`;
  if (!existsSync(root + file)) return null;
  const raw = read(file);
  const fm = /^---\n([\s\S]*?)\n---\n/.exec(raw)?.[1] ?? '';
  const get = (k: string) => new RegExp(`^${k}: (.+)$`, 'm').exec(fm)?.[1]?.trim() ?? '';
  return { title: get('title'), description: get('description'), body: stripFrontmatter(raw) };
}

/** Pages whose EN and TH bodies are built in code, not read from content/. generate.ts writes them as MDX. */
export const GENERATED = new Set(['ai-tools', 'templates']);

export function buildPages(): Page[] {
  const en = enBodies();
  const pages: Page[] = [];
  for (const def of PAGES) {
    const enBody = def.slug === 'ai-tools' ? aiToolsMarkdown('en') : def.slug === 'templates' ? templatesMarkdown('en') : en[def.slug]!;
    pages.push({ lang: 'en', slug: def.slug, title: def.title.en, description: def.description, body: rewriteLinks(enBody), translated: true });
    const th = thPage(def.slug);
    if (GENERATED.has(def.slug) && th) throw new Error(`${def.slug} TH is generated, not hand-written`);
    if (GENERATED.has(def.slug)) {
      const body = def.slug === 'ai-tools' ? aiToolsMarkdown('th') : templatesMarkdown('th');
      pages.push({ lang: 'th', slug: def.slug, title: def.title.th, description: TH_DESCRIPTIONS[def.slug]!, body, translated: true });
    } else if (th) {
      pages.push({ lang: 'th', slug: def.slug, title: th.title || def.title.th, description: th.description || TH_DESCRIPTIONS[def.slug]!, body: th.body, translated: true });
    } else {
      pages.push({ lang: 'th', slug: def.slug, title: def.title.en, description: def.description, body: rewriteLinks(enBody), translated: false });
    }
  }
  return pages;
}

export const pagePath = (lang: Lang, slug: string) => `/${lang}/${slug}/`;
export const mdPath = (lang: Lang, slug: string) => `/${lang}/${slug}.md`;

/** The Markdown a reader copies and the .md route serves. Absolute links so it works pasted anywhere. */
export function toMarkdown(p: Page): string {
  return `# ${p.title}\n\n${p.body.trimEnd().replace(/\]\(\/(en|th)\//g, `](${SITE}/$1/`)}\n`;
}

export function llmsTxt(pages: Page[]): string {
  const en = pages.filter((p) => p.lang === 'en');
  const order = ['ai', ...PAGES.map((d) => d.slug).filter((s) => s !== 'ai')];
  const bySlug = (s: string) => en.find((p) => p.slug === s)!;
  const lines = order.map((s) => `- [${bySlug(s).title}](${SITE}${mdPath('en', s)}): ${bySlug(s).description}`);
  const th = pages.filter((p) => p.lang === 'th' && p.translated);
  return `# mailmeow\n\n> ${ENTITY_EN}\n\nStart with the AI integration guide: it holds the rules for writing code against mailmeow. All pages below are plain Markdown. The full text of every page is in ${SITE}/llms-full.txt.\n\n## Docs\n\n${lines.join('\n')}\n\n## Thai (ภาษาไทย)\n\n${th.map((p) => `- [${p.title}](${SITE}${mdPath('th', p.slug)}): ${p.description}`).join('\n')}\n`;
}

export function llmsFullTxt(pages: Page[]): string {
  const en = pages.filter((p) => p.lang === 'en');
  const order = ['ai', ...PAGES.map((d) => d.slug).filter((s) => s !== 'ai')];
  const docs = order.map((s) => `<!-- ${SITE}${pagePath('en', s)} -->\n\n${toMarkdown(en.find((p) => p.slug === s)!)}`);
  return `# mailmeow\n\n> ${ENTITY_EN}\n\n${docs.join('\n---\n\n')}`;
}

let cache: Page[] | undefined;
/** buildPages() once per process: components call it for every page. */
export function getPages(): Page[] {
  return (cache ??= buildPages());
}

/** "/th/api/" -> { lang: 'th', slug: 'api' }; null for anything that is not a docs page. */
export function parsePath(pathname: string): { lang: Lang; slug: string } | null {
  const m = /^\/(en|th)\/([^/]+)\/?$/.exec(pathname);
  return m ? { lang: m[1] as Lang, slug: m[2]! } : null;
}
