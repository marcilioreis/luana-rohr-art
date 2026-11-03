#!/usr/bin/env bash
#
# setup.sh — Automatiza os passos 3–6 do RUNBOOK.md para a loja Luana Rohr Art.
#
#   3. Sobe os containers Postgres e Redis
#   4. Instala dependências (root, backend, frontend; tests com --with-tests)
#   5. Aplica migrations e semeia dados de exemplo
#   6. Sobe backend (:3000) e frontend (:5173)
#
# As credenciais/portas do Postgres e do Redis são lidas de backend/.env
# (DATABASE_URL e REDIS_URL) — nada é hardcoded, então o container é criado
# batendo exatamente com o seu .env.
#
# Pré-requisitos (RUNBOOK seção 0): docker, node >= 20.19, e os arquivos
# backend/.env e frontend/.env já criados (RUNBOOK seção 2).
#
# Uso:
#   ./setup.sh                # setup completo + sobe os servidores
#   ./setup.sh --no-run       # só prepara (3–5), não sobe os servidores
#   ./setup.sh --with-tests   # também instala deps de tests/ (E2E)
#   ./setup.sh --reset-db     # recria o container do Postgres (APAGA os dados)
#
set -euo pipefail

PG_NAME=lra-postgres
REDIS_NAME=lra-redis
RUN_SERVERS=1
INSTALL_TESTS=0
RESET_DB=0

for arg in "$@"; do
  case "$arg" in
    --no-run) RUN_SERVERS=0 ;;
    --with-tests) INSTALL_TESTS=1 ;;
    --reset-db) RESET_DB=1 ;;
    -h|--help) awk 'NR==1{next} /^#/{sub(/^# ?/,"");print;next} {exit}' "$0"; exit 0 ;;
    *) echo "flag desconhecida: $arg (use --help)"; exit 1 ;;
  esac
done

cd "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

log()  { printf '\n\033[1;34m==> %s\033[0m\n' "$*"; }
warn() { printf '\033[1;33m!  %s\033[0m\n' "$*"; }
die()  { printf '\033[1;31m✗  %s\033[0m\n' "$*" >&2; exit 1; }

# ---------- Pré-checagens ----------
command -v docker >/dev/null 2>&1 || die "docker não encontrado (ver RUNBOOK seção 0)"
command -v node   >/dev/null 2>&1 || die "node não encontrado (ver RUNBOOK seção 0)"
NODE_MAJOR="$(node -p 'process.versions.node.split(".")[0]')"
NODE_MINOR="$(node -p 'process.versions.node.split(".")[1]')"
if [ "$NODE_MAJOR" -lt 20 ] || { [ "$NODE_MAJOR" -eq 20 ] && [ "$NODE_MINOR" -lt 19 ]; }; then
  die "Node $(node -v) é muito antigo (precisa >= 20.19). Use: nvm use 22"
fi
[ -f backend/.env ]  || die "backend/.env ausente — crie-o antes (RUNBOOK seção 2)"
[ -f frontend/.env ] || die "frontend/.env ausente — crie-o antes (RUNBOOK seção 2)"

# ---------- Lê credenciais do backend/.env ----------
envval() { grep -E "^$1=" backend/.env | head -1 | sed -E "s/^$1=//; s/^[\"']//; s/[\"']\$//"; }
DATABASE_URL="$(envval DATABASE_URL || true)"
REDIS_URL="$(envval REDIS_URL || true)"
[ -n "$DATABASE_URL" ] || die "DATABASE_URL não encontrado em backend/.env"

