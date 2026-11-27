# HANDOVER — Luana Rohr Art (loja de arte autoral)

> **Status (2026-11-27):** ✅ **App no ar no Render** (deploy concluído; backend web service +
> static site, Postgres com SSL, Upstash Redis `rediss://`, Storage R2). O objetivo original deste
> documento — publicar no Render — **já foi cumprido**; daqui em diante o HANDOVER é **referência
> viva** do estado do projeto. A seção “PROMPT PARA O AGENTE” e a “ESTRATÉGIA DE DEPLOY” ficam como
> registro histórico/runbook. O resumo de tudo que evoluiu desde a criação do doc está em
> **“Evolução desde o HANDOVER inicial”**; o que ainda falta, em **“Itens em aberto”** (no fim).

> **Como usar:** abra uma **nova sessão do Claude Code com o working directory na raiz deste
> repositório** (`luana-rohr-art`, o repositório real do projeto — não o `hajel-survey-platform`
> que serviu de modelo). Para entender o projeto, leia o `CLAUDE.md` (arquitetura) e a seção
> **“1. Estado atual do projeto”** abaixo. Para reabrir o contexto do deploy original, veja o
> **“PROMPT PARA O AGENTE”**.

---

## PROMPT PARA O AGENTE

> ⚠️ **Histórico:** este prompt descreve a sessão de **deploy inicial**, que **já foi concluída**
> (app no ar no Render). Mantido como registro. Para trabalho novo, use o `CLAUDE.md` + a seção 1.

Você está no repositório **luana-rohr-art**: uma loja virtual com arte autoral,
**já implementada, testada e versionada** (clonada de `github.com/marcilioreis/luana-rohr-art`).
Leia primeiro o `CLAUDE.md` da raiz — ele descreve toda a arquitetura (módulos `products`/`orders`,
PIX EMV+CRC16, view `orders_enriched`, RBAC `product:manage`/`order:manage`, BullMQ `order-exports`,
GraphQL de vendas). **Não reescreva o domínio**; o código está pronto e passa em lint, typecheck,
build e nos testes (`backend: npm run test` → PIX/CRC16).

**Seu objetivo nesta sessão: publicar a aplicação no Render.com**, reutilizando a **instância paga
de PostgreSQL** que antes servia ao `hajel-survey-platform`. O usuário quer **zerar** essa instância
(apagar tudo do Hajel) e usá-la do zero para esta loja. Siga a seção “ESTRATÉGIA DE DEPLOY (RENDER)”
deste documento. Antes de mexer em produção:

1. Rode um **sanity check local** (opcional, mas recomendado): suba postgres+redis, `npm run
   db:migrate`, `tsx scripts/seed.ts`, `npm run dev:backend` + `dev:frontend`, e confirme
   `GET /health`, `GET /api/products`, e um checkout gerando PIX.
2. **Confirme com o usuário** o nome da instância Postgres e o `DATABASE_URL` antes de executar o
   passo destrutivo de limpeza. A limpeza é **irreversível** (apaga todos os dados do Hajel).
3. Nunca comite segredos (`.env`, chaves, tokens). Variáveis sensíveis vão no painel do Render.

Entregue ao final: serviços do Render criados/configurados, banco migrado e semeado, e um checklist
de verificação pós-deploy preenchido (health, catálogo, login admin, checkout PIX, confirmação de
pagamento, export).

---

## 1. Estado atual do projeto

- **Backend** (`backend/`): Node 20 + Express 5 + TypeScript (Drizzle ORM, PostgreSQL, BullMQ, Redis,
  Better Auth, Apollo/GraphQL, Zod). Módulos: `products`, `orders`, `admin`. PIX em
  `src/shared/pix/pix.ts` (EMV TLV + CRC16-CCITT, **Point of Initiation `11` estático**, sem gateway).
  View **`orders_enriched`** criada ao final de `drizzle/0000_init_store.sql` (após
  `--> statement-breakpoint`). Storage pluggable (`local` em dev, **R2/S3** em prod). Cache Redis
  com kill-switch e helper cache-aside (`shared/redis/cache.ts`).
