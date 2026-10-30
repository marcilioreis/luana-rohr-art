# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Luana Rohr Art — a virtual t-shirt store with product catalog (PLP/PDP), client area ("my
orders"), and an admin panel to manage products and orders. There is **no payment gateway**: the
checkout generates a dynamic **PIX "copia e cola" (BR Code EMV) with the order amount** + QR code;
the order stays *awaiting payment* until an admin confirms it manually. The codebase is split into
three packages under the repo root: `backend/`, `frontend/`, and `tests/`.

## Development Commands

### Starting services (from repo root)
```bash
docker compose up -d postgres redis   # postgres + redis only
npm run dev:backend                    # backend on :3000
npm run dev:frontend                   # frontend on :5173
```

### Backend (from `backend/`)
```bash
npm run dev              # tsx watch (hot reload)
npm run build            # tsc → dist/
npm run lint / lint:fix
npm run format           # prettier --write
npm run db:push          # drizzle-kit push (dev schema sync)
npm run db:migrate       # tsx scripts/migrate.ts (apply SQL migrations)
npm run test             # tsx --test (inclui o teste do PIX/CRC16)
tsx scripts/seed.ts      # seed roles, permissions, admin user, produtos de exemplo
```

### Frontend (from `frontend/`)
```bash
npm run dev              # vite dev server
npm run build            # tsc + vite build + build-sw.js (PWA)
npm run lint
npx shadcn@canary add    # add new shadcn/ui components
```

### E2E Tests (from `tests/`)
```bash
npx playwright test
npx playwright test specs/store.spec.ts
npx playwright test --ui
```

### Database migrations
```bash
# 1. Edit schema in backend/src/shared/db/schema/
# 2. cd backend && npx drizzle-kit generate --name <descriptive-name>
# 3. Review generated file in backend/drizzle/
# 4. npm run db:migrate
```
**Important**: `orders_enriched` is a view — always `DROP VIEW IF EXISTS orders_enriched` before
recreating it (the CREATE VIEW lives at the end of the generated migration, after a
`--> statement-breakpoint`). Keep the Drizzle schema in sync (`views.types.ts`).

## Architecture

### Backend — modular monolith
```
src/
  modules/
    products/        # PLP/PDP público + CRUD/variantes/imagens (admin, RBAC product:manage)
    orders/          # checkout (gera PIX), meus pedidos, gestão de status (admin, order:manage), export
    admin/           # usuários, papéis, audit logs
  shared/
    auth/            # Better Auth config + authenticate middleware
    db/              # Drizzle client (db), schema/index.ts
    middleware/      # loadPermissions, rbac (authorize), validate (validateBody)
    pix/             # buildPixPayload (EMV TLV) + crc16 (CCITT) — sem gateway
    queue/           # BullMQ export.queue.ts + export.worker.ts (fila "order-exports")
    redis/           # ioredis client + cache helpers
    storage/         # Pluggable storage (local em dev, Cloudflare R2 em prod)
    validation/      # Zod schemas (schemas.ts)
  graphql/           # Apollo Server (relatórios de vendas)
  app.ts / server.ts
```

**Layer rule**: `route → controller → service → db`. Controllers never import `db` directly
(exceção pontual: inserção de audit log).

**RBAC flow**: `loadPermissions` popula `req.userPermissions` (Set) e `req.isAdmin` por request
(Redis-cached 60s). Use `authorize('product:manage')` / `authorize('order:manage')` nas rotas.
Produtos têm leitura pública (GET) e gestão protegida por rota; pedidos exigem autenticação no
router inteiro (cliente vê os próprios; admin gerencia).

**ES module imports**: sempre `.js` em imports relativos.

### Frontend — React SPA
```
src/
  app/               # Redux store + typed hooks
  features/
    auth/            # Login, Register, ProtectedRoute, AdminRoute, SessionBootstrap, authSlice
    products/        # productsApi, ProductList (PLP), ProductDetail (PDP), ProductCard
    cart/            # cartSlice (localStorage) + CartDrawer
    checkout/        # CheckoutPage + PixPayment (QR + copia e cola)
    account/         # ordersApi, MyOrders, OrderDetail, OrderStatusBadge
    admin/           # Dashboard, products/*, orders/*, reports/* (GraphQL + Recharts), users/roles
    home/ about/     # Home (vitrine) e Sobre (artista)
  components/
    common/          # LazyPage, ErrorBoundary, Skeleton
    layout/          # StoreLayout (loja pública), Header + AppSidebar (admin)
    ui/              # shadcn/ui
  lib/               # api.ts (RTK baseQuery + token refresh), auth.ts, utils.ts
  routes/            # index.tsx (SessionBootstrap → StoreLayout / AdminRoute)
```

