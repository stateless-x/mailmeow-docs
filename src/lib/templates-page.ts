// The "Email templates" page. Same split as the AI tools page: one prose, two renderings.
// templatesMarkdown() is the Page.body (the .md route, Copy for AI, llms-full.txt): prose, plus each template's
// subject and variables, but not its HTML. templatesMdx() is the Starlight page: the same prose, and a
// <TemplateCard> per template that shows the preview, the HTML and the plain text.
import type { Lang } from './pages';
import { APP_TEMPLATE_IDS, SUPABASE_TEMPLATE_IDS, loadTemplate, placeholder, type Template } from './templates';

const SUPABASE_URL = 'https://supabase.com/dashboard/project/_/auth/templates';

const T = {
  en: {
    intro: `Ready-made HTML emails in English and Thai. Copy one, change the colour and the app name, and send it with mailmeow. Each template has a live preview, a subject, the HTML and a plain-text version.

There are two sets. The first is for emails your own code sends through the mailmeow API. The second replaces the six sign-in emails of Supabase Auth, which go out through [SMTP](/en/smtp/).`,
    howTitle: 'How to use a template',
    how: [
      'Pick a template, open **HTML** and press the copy button.',
      'At the top of the HTML there is a comment. Find `#2563EB` and replace it with your brand colour. Replace the app name and the logo URL too.',
      'mailmeow does not fill in placeholders yet. Replace each one, such as `{{code}}`, in your own code before you send. Escape HTML in any text a visitor typed, such as a contact form message.',
      'Send it with `POST /emails`: the HTML goes in `html`, the plain text in `text` and the subject in `subject`. See the [Quickstart](/en/quickstart/).',
    ],
    appTitle: 'For your app',
    appIntro: 'These five use placeholders like `{{code}}` and `{{app_name}}`. Each card lists them.',
    sbTitle: 'For Supabase sign-in emails',
    sbIntro: 'These replace the six emails Supabase Auth sends. They use Supabase variables such as `{{ .Token }}`, which Supabase fills in for you.',
    sb: [
      'Set up custom SMTP first: [Send with SMTP](/en/smtp/). Supabase only lets you edit templates after custom SMTP is on.',
      'In Supabase, open **Authentication** → **Emails** → **Templates** ([direct link](' + SUPABASE_URL + ')).',
      'Pick the template with the same name as the card below.',
      'Paste the subject into **Subject** and the HTML into **Body**, then press **Save changes**.',
      'Keep every variable that looks like `{{ .Token }}`. Replace only the colour, `YOUR APP` and the logo URL.',
    ],
    sbOutro: "Sign up with a new email to see the real result. Supabase's own preview can look different from a real inbox.",
    subject: 'Subject', variable: 'Variable', meaning: 'What it is', example: 'Example', supabaseName: 'Name in Supabase',
  },
  th: {
    intro: `เทมเพลตอีเมล HTML พร้อมใช้ ทั้งภาษาไทยและอังกฤษ ก๊อปไปเปลี่ยนสีกับชื่อแอป แล้วส่งด้วย mailmeow ได้เลย ทุกเทมเพลตมีตัวอย่างที่ดูได้ทันที หัวเรื่อง HTML และข้อความธรรมดา

มีสองชุด ชุดแรกใช้กับอีเมลที่โค้ดของแอปส่งผ่าน API ของ mailmeow ชุดที่สองใช้แทนอีเมลล็อกอินทั้ง 6 แบบของ Supabase Auth ที่ส่งผ่าน [SMTP](/th/smtp/)`,
    howTitle: 'วิธีใช้เทมเพลต',
    how: [
      'เลือกเทมเพลต เปิดส่วน **HTML** แล้วกดปุ่มก๊อป',
      'ด้านบนสุดของ HTML มี comment อธิบายไว้ ให้หา `#2563EB` แล้วเปลี่ยนเป็นสีของแบรนด์ และเปลี่ยนชื่อแอปกับ URL ของโลโก้ด้วย',
      'mailmeow ยังไม่เติมค่าในตัวแปรให้ ให้แทนตัวแปรแต่ละตัว เช่น `{{code}}` ในโค้ดของแอปก่อนส่ง ถ้ามีข้อความที่ผู้ใช้พิมพ์เอง เช่น ข้อความจากฟอร์มติดต่อ ให้ escape HTML ก่อน',
      'ส่งด้วย `POST /emails` ใส่ HTML ใน `html` ข้อความธรรมดาใน `text` และหัวเรื่องใน `subject` ดู [ส่งอีเมลแรก](/th/quickstart/)',
    ],
    appTitle: 'สำหรับแอปของตัวเอง',
    appIntro: 'ห้าแบบนี้ใช้ตัวแปรอย่าง `{{code}}` และ `{{app_name}}` แต่ละการ์ดบอกไว้ว่ามีตัวแปรอะไรบ้าง',
    sbTitle: 'สำหรับอีเมลล็อกอินของ Supabase',
    sbIntro: 'ชุดนี้ใช้แทนอีเมลทั้ง 6 แบบที่ Supabase Auth ส่ง ใช้ตัวแปรของ Supabase เช่น `{{ .Token }}` ซึ่ง Supabase เติมค่าให้เอง',
    sb: [
      'ตั้งค่า [ส่งผ่าน SMTP](/th/smtp/) ก่อน Supabase ให้แก้เทมเพลตได้เมื่อเปิด custom SMTP แล้วเท่านั้น',
      'ใน Supabase ไปที่ **Authentication** → **Emails** → **Templates** ([link ตรง](' + SUPABASE_URL + '))',
      'เลือกเทมเพลตที่ชื่อตรงกับการ์ดด้านล่าง',
      'วางหัวเรื่องในช่อง **Subject** และวาง HTML ในช่อง **Body** แล้วกด **Save changes**',
      'ตัวแปรที่หน้าตาแบบ `{{ .Token }}` ให้เก็บไว้ทุกตัว เปลี่ยนแค่สี `YOUR APP` และ URL ของโลโก้',
    ],
    sbOutro: 'ลองสมัครสมาชิกด้วยอีเมลใหม่เพื่อดูผลจริง ตัวอย่างในหน้า Supabase อาจต่างจากที่เห็นในกล่องอีเมลจริง',
    subject: 'หัวเรื่อง', variable: 'ตัวแปร', meaning: 'ความหมาย', example: 'ตัวอย่าง', supabaseName: 'ชื่อใน Supabase',
  },
} satisfies Record<Lang, Record<string, unknown>>;

