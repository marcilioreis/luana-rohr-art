# RUNBOOK — Rodar a loja Luana Rohr Art em outra máquina (WSL Ubuntu)

Guia para portar a configuração atual e rodar o projeto do mesmo jeito em outro
computador/ambiente (WSL Ubuntu). Segue a configuração **isolada** que a máquina
atual usa: containers `lra-postgres` (porta **5433**) e `lra-redis` (porta **6380**),
evitando o conflito com o projeto `ka-sf` (ver seção _Gotchas_).

> Resultado final: backend em `http://localhost:3000`, frontend em
> `http://localhost:5173`, banco e Redis em Docker, dados de exemplo semeados.

---

## 0. Pré-requisitos (instalar uma vez no WSL Ubuntu)

```bash
sudo apt update
sudo apt install -y git curl postgresql-client   # psql é usado no teardown do E2E

# Docker: use Docker Desktop (Windows) com integração WSL habilitada,
# OU instale o engine no WSL. Teste (basta o docker "cru"):
docker --version && docker ps
# OBS.: este fluxo NÃO usa `docker compose` — tudo roda com `docker run`
# (setup.sh / seção 3). Se faltar o plugin do compose, pode ignorar; para
# instalá-lo mesmo assim (opcional): sudo apt install -y docker-compose-plugin

# Node 20.19+ (o projeto exige >=20.19.0; 20.x ou 22.x funcionam). Via nvm:
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
# reabra o terminal, então:
nvm install 22 && nvm use 22
node -v    # deve ser >= 20.19.0
```

A versão fixada está em `.nvmrc` (`20.19.0`). Se preferir, `nvm install` dentro do
repo respeita esse arquivo.

---

## 1. Clonar o repositório

```bash
git clone git@github.com:marcilioreis/luana-rohr-art.git
cd luana-rohr-art
```

(Precisa da sua chave SSH do GitHub configurada na nova máquina, ou use a URL HTTPS.)

---

## 2. Variáveis de ambiente

Os arquivos `.env` **não** vão no git (só os `.env.example`). Há duas formas:

### Opção A — Copiar os `.env` da máquina atual (recomendado, replica idêntico)

Copie com segurança (pen drive, `scp`, gerenciador de senhas…) estes arquivos da
máquina antiga para os mesmos caminhos na nova:

- `backend/.env`   ← contém segredos reais (R2, SMTP, PIX, BETTER_AUTH_SECRET)
- `frontend/.env`
- `.env` (raiz, usado só pelo docker-compose — opcional neste fluxo isolado)
- `tests/.env.test` (se for rodar o E2E completo)

### Opção B — Recriar a partir dos `.env.example`

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
cp .env.example .env
```

E preencha. Valores **de desenvolvimento local** conhecidos (seguros):

**`backend/.env`** (os segredos de produção — R2/SMTP/PIX real — copie da máquina antiga):
```env
NODE_ENV=development
PORT=3000
DATABASE_URL=postgresql://postgres:postgres@localhost:5433/luana_rohr_art
REDIS_URL=redis://localhost:6380
BETTER_AUTH_URL=http://localhost:3000
BETTER_AUTH_SECRET=<gere com: openssl rand -base64 32>
FRONTEND_URL=http://localhost:5173

# Admin inicial criado pelo seed (se omitir, usa admin@luanarohr.art / admin12345)
ADMIN_EMAIL=admin@luanarohr.art
ADMIN_NAME=Admin
ADMIN_PASSWORD=admin12345

# PIX (exemplos para dev; em produção são os dados reais do recebedor)
PIX_KEY=luana.rohr.art@example.com
PIX_MERCHANT_NAME=LUANA ROHR ART
PIX_MERCHANT_CITY=SAO PAULO

# Storage: 'local' em dev (disco). 'local' dispensa as STORAGE_* de R2.
STORAGE_DRIVER=local

# SMTP: opcional em dev — sem isso o Better Auth cria uma conta de teste
# Ethereal automaticamente (os e-mails não saem de verdade).
# SMTP_HOST= / SMTP_PORT= / SMTP_SECURE= / SMTP_USER= / SMTP_PASS= / SMTP_FROM=

