// src/shared/redis/index.ts
import Redis from 'ioredis';

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

const redisOptions: Record<string, any> = {
  // Essencial para o Bull e para evitar o MaxRetriesPerRequestError
  maxRetriesPerRequest: null,
  // Exigido pelo Bull em versões recentes ao reutilizar um cliente Redis
  enableReadyCheck: false,
  // Força a conexão ao criar o cliente
  lazyConnect: false,
  // Estratégia de retry: tenta reconectar até 10 vezes, com um pequeno delay.
  retryStrategy(times: number) {
    if (times > 20) {
      console.error(`❌ Redis: número máximo de tentativas de conexão excedido (${times}).`);
      return undefined; // para de tentar reconectar após 20 tentativas
    }
    const delay = Math.min(times * 200, 5000);
    console.warn(`🔄 Redis: tentando reconectar em ${delay}ms (tentativa ${times})`);
    return delay;
  },
  // Habilita TLS automaticamente se a URL começa com rediss://
  tls: redisUrl.startsWith('rediss://') ? { rejectUnauthorized: false } : undefined,
  // Força a resolução de DNS para IPv6, que resolve problemas de conectividade
  // com o Upstash em certos ambientes de cloud (Render, Fly.io, etc.).
  family: 0,
  // Solução para o erro "Connection is closed":
  // Faz o ioredis não esperar indefinidamente por comandos de bloqueio.
  connectTimeout: 20000,
  disconnectTimeout: 0,
  // Mantém a conexão TCP ativa, evitando que firewalls ou proxies a derrubem.
  keepAlive: 5000,
  // Reconecta automaticamente em erros de conexão (ECONNRESET, ECONNREFUSED, READONLY).
  reconnectOnError(err: Error) {
    const targetErrors = ['READONLY', 'ECONNRESET', 'ECONNREFUSED', 'CLOSED'];
    const shouldReconnect = targetErrors.some((msg) => err.message.includes(msg));
    if (shouldReconnect) {
      console.warn('🔄 Redis: reconectando devido a erro:', err.message);
    }
    return shouldReconnect;
  },
};

console.info(
  `🔌 [Redis] Conectando a ${redisUrl.startsWith('rediss://') ? 'Upstash' : 'Redis local'}...`
);
export const redis = new (Redis as any)(redisUrl, redisOptions);