- **Frontend** (`frontend/`): React 19 + Vite + Tailwind 4 + shadcn/ui + RTK Query + Recharts +
  `qrcode.react`. Loja pública (Home, Sobre, PLP, PDP), carrinho (localStorage), checkout com QR PIX
  (login **ou** convidado, com entrega por CEP/UF ou retirada sem custo), área do cliente e painel
  admin (produtos, pedidos, relatórios, usuários/papéis).
- **Catálogo (evoluído além do MVP):**
  - **Coleções** curatoriais como dados reais (schema → `/products/collections` → admin → filtro na
    PLP). Migration `0003`.
  - **Produto em destaque** no hero da Home, selecionável pelo admin (`featured`). Migration `0004`.
  - **Eixo de cor/2º eixo opcional** e **auto-seleção de variante** na PDP (peças únicas como quadros
    não mostram seletor vazio). Migration `0005` (`color` nullable).
  - **Preço sob consulta** (`priceOnRequest`): esconde preço/carrinho e mostra **CTA do WhatsApp** da
    artista. Migration `0006`.
  - **Produtos relacionados** na PDP (curadoria manual bidirecional + fallback coleção/destaque/
    recentes, cache 60s). Migration `0007`. Admin em `AdminProductForm`.
  - **Slug editável** no cadastro/edição de produto.
- **Tema & identidade visual:** redesign editorial (paleta papel/azul/vermelho, mandala, header/
  footer, favicon). **Dark mode** com toggle claro/escuro/automático (`components/theme/`, chave
  `lra-theme`, anti-flash no `index.html`). Camada de **efeitos visuais sutis** na loja. Recharts via
  `useChartColors()` (tokens `--chart-*`). Retrato da artista otimizado (WebP).
- **Entrega/checkout:** checkout **convidado** (`access_token` + `/pedido/:token`), **frete
  server-authoritative por UF** (`shared/shipping`), busca por CEP (ViaCEP), **retirada** sem custo.
  Migrations `0001`/`0002`.
- **Terminologia:** o produto é **arte autoral** (não mais “camisetas”) — rename aplicado em código e
  docs.
- **Tests** (`tests/`): Playwright — `store.spec.ts`, `admin.spec.ts`, `auth.spec.ts`,
  `related.spec.ts`. Backend: `npm run test` (`tsx --test`) → **15/15** (PIX/CRC16 + resolver de
  relacionados).
- **Infra local portável:** `RUNBOOK.md` + `setup.sh` automatizam subir o projeto em outra máquina
  WSL (deriva credenciais do `backend/.env`, garante o banco, migra e semeia).
- Verificado: lint (0 erros), typecheck, build + PWA; fluxo de pedido ponta a ponta (estoque,
  transições de status, confirmação de pagamento, RBAC 403, export BullMQ, GraphQL).

## 2. Rodar localmente (gotchas importantes)

```bash
# Postgres + Redis. ATENÇÃO: nesta máquina COMPOSE_PROJECT_NAME=ka-sf está no ambiente e faz
# "docker compose up" cair no projeto ka-sf (recria os containers de outro projeto).
# Use um nome de projeto explícito OU containers isolados:
docker compose -p luana-rohr-art up -d postgres redis
# (alternativa isolada em portas livres:)
# docker run -d --name lra-postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=luana_rohr_art -p 5433:5432 postgres:15
# docker run -d --name lra-redis -p 6380:6379 redis:7-alpine

cp backend/.env.example backend/.env    # ajuste DATABASE_URL/REDIS_URL/PIX/ADMIN
cp frontend/.env.example frontend/.env

cd backend && npm install && npm run db:migrate && npx tsx scripts/seed.ts && npm run dev   # :3000
cd ../frontend && npm install && npm run dev                                                # :5173
```
Admin semeado: `admin@luanarohr.art` / `admin12345` (configurável em `backend/.env`).

