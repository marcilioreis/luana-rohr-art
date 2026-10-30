---
name: loja-feature-builder
description: >-
  Use ao adicionar uma feature de ponta a ponta na loja Luana Rohr Art (ex.: novo
  recurso de produto/variante, nova etapa de pedido, novo endpoint de relatório de
  vendas, novo recurso de admin) ou ao gerar código que precise seguir os padrões
  do projeto. Cobre a ordem correta das camadas no backend (Zod → service →
  controller → route → RBAC), o padrão de feature slice no frontend (RTK Query +
  lazyPage), filas BullMQ e migrations. Não use para fixes pontuais sem nova
  superfície de API.
---

# Loja Feature Builder

Guia para implementar uma feature completa respeitando a arquitetura da loja
**Luana Rohr Art**. Leia o `CLAUDE.md` da raiz para contexto arquitetural antes de começar.

## Antes de codar
1. Identifique o módulo backend afetado: `products`, `orders`, `admin`. Identifique a
   feature frontend correspondente em `frontend/src/features/`
   (`products`, `cart`, `checkout`, `account`, `admin`).
2. Decida se a feature precisa de: migration (mudança de schema), permissão RBAC nova
   (`product:manage`, `order:manage`, `order:view`), job de fila (export de pedidos),
   endpoint GraphQL (relatórios de vendas).

## Backend — ordem das camadas (route → controller → service → db)
Implemente nesta sequência:

1. **Schema Zod** em `backend/src/shared/validation/schemas.ts`. Exporte o schema
   e o tipo inferido. Mensagens em português.
2. **Service** em `src/modules/<modulo>/<modulo>.service.ts`. É a **única** camada que
   toca o `db` (Drizzle). Toda query vive aqui. Lance erros com mensagem em português
   (`'Produto não encontrado'`, `'Estoque insuficiente'`, `'Transição inválida: ...'`).
3. **Controller** em `<modulo>.controller.ts`. Recebe `req/res`, chama o service,
   formata a resposta e os status codes. **Nunca importa `db` nem monta query**
   (exceção pontual: inserir audit log). Traduza erro de domínio → status HTTP
   (ex.: `Estoque insuficiente` → 409; `Transição inválida` → 400).
4. **Route** em `<modulo>.routes.ts`. Monta a rota com middlewares na ordem:
   `authorize('permissao:code')` → `validateBody(schema)` → `controller.handler`.
   Adicione o bloco de doc `@openapi` (Swagger) como nas rotas existentes.

Regras inegociáveis: imports relativos terminam em `.js`; sem `any`
(use `unknown` + type guard); sem `console.log`; params não usados com `_`.

Veja `references/backend-feature.md` para um esqueleto copiável das 4 camadas.

## RBAC
Se a feature precisa de permissão nova, ela é semeada em `scripts/seed.ts`
(roles/permissions). Proteja a rota com `authorize('recurso:acao')`
(`product:manage`, `order:manage`, `order:view`). Produtos têm leitura **pública**
(GET de PLP/PDP) e gestão protegida **por rota**; o router de pedidos exige
autenticação inteiro (cliente vê os próprios; admin gerencia). `req.isAdmin` passa
direto. Permissões são carregadas por `loadPermissions` (cache Redis 60s); qualquer
mutação que altere permissões de um usuário deve invalidar `permissions:${userId}`.

## Filas (BullMQ) — só para trabalho pesado/assíncrono
Ex.: exportação de pedidos (CSV/PDF/XLSX). Adicione o produtor em
`shared/queue/export.queue.ts` (fila `order-exports`) e o processamento em
`export.worker.ts`. Reutilize a instância Redis compartilhada (nunca crie conexão
padrão). Job deve atualizar status para `falha` no catch. O frontend faz polling em
`GET /api/orders/exports/:id/status` (≤ 2s, limite de tentativas) e baixa ao concluir.

## Frontend — feature slice
Em `frontend/src/features/<feature>/`:
1. **Tipos** em `<feature>.types.ts` (ou `products.types.ts` / `orders.types.ts`).
2. **API slice** em `<feature>Api.ts` com RTK Query (`injectEndpoints` sobre o `api`
   base de `lib/api.ts`). Defina `providesTags`/`invalidatesTags` usando as tags já
   registradas (`Product`, `AdminProduct`, `Order`, `AdminOrder`, `Cart`,
   `AdminUser`, `AdminRole`). Nunca duplique nome de endpoint entre slices.
3. **Componentes** funcionais, props tipadas, shadcn de `@/components/ui/...`.
   Estilo via Tailwind + `cn()`. Valores monetários via `utils/format.ts` (`formatBRL`).
   Sem `any`.
4. **Páginas** sempre via `lazyPage()` (de `components/common/LazyPage.tsx`).
5. **Init de estado**: use prop `key` para remontar; evite `useEffect` para inicializar.
6. Registre a rota em `src/routes/index.tsx`, sob `StoreLayout` (loja/conta) ou
   `AdminRoute` (admin), protegendo com `ProtectedRoute`/`AdminRoute` conforme o caso.
   A sessão é carregada uma vez por `SessionBootstrap` na raiz.

Veja `references/frontend-feature.md` para o esqueleto do slice e componente.

## Migration
Se mudou schema, use a skill `drizzle-migrations` (gerar, revisar, aplicar; cuidado
com a view `orders_enriched` e com `views.types.ts`).

## Fechamento
- Rode lint/format: `npm run lint` e `npm run format` (em backend e/ou frontend).
- Sugira/escreva um teste E2E (Playwright) cobrindo o caminho feliz e um erro
  (ex.: 409 estoque insuficiente, 403 sem permissão).
- Commit no formato convencional: `feat(backend): ...` / `feat(frontend): ...`.
