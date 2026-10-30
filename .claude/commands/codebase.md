---
description: Relatório breve das tecnologias e arquitetura do projeto
allowed-tools: Read, Grep, Glob, Bash(cat:*), Bash(ls:*)
---

Verifique a base do código e traga um relatório breve com as tecnologias usadas no projeto.

Contexto:
- Consulte `CLAUDE.md` na raiz para a visão arquitetural.
- Consulte as convenções em `.claude/skills/` (especialmente `loja-feature-builder`).
- Confirme as versões reais lendo `backend/package.json`, `frontend/package.json` e
  `tests/package.json` — não confie só na documentação, que pode estar desatualizada.

Entregue:
1. Stack por camada (backend / frontend / infra / testes) com versões reais.
2. Resumo da arquitetura (monólito modular backend com módulos `products`/`orders`/`admin`,
   SPA frontend, camadas, RBAC, fila BullMQ `order-exports`, PIX EMV/CRC16, GraphQL de vendas).
3. Pontos de atenção conhecidos (Redis/Upstash, view `orders_enriched`, estoque por variante,
   MIME no Render, CSRF/Origin no Better Auth).
Seja conciso — bullets e uma tabela, sem encher linguiça.
