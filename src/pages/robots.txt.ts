import type { APIRoute } from 'astro';
import { SITE } from '../lib/pages';
import { isProduction, renderRobots } from '../lib/env';

export const GET: APIRoute = () =>
  new Response(renderRobots(isProduction(import.meta.env as Record<string, string | undefined>), SITE), {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