> **Better Auth + CSRF em chamadas server-to-server:** ao bater em `/api/auth/*` por `fetch`/curl
> (fora do navegador) envie o header `Origin` de uma origem confiável (ex.: `http://localhost:5173`),
> senão o login retorna 403. No navegador o `authClient` já faz isso.

> **Atalho:** `RUNBOOK.md` + `./setup.sh` automatizam este setup em outra máquina (deriva
> credenciais do `backend/.env`, garante o banco `luana_rohr_art`, migra e semeia). Gotcha conhecido:
> `COMPOSE_PROJECT_NAME=ka-sf` no ambiente desvia o `docker compose` — use `docker run` isolado
> (`lra-postgres` :5433 / `lra-redis` :6380) ou `-p luana-rohr-art`.

---

## ESTRATÉGIA DE DEPLOY (RENDER)

> ✅ **Já executado** — o app está no ar. Esta seção fica como **runbook de referência** (re-deploy,
> nova instância, troubleshooting). O passo destrutivo de limpeza do Postgres (Passo 1) **não deve
> ser repetido** sobre a instância atual, que já é a da loja.

Arquitetura de produção (mesma do Hajel): **Backend = Web Service (Node)**, **Frontend = Static
Site**, **Redis = Upstash** (compatível com BullMQ), **Postgres = a instância paga reaproveitada**,
**Storage de imagens/exports = disco local (simples) ou Cloudflare R2 (persistente)**.

### Passo 0 — Pré-requisitos
- Repositório já no GitHub: `github.com/marcilioreis/luana-rohr-art` (branch `main`).
- Uma instância **Upstash Redis** (free serve para começar) → obtenha a URL `rediss://...`.
- (Opcional, recomendado em prod) bucket **Cloudflare R2** + Access Key/Secret.
- Acesso ao painel do Render e à instância paga de PostgreSQL (a mesma do Hajel).

### Passo 1 — Zerar a instância PostgreSQL reaproveitada ⚠️ DESTRUTIVO
A instância ainda contém o schema do Hajel (tabelas `surveys`, a view `surveys_enriched`, o schema
`drizzle` com o histórico de migrações, etc.). Para reusá-la limpa:

```sql
-- Conecte com o DATABASE_URL da instância (psql "$DATABASE_URL")
-- Apaga TODAS as tabelas/views do app e o histórico de migração do Drizzle.
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
DROP SCHEMA IF EXISTS drizzle CASCADE;
-- Restaura privilégios no schema público (ajuste <DB_USER> para o owner da instância Render):
GRANT ALL ON SCHEMA public TO <DB_USER>;
GRANT ALL ON SCHEMA public TO public;
```
Depois disso o banco fica vazio e o `scripts/migrate.ts` aplicará `0000_init_store` do zero (ele cria
tabelas + a view `orders_enriched`). **Confirme o `DATABASE_URL` com o usuário antes de rodar.**

### Passo 2 — Backend (Render **Web Service**)
- **Repository:** `marcilioreis/luana-rohr-art` · **Branch:** `main` · **Auto-Deploy:** on
- **Root Directory:** `backend`
- **Runtime:** Node
- **Build Command:** `npm install && npm run build`
- **Pre-Deploy Command:** `npm run db:migrate`  *(aplica migrações antes de subir; disponível em
  planos pagos. Se indisponível, use Start Command: `npm run db:migrate && npm run start`.)*
- **Start Command:** `npm run start`  *(= `node dist/server.js`; sobe HTTP + worker BullMQ)*
- **Health Check Path:** `/health`
- Observações:
  - `tsx` e `drizzle-kit` estão em `dependencies` (não devDeps), então migrate/seed funcionam em
    produção.
  - Não defina `PORT` manualmente — o Render injeta `PORT` e o `server.ts` o respeita (`0.0.0.0`).
  - `app.ts` já faz `trust proxy` (necessário atrás do proxy do Render).

