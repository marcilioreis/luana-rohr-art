---
description: Sobe os serviços e executa os testes E2E (Playwright), diagnosticando falhas
allowed-tools: Read, Grep, Glob, Bash(docker-compose:*), Bash(docker compose:*), Bash(npm run:*), Bash(npx playwright:*), Bash(cd tests*)
argument-hint: "[spec específico, ex: specs/store.spec.ts]"
---

Execute os testes E2E da loja Luana Rohr Art. Spec alvo (opcional): $ARGUMENTS

Passos:
1. Garanta Postgres + Redis no Docker: `docker compose up -d postgres redis`.
2. Garanta backend (:3000) e frontend (:5173). Use `npm run e2e:setup` (migrate + seed +
   start) ou deixe o Playwright subir via `webServer`. O seed é necessário (roles
   `admin`/`cliente`, permissões, admin inicial e produtos de exemplo).
3. Rode:
   - Tudo: `cd tests && npx playwright test`
   - Um spec (se $ARGUMENTS): `cd tests && npx playwright test $ARGUMENTS`
4. Se falhar, leia os logs e correlacione com os problemas conhecidos:
   - Redis/Upstash (opções `family:0`/`tls`/`maxRetriesPerRequest:null`, fila `order-exports`)
     → skill `fix-redis-connection`.
   - MIME type do CSS no frontend (acesso direto a rota).
   - Sessão/refresh: 401 inesperado, `auth-token` ausente, `ProtectedRoute` redirecionando cedo;
     403 em auth server-to-server por falta de header `Origin`.
   - Checkout: 409 geralmente é estoque insuficiente ou variante inativa.
   - Banco sujo: confirme seed e `global.setup`/`teardown`.
5. Sugira correções concretas baseadas no que os logs mostram.

Para diagnósticos mais profundos, delegue ao subagent `e2e-runner`.
