---
name: deep-review
description: >-
  Use para uma revisão de código PROFUNDA e sistemática na loja Luana Rohr Art,
  cobrindo segurança, performance, estilo/convenções, tratamento de erros e
  gerenciamento de recursos. Apropriada para revisar um PR inteiro, um módulo,
  ou um arquivo crítico antes do merge. Para revisão rápida de um diff recente,
  prefira o subagent code-reviewer.
---

# Deep Code Review

Revisão sistemática de código da loja **Luana Rohr Art**. Consulte os references desta
skill conforme o passo. Explore o código em paralelo (vários Grep/Read de uma vez) e baseie
conclusões em entendimento real, não em palpite.

## Passo 1 — Escopo
Peça (ou infira do git diff) o que revisar: PR, módulo ou arquivo. Se nada for dado,
analise as mudanças não commitadas: `git diff HEAD` e `git diff --staged`.

## Passo 2 — Regras de negócio da loja (hot spots)
- **PIX / CRC16**: `shared/pix/pix.ts`. EMV TLV correto (IDs 00/26/52/53/54/58/59/60/62/63);
  CRC16-CCITT (poly `0x1021`, init `0xFFFF`) calculado sobre tudo **incluindo** `6304`;
  `54` = `amount.toFixed(2)`; nome/cidade ASCII sem acento (25/15); valor ≤ 0 lança.
  Existe teste (`pix.test.ts`) — confirme que cobre o valor de verificação do CRC.
- **Estoque não-negativo**: baixa atômica no checkout
  (`UPDATE ... WHERE stock >= qty RETURNING`); sem linha → 409. Cancelar pedido devolve estoque.
- **Transições de status**: via `isValidTransition`
  (`aguardando_pagamento → pago → enviado → entregue | cancelado`); inválida → 400. A busca
  enriquecida (`orders_enriched`) deve ocorrer **após** o commit da transação (não dentro).
- **Preços**: `unitPrice = variant.price ?? basePrice`; `total = subtotal + shippingFee`;
  snapshots gravados no `order_items`.

## Passo 3 — Segurança
Aplique `references/security-checklist.md` item a item. Pontos quentes:
- Toda entrada validada por Zod (`validateBody`/`validateParams`/`validateQuery`).
- Gestão de produto com `authorize('product:manage')`; gestão/relatórios de pedido com
  `order:manage`/`order:view`. GET público de produto **não** deve exigir auth; detalhe de
  pedido deve checar posse (cliente só vê o próprio) ou `req.isAdmin`.
- Queries via Drizzle parametrizado, nunca concatenação de SQL.
- Uploads de imagem (R2/S3 via StorageProvider): validar tipo/tamanho, URLs pré-assinadas
  com expiração curta, nomes sanitizados.
- Logs/auditoria: ações críticas (criar produto, mudar status/confirmar pagamento) em
  `audit_logs`; sem senhas/tokens/`pix_payload` sensível em log.

## Passo 4 — Performance
Aplique `references/performance-patterns.md`. Pontos quentes:
- N+1: imagens/variantes/itens buscados em loop → usar `leftJoin`/`inArray` ou a view
  `orders_enriched`.
- Índices em colunas de `WHERE`/`ORDER BY`/`JOIN` (`order_id`, `product_id`, `status`).
- Cache Redis (`cacheGet`/`cacheSet`) para dados quentes; invalidar após mutação.
- BullMQ com `maxRetriesPerRequest: null` e `enableReadyCheck: false` (Upstash), fila
  `order-exports`.
- Frontend: `lazyPage()` em rotas; `providesTags`/`invalidatesTags` para evitar over/under-fetch.

## Passo 5 — Estilo e convenções
- Prettier: aspas simples (backend), ponto-e-vírgula, 2 espaços, 100 cols, trailing comma ES5, LF.
- ESLint: `_` em params não usados; sem `any` (exceto `(Redis as any)`); sem `console.log`.
- Camadas `route → controller → service → db` (controller não toca `db`, salvo audit log).
- Mensagens de erro em português.
- Frontend: `lazyPage()`, sem `useEffect` para init (usar `key`), shadcn de `@/components/ui`,
  moeda via `formatBRL`, QR via `qrcode.react`.

## Passo 6 — Saída
Gere relatório estruturado:
- **Resumo** dos principais problemas.
- **Tabela de achados**: arquivo:linha | gravidade | descrição | sugestão.
- **Recomendações finais**: próximos passos e testes sugeridos (E2E).