### Passo 3 — Frontend (Render **Static Site**)
- **Root Directory:** `frontend`
- **Build Command:** `npm install && npm run build`
- **Publish Directory:** `dist`
- **Rewrite Rule (SPA):** Source `/*` → Destination `/index.html` → Action **Rewrite**
- O `index.html` já tem o workaround de MIME/reload do Render Static Site.

### Passo 4 — Variáveis de ambiente

**Backend (Web Service):**
| Chave | Valor |
|---|---|
| `NODE_ENV` | `production` |
| `DATABASE_URL` | URL da instância Postgres reaproveitada (prefira a *Internal URL* se mesma região) |
| `REDIS_URL` | `rediss://...` do Upstash |
| `BETTER_AUTH_SECRET` | segredo forte novo (ex.: `openssl rand -base64 32`) |
| `BETTER_AUTH_URL` | `https://<backend>.onrender.com` |
| `FRONTEND_URL` | `https://<frontend-static>.onrender.com` (usado por CORS e trustedOrigins) |
| `PIX_KEY` / `PIX_MERCHANT_NAME` / `PIX_MERCHANT_CITY` | dados reais do recebedor PIX |
| `ADMIN_EMAIL` / `ADMIN_NAME` / `ADMIN_PASSWORD` | admin inicial (usado pelo seed) |
| `STORAGE_DRIVER` | `s3` (R2, já configurado — ver Passo 6) · `local` só para testes com disco efêmero |

**Frontend (Static Site):**
| Chave | Valor |
|---|---|
| `VITE_API_URL` | `https://<backend>.onrender.com` (inlined no build — defina ANTES de buildar) |

> **Ordem/ovo-galinha:** crie o backend primeiro para saber sua URL; defina `VITE_API_URL` e
> `BETTER_AUTH_URL`/`FRONTEND_URL` com as URLs finais e então **redeploy** de ambos. Cookies
> cross-site em `.onrender.com` são bloqueados (Public Suffix List) — o app usa **Bearer token**
> (plugin já ativo), então isso é esperado.

### Passo 5 — Migrar e semear
- Migração: feita pelo **Pre-Deploy Command** (Passo 2). Confirme nos logs
  `✅ All migrations are up to date!`.
- Seed (uma vez): no **Shell** do Web Service do backend, rode `npx tsx scripts/seed.ts`. Cria
  roles (`admin`, `cliente`), permissões, o admin inicial e 3 produtos de exemplo com variantes e
  imagens placeholder (URLs externas `placehold.co`, então a vitrine funciona sem R2).

### Passo 6 — Storage R2 para imagens/exports persistentes ✅ CONFIGURADO
Render tem filesystem efêmero (imagens enviadas pelo admin e exports somem em redeploy). Por isso o
storage usa Cloudflare R2 (`STORAGE_DRIVER=s3`). **Já configurado e validado** (upload de imagem de
produto funcionando em produção). Envs no serviço `luana-rohr-art-api` (todas como `sync: false` no
`render.yaml`, exceto PORT/SSL/REGION que têm valor fixo):
| Chave | Valor |
|---|---|
| `STORAGE_DRIVER` | `s3` |
| `STORAGE_BUCKET` | nome do bucket R2 |
| `STORAGE_ENDPOINT` | `<account_id>.r2.cloudflarestorage.com` (**só o host**, sem `https://`) |
| `STORAGE_PORT` | `443` · `STORAGE_USE_SSL` | `true` · `STORAGE_REGION` | `auto` |
| `STORAGE_ACCESS_KEY` / `STORAGE_SECRET_KEY` | credenciais R2 |
| `STORAGE_PUBLIC_URL` | URL pública do bucket, com `https://` e **sem barra no fim** |

**URL pública das imagens** (`STORAGE_PUBLIC_URL`): o `storage.save()` monta a URL como
`${STORAGE_PUBLIC_URL}/${fileName}` — o nome do bucket **não** entra nela. Hoje em uso: **Public
Development URL do R2** (`https://pub-<hash>.r2.dev`), com o aviso esperado de rate-limit (ok para
baixo tráfego). Para produção-plena, trocar por **domínio custom** (bucket → Settings → Custom
Domains; exige a zona DNS no Cloudflare) e atualizar só a env `STORAGE_PUBLIC_URL` — sem mudança de
código. Requisito em ambos os casos: **acesso público habilitado no bucket**.

