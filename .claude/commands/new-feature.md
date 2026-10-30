---
description: Implementa uma feature de ponta a ponta seguindo os padrões da loja Luana Rohr Art
allowed-tools: Read, Grep, Glob, Edit, Write, Bash(npm run lint*), Bash(npm run format*), Bash(cd backend*), Bash(cd frontend*)
argument-hint: "<descrição da feature, ex: adicionar cupom de desconto no checkout>"
---

Implemente esta feature na loja Luana Rohr Art, de ponta a ponta: $ARGUMENTS

Use a skill `loja-feature-builder` como guia. Antes de codar, faça um plano curto
(módulos afetados, se precisa de migration/permissão/fila) e confirme comigo se houver
ambiguidade relevante.

Ordem esperada:
1. **Backend**: schema Zod → service (única camada com `db`) → controller → route com
   `authorize()` + `validateBody()` + doc `@openapi`. Erros de domínio com mensagem PT
   (traduza `Estoque insuficiente` → 409, `Transição inválida` → 400).
2. Se precisar de **migration**: use a skill `drizzle-migrations` (cuidado com a view
   `orders_enriched` e com `views.types.ts`).
3. Se precisar de **permissão nova**: semeie em `scripts/seed.ts` e proteja a rota
   (`product:manage` / `order:manage` / `order:view`).
4. Se precisar de **fila** (export/trabalho pesado): produtor em `export.queue.ts`
   (fila `order-exports`), processamento em `export.worker.ts`, reutilizando a conexão Redis.
5. **Frontend**: tipos → API slice (RTK Query, tags `Product`/`AdminProduct`/`Order`/
   `AdminOrder`) → componentes (shadcn, moeda via `formatBRL`, QR via `qrcode.react`,
   sem `any`) → página com `lazyPage()` → registrar rota sob `StoreLayout`/`AdminRoute`.

Respeite as convenções: imports `.js` no backend, sem `any`/`console.log`, mensagens de
erro em português, sem `useEffect` para init no frontend.

Ao final: rode `npm run lint` e `npm run format` nos pacotes afetados, sugira um teste E2E
e proponha uma mensagem de commit convencional (`feat(...)`).
