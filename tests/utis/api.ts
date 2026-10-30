// tests/utis/api.ts
import { request } from '@playwright/test';
import type { APIRequestContext } from '@playwright/test';

const BASE_URL = 'http://localhost:3000';
const ORIGIN = 'http://localhost:5173';

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@luanarohr.art';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin12345';

/** Faz login e retorna o Bearer token do Better Auth. */
export async function adminToken(): Promise<string> {
  const ctx = await request.newContext({ baseURL: BASE_URL });
  const res = await ctx.post('/api/auth/sign-in/email', {
    headers: { Origin: ORIGIN },
    data: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD },
  });
  const token = res.headers()['set-auth-token'];
  await ctx.dispose();
  if (!token) throw new Error('Falha ao obter token de admin');
  return token;
}

/** Contexto autenticado como admin (header Authorization). */
export async function adminApi(): Promise<APIRequestContext> {
  const token = await adminToken();
  return request.newContext({
    baseURL: BASE_URL,
    extraHTTPHeaders: { Authorization: `Bearer ${token}`, Origin: ORIGIN },
  });
}

/** Retorna o slug do primeiro produto ativo do catálogo. */
export async function firstProductSlug(): Promise<string> {
  const ctx = await request.newContext({ baseURL: BASE_URL });
  const res = await ctx.get('/api/products');
  const products = (await res.json()) as Array<{ slug: string }>;
  await ctx.dispose();
  if (!products.length) throw new Error('Nenhum produto semeado');
  return products[0].slug;
}
