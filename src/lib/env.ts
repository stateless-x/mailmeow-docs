type Env = Record<string, string | undefined>;

/** Only PUBLIC_ENV=production produces an indexable site (same rule as mailmeow-public). */
export function isProduction(env: Env): boolean {
  return env.PUBLIC_ENV === 'production';
}

/** SITE.md: production allows every crawler, AI training crawlers included. List agents here to block them. */
export const BLOCKED_CRAWLERS: string[] = [];

export function renderRobots(prod: boolean, site: string): string {
  if (!prod) return 'User-agent: *\nDisallow: /\n';
  const blocked = BLOCKED_CRAWLERS.map((ua) => `User-agent: ${ua}\nDisallow: /\n`).join('\n');
  return `${blocked ? blocked + '\n' : ''}User-agent: *\nAllow: /\n\nSitemap: ${site}/sitemap-index.xml\n`;
}