Exports usam `getSignedDownloadUrl` (presigned, já tratado). Alternativa a bucket público, se um dia
quiser R2 100% privado: proxy das imagens pelo backend (over-engineering para fotos de catálogo).

> ⚠️ **Gotchas do blueprint/env (resolvidos no commit 7a8c7c2):** `STORAGE_DRIVER` é `sync: false` no
> `render.yaml` — se fosse `value: local`, o Render reverteria a cada deploy. E `STORAGE_ENDPOINT`
> ausente faz o endpoint virar `https://undefined:443` → `getaddrinfo ENOTFOUND undefined` no upload.

### Passo 7 — (Opcional) Blueprint `render.yaml`
Para IaC, o agente pode criar na raiz um `render.yaml` com os dois serviços (sem declarar o banco,
que é reaproveitado — `DATABASE_URL` entra como secret `sync: false`):

```yaml
services:
  - type: web
    name: luana-rohr-art-api
    runtime: node
    rootDir: backend
    plan: starter
    buildCommand: npm install && npm run build
    preDeployCommand: npm run db:migrate
    startCommand: npm run start
    healthCheckPath: /health
    autoDeploy: true
    envVars:
      - key: NODE_ENV
        value: production
      - key: DATABASE_URL
        sync: false
      - key: REDIS_URL
        sync: false
      - key: BETTER_AUTH_SECRET
        generateValue: true
      - key: BETTER_AUTH_URL
        sync: false
      - key: FRONTEND_URL
        sync: false
      - key: PIX_KEY
        sync: false
      - key: PIX_MERCHANT_NAME
        sync: false
      - key: PIX_MERCHANT_CITY
        sync: false
      - key: ADMIN_EMAIL
        sync: false
      - key: ADMIN_PASSWORD
        sync: false
      - key: STORAGE_DRIVER
        value: local
  - type: web
    name: luana-rohr-art-web
    runtime: static
    rootDir: frontend
    buildCommand: npm install && npm run build
    staticPublishPath: dist
    autoDeploy: true
    routes:
      - type: rewrite
        source: /*
        destination: /index.html
    envVars:
      - key: VITE_API_URL
        sync: false
```

### Passo 8 — Verificação pós-deploy (checklist)
- [ ] `GET https://<backend>/health` → `OK`
- [ ] `GET https://<backend>/api/products` → retorna os produtos semeados
- [ ] `https://<backend>/api-docs` e `/graphql` carregam
- [ ] Frontend abre; navegar Home → Sobre → Loja (PLP) → Produto (PDP)
- [ ] Login como admin (`ADMIN_EMAIL`/`ADMIN_PASSWORD`) → acessa `/admin`
- [ ] Como cliente: cadastrar, adicionar ao carrinho, checkout → QR PIX + copia-e-cola renderizam;
      pedido aparece em “Meus pedidos” como *aguardando pagamento*
- [ ] Como admin: confirmar pagamento → *pago*; avançar para *enviado*; exportar pedidos (job BullMQ
      + polling) e baixar o arquivo
- [ ] RBAC: cliente comum recebe 403 em `/api/orders` (lista admin) e `POST /api/products`
- [x] Upload de imagem de produto no admin → sobe no R2 e a `<img>` carrega pela URL pública ✅

---

## Evolução desde o HANDOVER inicial (2026-10-30)

Resumo temático do que mudou **depois** do deploy inicial (detalhes completos no `git log`):

**Infra & deploy**

- Postgres com **SSL** no app e no seed (Render exige TLS); rate-limiter **fail-open** quando o Redis
  cai; PIX com **Point of Initiation `11`** (estático, não `12`). `render.yaml` (blueprint) e storage
  **R2** corrigido (URL pública dedicada + envs do blueprint; `STORAGE_DRIVER` como `sync:false`).
