// Email templates: the source files in templates/{lang}/{id}.{html,txt,json}. The docs page and the unit test read them from here.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Lang } from './pages';

export const APP_TEMPLATE_IDS = ['otp', 'welcome', 'reset-password', 'receipt', 'contact-form'] as const;
export const SUPABASE_TEMPLATE_IDS = [
  'supabase-confirm-signup',
  'supabase-magic-link',
  'supabase-reset-password',
  'supabase-change-email',
  'supabase-invite',
  'supabase-reauthentication',
] as const;
export const TEMPLATE_IDS: string[] = [...APP_TEMPLATE_IDS, ...SUPABASE_TEMPLATE_IDS];

/** Variables Supabase Auth gives each template, as listed in supabase/supabase
 *  apps/studio/components/interfaces/Auth/EmailTemplates/AuthTemplatesValidation.tsx. */
const LINK_VARS = ['ConfirmationURL', 'Token', 'TokenHash', 'SiteURL', 'Email', 'Data', 'RedirectTo'];
export const SUPABASE_VARS: Record<string, string[]> = {
  'supabase-confirm-signup': LINK_VARS,
  'supabase-magic-link': LINK_VARS,
  'supabase-reset-password': LINK_VARS,
  'supabase-change-email': [...LINK_VARS, 'NewEmail'],
  'supabase-invite': LINK_VARS,
  'supabase-reauthentication': ['Token', 'SiteURL', 'Email', 'Data'],
};

export interface TemplateVariable { name: string; description: string; example: string }
export interface TemplateMeta {
  id: string;
  group: 'app' | 'supabase';
  title: string;
  /** The name Supabase's dashboard shows (supabase group only). */
  supabaseTemplate?: string;
  subject: string;
  preheader: string;
  previewHeight: number;
  variables: TemplateVariable[];
  /** Every variable Supabase gives this template (supabase group only). */
  available?: string[];
}
export interface Template extends TemplateMeta { lang: Lang; html: string; text: string }

const dir = (lang: Lang) => join(process.cwd(), 'templates', lang);

/** The exact text a template uses for one variable: `{{code}}` or `{{ .Token }}`. */
export const placeholder = (group: TemplateMeta['group'], name: string) => (group === 'supabase' ? `{{ .${name} }}` : `{{${name}}}`);

export function loadTemplate(lang: Lang, id: string): Template {
  const read = (ext: string) => readFileSync(join(dir(lang), `${id}.${ext}`), 'utf8');
  return { ...(JSON.parse(read('json')) as TemplateMeta), lang, html: read('html'), text: read('txt') };
}

export function loadTemplates(lang: Lang, group?: TemplateMeta['group']): Template[] {
  const all = TEMPLATE_IDS.map((id) => loadTemplate(lang, id));
  return group ? all.filter((t) => t.group === group) : all;
}

/** The HTML with every placeholder swapped for its example value, for the live preview. */
export function previewHtml(t: Template): string {
  let out = t.html;
  for (const v of t.variables) out = out.replaceAll(placeholder(t.group, v.name), v.example);
  return out;
}
