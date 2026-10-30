---
name: drizzle-migrations
description: >-
  Use ao gerar, revisar ou aplicar migrations Drizzle/Postgres na loja Luana Rohr
  Art, ou ao alterar schemas em backend/src/shared/db/schema/. Cobre a pegadinha
  da view orders_enriched (precisa de DROP VIEW antes de recriar), índices,
  constraints e o fluxo generate → revisar SQL → migrate.
---

# Migrations Drizzle

Schemas em `backend/src/shared/db/schema/` (`products.ts`, `orders.ts`, `rbac.ts`,
`audit.ts`, `reports.ts`, `auth.ts`, `views.types.ts`). Migrations SQL versionadas em
`backend/drizzle/`.

## Fluxo
1. Edite o schema Drizzle relevante.
2. Gere o SQL:
   ```bash
   cd backend && npx drizzle-kit generate --name <nome-descritivo>
   ```
3. **Revise** o arquivo gerado em `backend/drizzle/`: tipos, defaults, nullability,
   índices, constraints únicas. Drizzle nem sempre cria índices — adicione em colunas de
   `WHERE`/`ORDER BY`/`JOIN` (ex.: `order_id` em `order_items`, `product_id` em
   `product_variants`, `customer_id`/`status` em `orders`).
4. Aplique:
   ```bash
   npm run db:migrate     # tsx scripts/migrate.ts
   ```
   (`npm run db:push` existe para sync rápido em dev, mas use generate+migrate para histórico.)

## View orders_enriched (crítico)
O **status do pedido é armazenado** (coluna `status`), não computado. A view
`orders_enriched` apenas agrega campos derivados: `item_count`, `status_label` (rótulo
legível por status) e `items` (JSON agregado dos `order_items`).

Ao alterar a view, a migration deve **dropar antes de recriar**:
```sql
DROP VIEW IF EXISTS orders_enriched;
CREATE VIEW orders_enriched AS ...;
```
Na migration inicial (`0000_init_store.sql`), a DDL da view foi **anexada ao fim do arquivo
gerado**, após um `--> statement-breakpoint` — o migrator executa cada statement separado
por esse marcador. Ao mexer na view numa nova migration, acrescente o bloco DROP/CREATE
após um `--> statement-breakpoint`. Mantenha `views.types.ts` (tipo `OrderEnriched`)
sincronizado com as colunas retornadas.

## Convenções de dados conhecidas
- Valores monetários (`base_price`, `subtotal`, `shipping_fee`, `total`, `unit_price`,
  `line_total`) são `double precision`.
- `products.custom_style`/`tags` e `orders.shipping_address` são **JSONB**.
- `product_variants.sku` é único; `stock` nunca negativo (baixa atômica no service).
- `orders.order_number` é único; `status` default `'aguardando_pagamento'`.
- `order_items` guarda snapshots (`product_name`, `variant_label`, `unit_price`, `line_total`).
- Tabelas Better Auth (`user`, `session`, `account`, `verification`): gerenciadas pelo
  adapter — não altere à mão.

## Seed
Após criar/alterar tabelas de domínio, confira `backend/scripts/seed.ts` (roles
`admin`/`cliente`, permissões `product:manage`/`order:manage`/`order:view`, admin inicial
e produtos de exemplo). Rode `tsx scripts/seed.ts`.

## Rollback
Mudanças destrutivas (drop de coluna/tabela) precisam de plano de rollback. Avise o
usuário antes de aplicar algo destrutivo e ofereça o SQL reverso.
