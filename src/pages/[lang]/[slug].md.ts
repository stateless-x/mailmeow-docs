import type { APIRoute, GetStaticPaths } from 'astro';
import { buildPages, toMarkdown } from '../../lib/pages';

export const getStaticPaths: GetStaticPaths = () => buildPages().map((p) => ({ params: { lang: p.lang, slug: p.slug }, props: { md: toMarkdown(p) } }));

export const GET: APIRoute = ({ props }) => new Response(props.md as string, { headers: { 'Content-Type': 'text/markdown; charset=utf-8' } });
