#!/usr/bin/env bash
#
# setup.sh — Automatiza os passos 3–6 do RUNBOOK.md para a loja Luana Rohr Art.
#
#   3. Sobe os containers Postgres (lra-postgres:5433) e Redis (lra-redis:6380)
#   4. Instala dependências (root, backend, frontend; tests com --with-tests)
#   5. Aplica migrations e semeia dados de exemplo
#   6. Sobe backend (:3000) e frontend (:5173)
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

# ---------- Config (casa com o RUNBOOK.md) ----------
PG_NAME=lra-postgres
PG_PORT=5433
PG_DB=luana_rohr_art
PG_USER=postgres
PG_PASS=postgres
REDIS_NAME=lra-redis
REDIS_PORT=6380

RUN_SERVERS=1
INSTALL_TESTS=0
RESET_DB=0

# ---------- Flags ----------
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

log "Passo 3 — containers Postgres e Redis"
if [ "$RESET_DB" -eq 1 ]; then
  warn "--reset-db: removendo $PG_NAME (os dados serão perdidos)"
  docker rm -f "$PG_NAME" >/dev/null 2>&1 || true
fi
ensure_container "$PG_NAME" \
  -e POSTGRES_PASSWORD="$PG_PASS" -e POSTGRES_DB="$PG_DB" \
  -p "${PG_PORT}:5432" postgres:15
ensure_container "$REDIS_NAME" -p "${REDIS_PORT}:6379" redis:7-alpine

echo "   aguardando o Postgres aceitar conexões..."
for i in $(seq 1 30); do
  if docker exec "$PG_NAME" pg_isready -U "$PG_USER" -d "$PG_DB" >/dev/null 2>&1; then
    echo "   Postgres pronto."
    break
  fi
  [ "$i" -eq 30 ] && die "Postgres não respondeu a tempo"
  sleep 1
done

# ---------- Passo 4: dependências ----------
log "Passo 4 — instalando dependências"
npm install
npm install --prefix backend
npm install --prefix frontend
if [ "$INSTALL_TESTS" -eq 1 ]; then
  npm install --prefix tests
fi

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
