import type { APIRoute } from 'astro';
import { buildPages, llmsFullTxt } from '../lib/pages';

export const GET: APIRoute = () => new Response(llmsFullTxt(buildPages()), { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