export const TEMPLATE_LABELS = Object.fromEntries(
  (['en', 'th'] as Lang[]).map((l) => [l, { subject: T[l].subject, variable: T[l].variable, meaning: T[l].meaning, example: T[l].example, supabaseName: T[l].supabaseName, preview: l === 'th' ? 'ตัวอย่าง' : 'Preview', html: 'HTML', text: l === 'th' ? 'ข้อความธรรมดา' : 'Plain text' }]),
) as Record<Lang, { subject: string; variable: string; meaning: string; example: string; supabaseName: string; preview: string; html: string; text: string }>;

const list = (items: string[]) => items.map((s, i) => `${i + 1}. ${s}`).join('\n');

/** The variables table, shared by the Markdown body and the TemplateCard. */
export function variableRows(t: Template): { token: string; description: string; example: string }[] {
  return t.variables.map((v) => ({ token: placeholder(t.group, v.name), description: v.description, example: v.example }));
}

function mdSection(t: Template, lang: Lang): string {
  const l = T[lang];
  const head = [`### ${t.title}`, ''];
  if (t.supabaseTemplate) head.push(`${l.supabaseName}: **${t.supabaseTemplate}**`, '');
  head.push(`${l.subject}: \`${t.subject}\``, '');
  const rows = variableRows(t).map((r) => `| \`${r.token}\` | ${r.description} | ${r.example} |`);
  return [...head, `| ${l.variable} | ${l.meaning} | ${l.example} |`, '|---|---|---|', ...rows].join('\n');
}

function build(lang: Lang, card: (t: Template) => string): string {
  const l = T[lang];
  const app = APP_TEMPLATE_IDS.map((id) => card(loadTemplate(lang, id)));
  const sb = SUPABASE_TEMPLATE_IDS.map((id) => card(loadTemplate(lang, id)));
  return [
    l.intro,
    `## ${l.howTitle}\n\n${list(l.how)}`,
    `## ${l.appTitle}\n\n${l.appIntro}`,
    ...app,
    `## ${l.sbTitle}\n\n${l.sbIntro}\n\n${list(l.sb)}\n\n${l.sbOutro}`,
    ...sb,
  ].join('\n\n') + '\n';
}

export const templatesMarkdown = (lang: Lang) => build(lang, (t) => mdSection(t, lang));

export function templatesMdx(lang: Lang): string {
  const card = (t: Template) => `### ${t.title}\n\n<TemplateCard id="${t.id}" lang="${lang}" />`;
  return `import TemplateCard from '../../../components/TemplateCard.astro';\n\n${build(lang, card)}`;
}