# Parse confiável via node (lida com senha codificada e defaults)
IFS=$'\t' read -r PG_USER PG_PASS PG_DB PG_HOST PG_PORT < <(node -e '
  const u = new URL(process.argv[1]); const d = decodeURIComponent;
  process.stdout.write([d(u.username), d(u.password), d(u.pathname.replace(/^\//,"")),
                        u.hostname, u.port || "5432"].join("\t"));
' "$DATABASE_URL")
[ -n "${PG_USER:-}" ] && [ -n "${PG_DB:-}" ] || die "não consegui parsear DATABASE_URL"

REDIS_HOST=localhost; REDIS_PORT=6380
if [ -n "$REDIS_URL" ]; then
  IFS=$'\t' read -r REDIS_HOST REDIS_PORT < <(node -e '
    const u = new URL(process.argv[1]);
    process.stdout.write([u.hostname, u.port || "6379"].join("\t"));
  ' "$REDIS_URL")
fi

is_local() { case "$1" in localhost|127.0.0.1|::1|0.0.0.0) return 0 ;; *) return 1 ;; esac; }

# ---------- Passo 3: containers ----------
ensure_container() {
  local name="$1"; shift
  if docker ps --format '{{.Names}}' | grep -qx "$name"; then
    echo "   $name já está rodando."
  elif docker ps -a --format '{{.Names}}' | grep -qx "$name"; then
    echo "   iniciando container existente $name..."; docker start "$name" >/dev/null
  else
    echo "   criando container $name..."; docker run -d --name "$name" "$@" >/dev/null
  fi
}

log "Passo 3 — containers Postgres e Redis (a partir do backend/.env)"
echo "   Postgres: user=$PG_USER db=$PG_DB em $PG_HOST:$PG_PORT · Redis: $REDIS_HOST:$REDIS_PORT"

if ! is_local "$PG_HOST"; then
  warn "DATABASE_URL aponta para host externo ($PG_HOST) — pulando o container Postgres."
else
  if [ "$RESET_DB" -eq 1 ]; then
    warn "--reset-db: removendo $PG_NAME (os dados serão perdidos)"
    docker rm -f "$PG_NAME" >/dev/null 2>&1 || true
  fi
  # Se o container já existe, confere se as credenciais batem com o .env
  if docker ps -a --format '{{.Names}}' | grep -qx "$PG_NAME"; then
    EXIST_USER="$(docker inspect "$PG_NAME" --format '{{range .Config.Env}}{{println .}}{{end}}' | sed -n 's/^POSTGRES_USER=//p' | head -1)"
    EXIST_USER="${EXIST_USER:-postgres}"
    EXIST_DB="$(docker inspect "$PG_NAME" --format '{{range .Config.Env}}{{println .}}{{end}}' | sed -n 's/^POSTGRES_DB=//p' | head -1)"
    EXIST_DB="${EXIST_DB:-$EXIST_USER}"
    if [ "$EXIST_USER" != "$PG_USER" ] || [ "$EXIST_DB" != "$PG_DB" ]; then
      die "container '$PG_NAME' existe com user=$EXIST_USER db=$EXIST_DB, mas o .env quer user=$PG_USER db=$PG_DB.
   Rode:  ./setup.sh --reset-db   (recria o container — APAGA os dados dele)"
    fi
  fi
  ensure_container "$PG_NAME" \
    -e POSTGRES_USER="$PG_USER" -e POSTGRES_PASSWORD="$PG_PASS" -e POSTGRES_DB="$PG_DB" \
    -p "${PG_PORT}:5432" postgres:15

  echo "   aguardando o Postgres aceitar conexões..."
  for i in $(seq 1 30); do
    docker exec "$PG_NAME" pg_isready -U "$PG_USER" >/dev/null 2>&1 && { echo "   Postgres pronto."; break; }
    [ "$i" -eq 30 ] && die "Postgres não respondeu a tempo"
    sleep 1
  done

  # Garante o banco (container reaproveitado pode não tê-lo)
  if docker exec "$PG_NAME" psql -U "$PG_USER" -tAc \
       "SELECT 1 FROM pg_database WHERE datname='${PG_DB}'" | grep -q 1; then
    echo "   banco '${PG_DB}' já existe."
  else
    echo "   criando banco '${PG_DB}'..."; docker exec "$PG_NAME" createdb -U "$PG_USER" "$PG_DB"
  fi
fi

if ! is_local "$REDIS_HOST"; then
  warn "REDIS_URL aponta para host externo ($REDIS_HOST) — pulando o container Redis."
else
  ensure_container "$REDIS_NAME" -p "${REDIS_PORT}:6379" redis:7-alpine
fi

# ---------- Passo 4: dependências ----------
log "Passo 4 — instalando dependências"
npm install
npm install --prefix backend
npm install --prefix frontend
[ "$INSTALL_TESTS" -eq 1 ] && npm install --prefix tests || true

# ---------- Passo 5: migrate + seed ----------
log "Passo 5 — migrations"
npm --prefix backend run db:migrate
log "Passo 5 — seed (dados de exemplo, idempotente)"
( cd backend && npx tsx scripts/seed.ts )

# ---------- Passo 6: rodar ----------
if [ "$RUN_SERVERS" -eq 1 ]; then
  log "Passo 6 — subindo backend (:3000) e frontend (:5173)  ·  Ctrl+C para parar"
  npx concurrently -k -n backend,frontend -c blue,green \
    "npm run dev:backend" "npm run dev:frontend"
else
  log "Setup concluído (--no-run). Para subir a aplicação:"
  echo "   npm run dev:backend    # terminal 1"
  echo "   npm run dev:frontend   # terminal 2"
  echo "   loja: http://localhost:5173  ·  admin: admin@luanarohr.art / admin12345"
fi
