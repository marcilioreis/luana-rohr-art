---
name: rbac-endpoint
description: >-
  Use ao proteger um endpoint com RBAC na loja Luana Rohr Art, criar uma
  permissão nova, depurar 401/403, ou entender como permissões e roles fluem do
  banco até req.userPermissions. Cobre loadPermissions, authorize, o atalho
  req.isAdmin, o cache Redis de 60s e a invalidação necessária após mudar permissões.
---

# RBAC — proteger endpoints e gerenciar permissões

Arquivos-chave:
- `backend/src/shared/middleware/loadPermissions.ts` — carrega permissões por request.
- `backend/src/shared/middleware/rbac.ts` — `authorize`, `hasPermission`, `hasPermissions`.
- Schema em `backend/src/shared/db/schema/rbac.ts`.
- Seed de roles/permissões em `backend/scripts/seed.ts`.

Permissões da loja: `product:manage`, `order:manage`, `order:view`, `user:manage`,
`role:manage`, `audit:view`. Roles: `admin` (todas), `cliente` (nenhuma administrativa).

## Como o fluxo funciona
1. `authenticate` (Better Auth, plugin `bearer` ativo) identifica `req.user`.
2. `loadPermissions` roda **uma vez por request**: monta `req.userPermissions` (Set de
   códigos, direto de `user_permissions` + herdadas via `user_roles`→`role_permissions`)
   e `req.isAdmin` (true se `user.role === 'admin'`). Usa cache Redis
   `permissions:${userId}` com TTL **60s**.
3. `authorize(required)` checa o Set. Aceita:
   - string: `authorize('product:manage')`
   - array (modo `all`): `authorize(['order:manage','order:view'])`
   - objeto: `authorize({ any: ['a','b'] })` ou `authorize({ all: ['a','b'] })`
   - `req.isAdmin === true` **passa direto** (atalho de admin).

## Proteger uma rota
As rotas de **gestão de produto** aplicam o pipeline por rota (produto tem GET público):
```ts
const manage = [authenticate, loadPermissions, authorize('product:manage')];
router.post('/', ...manage, validateBody(createProductSchema), controller.createProduct);
```
No módulo **orders**, `authenticate` + `loadPermissions` são aplicados no router inteiro
(`router.use(...)`); as rotas admin acrescentam `authorize('order:manage')` e as do cliente
checam posse no controller. Garanta que a rota está sob o pipeline certo (GET de produto é
público e **não** deve ter guarda).

## Criar uma permissão nova
1. Adicione o código (ex.: `coupon:manage`) ao seed em `scripts/seed.ts`, vinculando às
   roles apropriadas (ex.: `admin`).
2. Rode `tsx scripts/seed.ts` para popular.
3. Use `authorize('coupon:manage')` na rota.

## Invalidação de cache (bug comum de staleness)
Qualquer mutação que altere roles/permissões de um usuário **deve** invalidar o cache:
```ts
await redis.del(`permissions:${userId}`);
```
Sem isso, o usuário continua com o conjunto antigo por até 60s. Verifique isso em
`admin.service.ts` ao atribuir/remover roles ou permissões diretas.

## Depurar 401/403
- **401**: sem `req.user` → token Bearer ausente/expirado. No frontend, confira
  `auth-token` no storage e o refresh em `lib/api.ts`. Lembre que `.onrender.com` bloqueia
  cookies `SameSite=None` — o projeto usa Bearer. Em chamadas server-to-server ao Better
  Auth, envie o header `Origin` de uma origem confiável (CSRF), senão retorna 403.
- **403**: autenticado mas sem a permissão. Confira o código exato em `authorize`
  (`product:manage`/`order:manage`), se a permissão está no seed e vinculada à role do
  usuário, e se o cache não está stale (force `redis.del` e teste de novo).