**Page code-splitting**: sempre `lazyPage()` de `components/common/LazyPage.tsx`.
**State init**: use `key` para forçar remount em vez de `useEffect`.
**Session**: `GET /api/auth/get-session` retorna `{ user, session, permissions, roles }`,
carregado uma vez por `SessionBootstrap` na raiz e consumido por `ProtectedRoute`/`AdminRoute`.
**Carrinho**: client-side em localStorage (`cartSlice`).

## Code Conventions

- **Prettier**: aspas simples (backend) / duplas (frontend via config), ponto-e-vírgula, 2 espaços,
  100 colunas, trailing commas (ES5), LF.
- **ESLint**: parâmetros não usados com prefixo `_`; `any` proibido (use `unknown` + type guards;
  exceções `(Redis as any)`); `console.log` banido — use `console.info/warn/error`.
- **Mensagens de erro** em português: `'Produto não encontrado'`, `'Acesso negado'`,
  `'Estoque insuficiente'`.
- **Commits**: `feat:`, `fix:`, `docs:`, `refactor:`, `test:`, `chore:`.

## Key Business Rules

- **Status do pedido** é **armazenado** (workflow real persistido na coluna `status`):
  `aguardando_pagamento` → `pago` → `enviado` → `entregue` | `cancelado`. Transições válidas são
  checadas no `orders.service` (`isValidTransition`). Cancelar devolve o estoque.
- **Estoque por variante**: a baixa de estoque no checkout é atômica (`UPDATE ... WHERE stock >= qty`)
  e nunca fica negativa; estoque insuficiente → 409.
- **PIX**: payload EMV TLV + **CRC16-CCITT** implementados à mão em `shared/pix/pix.ts`
  (campos 00/26 `br.gov.bcb.pix`+chave/52/53/54 valor/58/59/60/62 txid/63 CRC). Chave e recebedor
  vêm de env (`PIX_KEY`, `PIX_MERCHANT_NAME`, `PIX_MERCHANT_CITY`). O QR é renderizado no frontend.
- **Export de pedidos** via BullMQ (`export.queue.ts` / `export.worker.ts`, fila `order-exports`).
  O frontend faz polling de `GET /api/orders/exports/:id/status` até concluir e baixa o arquivo.
- **Relatórios de vendas** via GraphQL (`salesSummary`, `ordersByStatus`, `topProducts`,
  `revenueByPeriod`); faturamento considera status `pago`/`enviado`/`entregue`.
- **Imagens**: `StorageProvider` pluggable (disco local em dev, R2 em prod); upload base64 →
  `product:manage`.

## Known Issues & Workarounds

- **Upstash Redis + BullMQ**: sempre BullMQ (nunca Bull). Opções ioredis obrigatórias:
  `maxRetriesPerRequest: null`, `enableReadyCheck: false`, `tls: { rejectUnauthorized: false }`,
  `family: 0`.
- **Cross-site cookies on Render**: `.onrender.com` está na Public Suffix List — cookies
  `SameSite=None` são bloqueados. Use Bearer token (plugin ativo). Em chamadas server-to-server ao
  Better Auth, envie o header `Origin` de uma origem confiável (CSRF).
- **Frontend MIME type on Render Static Site**: acesso direto a rota pode servir CSS como
  `text/plain`. `index.html` tem script de reload; a correção definitiva é servir via Express.

## Infrastructure

- **Local**: PostgreSQL + Redis via Docker Compose. **Backend**: 3000 · **Frontend**: 5173 ·
  **Health**: `GET /health`. **Swagger**: `/api-docs`. **GraphQL**: `/graphql`.
- **Produção**: Render (backend + static site), Cloudflare R2, Upstash Redis.

## Claude Code Setup (.claude/)

- **Skills**: `loja-feature-builder` (feature ponta a ponta), `drizzle-migrations` (regra da view
  `orders_enriched`), `fix-redis-connection`, `rbac-endpoint`, `deep-review` (checklists da loja:
  PIX/CRC16, estoque, preços, transições de status).
- **Subagents**: `code-reviewer` (revisão de diff), `db-migrator` (schema/migrations),
  `e2e-runner` (Playwright).
- **Slash commands**: `/review`, `/new-feature`, `/generate-migration`, `/run-e2e`, `/codebase`,
  `/commit`.
- **settings.json**: permissões e bloqueio de leitura de segredos (`.env`, chaves, `exports/`).

Consulte `.claude/README.md` para detalhes.
