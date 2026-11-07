// src/shared/redis/cache.ts
import { redis } from './index.js';

/**
 * Cache resiliente:
 * - Desligável via REDIS_CACHE_ENABLED=false (kill switch).
 * - Falha de Redis NUNCA propaga para o caller — retorna null / no-op.
 * - JSON inválido no cache é tratado como miss.
 */
const CACHE_ENABLED = process.env.REDIS_CACHE_ENABLED !== 'false';

export async function cacheGet<T>(key: string): Promise<T | null> {
  if (!CACHE_ENABLED) return null;
  try {
    const val = await redis.get(key);
    if (!val) return null;
    return JSON.parse(val) as T;
  } catch (err) {
    console.warn(`⚠️ cacheGet falhou [${key}]:`, (err as Error).message);
    return null;
  }
}

export async function cacheSet(key: string, value: unknown, ttlSeconds = 300): Promise<void> {
  if (!CACHE_ENABLED) return;
  try {
    await redis.set(key, JSON.stringify(value), 'EX', ttlSeconds);
  } catch (err) {
    console.warn(`⚠️ cacheSet falhou [${key}]:`, (err as Error).message);
  }
}

export async function cacheDel(key: string): Promise<void> {
  if (!CACHE_ENABLED) return;
  try {
    await redis.del(key);
  } catch (err) {
    console.warn(`⚠️ cacheDel falhou [${key}]:`, (err as Error).message);
  }
}

/**
 * Cache-aside helper: tenta cache, cai no loader, popula o cache.
 * Falha de cache é silenciosa; falha do loader ainda propaga (é erro real).
 */
export async function cached<T>(
  key: string,
  ttlSeconds: number,
  loader: () => Promise<T>
): Promise<T> {
  const hit = await cacheGet<T>(key);
  if (hit !== null) return hit;
  const fresh = await loader();
  await cacheSet(key, fresh, ttlSeconds);
  return fresh;
}
