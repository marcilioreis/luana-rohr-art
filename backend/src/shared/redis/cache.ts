// src/shared/redis/cache.ts
import { redis } from './index.js';

export async function cacheGet<T>(key: string): Promise<T | null> {
  const val = await redis.get(key);
  return val ? JSON.parse(val) : null;
}

export async function cacheSet(key: string, value: unknown, ttlSeconds = 300) {
  // ioredis aceita argumentos posicionais
  await redis.set(key, JSON.stringify(value), 'EX', ttlSeconds);
}
