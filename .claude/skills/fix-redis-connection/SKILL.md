---
name: fix-redis-connection
description: >-
  Use para diagnosticar e corrigir problemas de conexão Redis na loja Luana Rohr
  Art, especialmente com Upstash em produção (Render) e com filas BullMQ. Cobre
  erros como MaxRetriesPerRequestError, "Connection is closed", timeouts e falhas
  de worker. Conhece as opções exatas do cliente ioredis usadas no projeto.
---

# Corrigir conexão Redis

O cliente fica em `backend/src/shared/redis/index.ts`. Filas em `shared/queue/`.

## Diagnóstico
1. Confira variáveis: `REDIS_URL` (use `rediss://` para Upstash com TLS). Há também
   `UPSTASH_REDIS_REST_URL` em alguns ambientes — mas o BullMQ usa a conexão ioredis, não REST.
2. Teste conectividade rápida: num script ou REPL, `await redis.ping()` deve retornar `PONG`.
3. Identifique o erro:
   - `MaxRetriesPerRequestError` → `maxRetriesPerRequest` não está `null`.
   - `enableReadyCheck`/erro ao reusar cliente no BullMQ → `enableReadyCheck: false` ausente.
   - `Connection is closed` → ajustar `connectTimeout`/`keepAlive` e `reconnectOnError`.
   - Falha só em cloud (Render/Fly) → faltou `family: 0` (resolução IPv6).
   - TLS/handshake → URL não é `rediss://` ou faltou `tls: { rejectUnauthorized: false }`.

## Opções obrigatórias do cliente (Upstash + BullMQ)
O `redisOptions` deve conter:
```ts
maxRetriesPerRequest: null,
enableReadyCheck: false,
family: 0,                                   // IPv6 — essencial em Render/Upstash
tls: url.startsWith('rediss://') ? { rejectUnauthorized: false } : undefined,
connectTimeout: 20000,
keepAlive: 5000,
reconnectOnError(err) {                       // reconecta em READONLY/ECONNRESET/etc.
  return ['READONLY','ECONNRESET','ECONNREFUSED','CLOSED']
    .some((m) => err.message.includes(m));
},
```
O cliente é criado com `new (Redis as any)(redisUrl, redisOptions)` — o `as any` é a
única exceção permitida ao `any` (compatibilidade ioredis).

## BullMQ
- Nunca use o Bull original — só **BullMQ** (foi a causa de incompatibilidade com Upstash).
  A fila de exportação de pedidos chama-se `order-exports` (`shared/queue/export.queue.ts`).
- O worker deve **reutilizar a mesma instância** Redis exportada de `shared/redis/index.ts`,
  não criar uma conexão padrão nova.
- Jobs lentos (export de pedidos) rodam em worker separado; garanta atualização de status
  para `falha` no catch.

## Validação final
Suba `docker-compose up -d redis` em dev ou confirme a URL Upstash em prod, reinicie o
backend e verifique nos logs a mensagem de conexão. Rode um job de export de ponta a ponta.