# R2 (só se STORAGE_DRIVER=s3) — copie da máquina antiga:
# STORAGE_BUCKET= / STORAGE_ENDPOINT= / STORAGE_PUBLIC_URL= /
# STORAGE_ACCESS_KEY= / STORAGE_SECRET_KEY= / STORAGE_PORT=443 /
# STORAGE_USE_SSL=true / STORAGE_REGION=auto
```

**`frontend/.env`**:
```env
VITE_API_URL=http://localhost:3000
```

> O `DATABASE_URL`/`REDIS_URL` acima casam com os containers da seção 3. Se você
> usar outras portas, ajuste aqui.

---

## Atalho: `setup.sh` (automatiza os passos 3–6)

Depois de criar os `.env` (seção 2), dá para rodar tudo de uma vez:

```bash
./setup.sh              # containers + deps + migrate + seed + sobe os servidores
./setup.sh --no-run     # só prepara (3–5), sem subir os servidores
./setup.sh --with-tests # instala também as deps de tests/ (E2E)
./setup.sh --reset-db   # recria o Postgres do zero (APAGA os dados) + resseed
./setup.sh --help
```

> O script **lê usuário/senha/banco/porta do `DATABASE_URL` (e a porta do
> `REDIS_URL`) em `backend/.env`** e cria o container do Postgres batendo com
> isso — não importa se seu usuário é `postgres`, `marcilioreis`, etc. Se já
> existir um `lra-postgres` com credenciais diferentes, o script avisa e você
> roda `./setup.sh --reset-db` para recriá-lo.

O script é idempotente (reaproveita containers existentes, seed sem duplicar). As
seções abaixo descrevem os mesmos passos manualmente, caso prefira.

---

## 3. Banco de dados + Redis (containers isolados)

> Prefira o `setup.sh` (acima): ele cria o container derivando usuário/senha/
> banco/porta do seu `DATABASE_URL`. Faça manual só se quiser.

Cria os containers nas **mesmas portas** que o `.env` espera (5433 / 6380). Não use
`docker compose up` nesta máquina — veja _Gotchas_.

> ⚠️ `POSTGRES_USER`/`POSTGRES_PASSWORD`/`POSTGRES_DB`/porta precisam ser
> **idênticos** ao `DATABASE_URL` do seu `backend/.env`. Se o seu usuário não é
> `postgres` (ex.: `marcilioreis`), ajuste os `-e POSTGRES_*` abaixo. Esses
> valores só valem num **volume novo** — se o container já existe com credenciais
> diferentes, remova antes (`docker rm -f lra-postgres`).

```bash
# Ajuste POSTGRES_USER/PASSWORD/DB e a porta para casar com o seu DATABASE_URL:
docker run -d --name lra-postgres \
  -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=luana_rohr_art \
  -p 5433:5432 postgres:15

docker run -d --name lra-redis \
  -p 6380:6379 redis:7-alpine

# conferir
docker ps --format '{{.Names}} {{.Ports}}' | grep lra
```

Para parar/reiniciar depois: `docker stop lra-postgres lra-redis` /
`docker start lra-postgres lra-redis` (os dados do Postgres persistem no container).

---

## 4. Instalar dependências

```bash
npm install --prefix backend
npm install --prefix frontend
npm install --prefix tests        # só se for rodar E2E
```

---

## 5. Migrar e semear o banco

```bash
cd backend
npm run db:migrate        # aplica as migrations 0000..0004 (cria tabelas + view orders_enriched)
npx tsx scripts/seed.ts   # papéis, permissões, admin, 3 coleções e 3 produtos de exemplo
cd ..
```

`db:migrate` deve terminar com `✅ All migrations are up to date!`. O seed é
idempotente (pode rodar de novo sem duplicar).

---

## 6. Rodar a aplicação

Dois terminais (ou use `&`):

```bash
# terminal 1 — backend (:3000)
npm run dev:backend