- Fila de export: default job options + configuração do worker.
- Cache Redis endurecido: tratamento de erro + kill-switch + helper **cache-aside** (`cached`).
- Portabilidade: `RUNBOOK.md` + `setup.sh` para subir em outro WSL (deriva credenciais do
  `backend/.env`, garante o banco, migra e semeia).

**Checkout & entrega** (migrations `0001`/`0002`)

- Checkout **convidado** (`optionalAuthenticate` + `access_token` + `/pedido/:token`), **frete por
  UF** server-authoritative (`shared/shipping`), busca por **CEP** (ViaCEP), **retirada** sem custo.

**Catálogo**

- **Coleções** como dados reais: schema → `/products/collections` → admin → filtro na PLP
  (migration `0003`). *(Item que o doc listava como "não implementado" — agora feito.)*
- **Produto em destaque** da Home selecionável pelo admin (`featured`) — migration `0004`.
- **Eixo de cor/2º eixo opcional** + auto-seleção de variante na PDP — migration `0005`.
- **Preço sob consulta** + CTA do WhatsApp da artista — migration `0006`.
- **Slug editável** no cadastro/edição de produto.
- **Produtos relacionados** na PDP — migration `0007` (detalhe abaixo).

**UI/UX**

- Redesign editorial em fases (paleta papel/azul/vermelho, mandala, header/footer, favicon, "A obra").
- **Dark mode** com toggle claro/escuro/automático (`components/theme/`). Camada de **efeitos
  visuais** sutis na loja; hover dos gráficos suavizado.
- Retrato da artista em **WebP** (1.3MB → 58KB); botão de WhatsApp na página Sobre.
- Rename global **"camisetas" → "arte autoral"** em código e docs.

### Produtos relacionados na PDP — ✅ entregue (migration `0007`)

Estratégia **híbrida**: curadoria manual bidirecional + fallback automático. Mantido em detalhe por
ser a feature mais recente.

- **Cascata** (até o limite): manuais (admin, bidirecional por `sortOrder`) → mesma **coleção** →
  **destaques** (`featured`) → **mais recentes**. Nunca deixa a seção vazia.
- **Filtro:** exclui inativos e o próprio produto; esgotados e `priceOnRequest` **podem** aparecer.
  **Limite** via env `RELATED_PRODUCTS_LIMIT` (default 4). **Cache Redis** `related:<id>` 60s,
  invalidado em `setRelated`/`update`/`remove`.
- **Backend:** tabela `product_related` (FKs `cascade`, PK composta, índice em `related_id`, CHECK
  anti-auto-relação); `getRelatedPublic` / `getRelatedAdmin` / `setRelated` no service; rotas pública
  `GET /products/:slug/related` e admin `GET|PUT /products/manage/:id/related` (`product:manage`,
  audit `product.related.update`). Merge puro em `related.logic.ts` (`pickRelatedIds`).
- **Frontend:** `features/products/RelatedProducts.tsx` (grid na PDP, esconde se vazio) +
  `features/admin/products/RelatedProductsEditor.tsx` (curadoria no `AdminProductForm`); endpoints
  RTK em `productsApi.ts`, tag `RelatedProduct` em `lib/api.ts`.
- **Testes:** `related.test.ts` (9 casos do resolver; suíte **15/15**) + `related.spec.ts` (E2E:
  fallback, bidirecional, UI admin — **3/3**). **Nota:** o `global.setup` do E2E faz `DROP DATABASE`
  no banco do `.env.test` — rode com um banco de nome distinto para não tocar no de dev.

---

## Itens em aberto / melhorias futuras

- **Domínio custom para as imagens R2** (hoje usa a Public Development URL `r2.dev`, rate-limited):
  migrar `STORAGE_PUBLIC_URL` para um domínio custom quando o tráfego justificar (ver Passo 6).
- Avaliar servir o frontend por um **Express web service** (em vez de Static Site) se o problema de
  MIME do Render Static Site reaparecer.
