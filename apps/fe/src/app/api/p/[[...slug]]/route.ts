import { handle } from 'hono/vercel';
import { proxyApp } from '@/libs/utils/proxy-api';

export const runtime = 'nodejs';

export const GET = handle(proxyApp);
export const POST = handle(proxyApp);
export const PUT = handle(proxyApp);
export const DELETE = handle(proxyApp);
export const PATCH = handle(proxyApp);
export const HEAD = handle(proxyApp);
export const OPTIONS = handle(proxyApp);