# terminal 2 — frontend (:5173)
npm run dev:frontend
```

Verificação rápida:

```bash
curl -s http://localhost:3000/health          # → OK
curl -s http://localhost:3000/api/products | head -c 200   # lista de produtos
```

Abra **http://localhost:5173** (loja) e faça login admin em `/login`
(`admin@luanarohr.art` / `admin12345`) → `/admin`.

- Swagger: `http://localhost:3000/api-docs`
- GraphQL: `http://localhost:3000/graphql`

---

## 7. Testes E2E (Playwright) — opcional

O E2E tem `global.setup` que **cria/destrói um banco de teste dedicado** e
`global.teardown` que usa `psql`. Portanto:

1. Instale o cliente psql (feito na seção 0: `postgresql-client`).
2. Instale os navegadores do Playwright:
   ```bash
   cd tests
   npx playwright install chromium
   # se faltar lib de sistema no Ubuntu:  sudo npx playwright install-deps
   ```
3. Configure `tests/.env.test` apontando para um **banco de teste separado** (nunca
   o `luana_rohr_art`), num Postgres cujo usuário pode `CREATE DATABASE`:
   ```env
   DATABASE_URL=postgresql://postgres:postgres@localhost:5433/luana_rohr_art_test
   REDIS_URL=redis://localhost:6380
   BETTER_AUTH_SECRET=<mesmo secret do backend ou qualquer um>
   BETTER_AUTH_URL=http://localhost:3000
   ADMIN_EMAIL=admin@luanarohr.art
   ADMIN_PASSWORD=admin12345
   ```
4. Rodar:
   ```bash
   npx playwright test
   npx playwright test specs/store.spec.ts   # só a loja pública
   ```

> Atalho que a máquina atual usa (sem banco de teste dedicado): com backend e
> frontend já rodando, dá para rodar só o `store.spec.ts` contra o ambiente de dev
> usando uma config efêmera (sem `global.setup/teardown`). Mas o fluxo oficial é o
> dos 4 passos acima.

---

## 8. Gotchas / troubleshooting

- **Conflito com o projeto `ka-sf`:** na máquina atual existe
  `COMPOSE_PROJECT_NAME=ka-sf` no ambiente, o que faz `docker compose up` cair no
  projeto `ka-sf` e criar/usar containers na 5432/6379 com credenciais que **não**
  batem — gerando `password authentication failed`. **Não** traga essa variável para
  a nova máquina e **não** rode `docker compose up` aqui: use o `docker run` da
  seção 3. (Se preferir docker-compose numa máquina limpa, ele sobe Postgres na 5432
  e Redis na 6379 — então ajuste `DATABASE_URL`/`REDIS_URL` para essas portas.)
- **Redis fora do ar:** o rate-limiter é _fail-open_ e o Redis só é essencial para
  a fila de exportação (BullMQ). A loja sobe e funciona mesmo com o `lra-redis`
  parado; só os exports de pedido ficam indisponíveis.
- **`password authentication failed` no migrate:** o `DATABASE_URL` não aponta para o
  Postgres certo. Confirme a porta (5433) e que `lra-postgres` está `Up`.
- **`psql: not found` no E2E:** instale `postgresql-client` (seção 0).
- **Browsers do Playwright ausentes:** `npx playwright install chromium`.
- **Node < 20.19:** troque com `nvm use 22`.
- **MIME type do frontend / cookies cross-site:** só afetam produção (Render). Em
  dev local não aparecem. Ver `CLAUDE.md` › _Known Issues_.

---

## 9. Observações

- As **imagens dos produtos** no seed são placeholders externos (`placehold.co`), então
  a vitrine funciona sem R2. O **retrato da artista** (`frontend/public/luana.webp`) já
  está versionado.
- Para resetar o banco do zero: `docker rm -f lra-postgres`, recrie o container
  (seção 3) e rode migrate + seed de novo.
- Referência de arquitetura e regras de negócio: `CLAUDE.md` e `HANDOVER.md`.
</content>
