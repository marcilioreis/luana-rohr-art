---
description: Gera uma migration Drizzle seguindo o fluxo e a regra da view da loja Luana Rohr Art
allowed-tools: Read, Grep, Glob, Edit, Bash(cd backend*), Bash(npx drizzle-kit:*), Bash(npm run db:migrate), Bash(git diff:*)
argument-hint: "<nome-descritivo-da-migration>"
---

Gere uma migration Drizzle para a loja Luana Rohr Art. Nome sugerido: $ARGUMENTS

Siga este fluxo:
1. Verifique os schemas alterados em `backend/src/shared/db/schema/`
   (`products.ts`, `orders.ts`, `rbac.ts`, `reports.ts`, ...). Se eu ainda não alterei o
   schema, pergunte qual mudança quero ou implemente a mudança que descrevi.
2. Gere: `cd backend && npx drizzle-kit generate --name $ARGUMENTS`.
3. **Revise** o arquivo SQL gerado em `backend/drizzle/`: tipos, defaults, nullability,
   índices (adicione em colunas de WHERE/ORDER BY/JOIN, ex.: `order_id` em `order_items`,
   `status` em `orders`) e constraints únicas.
4. Se a mudança envolver a view `orders_enriched`, garanta que a migration faça
   `DROP VIEW IF EXISTS orders_enriched;` antes de `CREATE VIEW ...` (após um
   `--> statement-breakpoint`, como na migration inicial), e atualize `views.types.ts`.
5. Me oriente a aplicar: `npm run db:migrate` (ou `tsx scripts/migrate.ts`). Avise se a
   mudança for destrutiva (drop) e ofereça um plano de rollback.

Para detalhes use a skill `drizzle-migrations`. Comentários SQL podem ficar em português.
