import type { APIRoute } from 'astro';
import { buildPages, llmsTxt } from '../lib/pages';

export const GET: APIRoute = () => new Response(llmsTxt(buildPages()), { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
