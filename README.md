# Luana Rohr Art — Loja de Camisetas

## Visão Geral
Loja virtual de camisetas com arte autoral de **Luana Rohr**. Os clientes navegam pela
vitrine (Home), conhecem a artista (Sobre), exploram o catálogo (PLP), abrem o detalhe do
produto (PDP), adicionam ao carrinho e finalizam a compra no checkout.

Não há gateway de pagamento: o checkout gera um **PIX “copia e cola” (BR Code EMV) dinâmico**,
com o valor exato do pedido + QR code. O pedido fica *aguardando pagamento* até a
administração confirmar manualmente. A gestão de pedidos tem transição de status
(aguardando → pago → enviado → entregue / cancelado), protegida por RBAC.

A plataforma é composta por:
- **Backend**: monólito modular em Node.js/Express + TypeScript (Drizzle ORM, PostgreSQL,
  BullMQ, Redis, Better Auth, GraphQL/Apollo, Zod).
- **Frontend**: SPA mobile-first em React 19 + Redux Toolkit (RTK Query) + Vite + Tailwind 4 +
  shadcn/ui.

---

## Stack Tecnológica

| Camada      | Tecnologias                                                                                                    |
|-------------|----------------------------------------------------------------------------------------------------------------|
| **Backend** | Node 20, Express 5, TypeScript estrito, Drizzle ORM, PostgreSQL, BullMQ, Redis, Zod, Better Auth, Apollo Server |
| **Frontend**| React 19, Vite, TypeScript, Tailwind 4, shadcn/ui (Radix), Redux Toolkit + RTK Query, React Router 7, Recharts, qrcode.react |
| **Infra**   | Render (web service + static site), Cloudflare R2 (storage), Upstash Redis (compatível com BullMQ)             |

---

## Como rodar (desenvolvimento)

```bash
# 1. Infraestrutura (postgres + redis)
docker compose up -d postgres redis

# 2. Variáveis de ambiente
cp .env.example .env
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# 3. Backend
cd backend && npm install
npm run db:migrate      # cria tabelas + view orders_enriched
tsx scripts/seed.ts     # roles/permissões, admin e produtos de exemplo
npm run dev             # http://localhost:3000

# 4. Frontend
cd ../frontend && npm install
npm run dev             # http://localhost:5173
```

- **Admin inicial** (seed): `admin@luanarohr.art` / `admin12345` (ajuste em `backend/.env`).
- **Health**: `GET /health` · **Swagger**: `/api-docs` · **GraphQL**: `/graphql`.

## PIX
O payload EMV e o CRC16-CCITT são implementados à mão em `backend/src/shared/pix/pix.ts`
(sem dependência de gateway). A chave e o recebedor vêm do ambiente
(`PIX_KEY`, `PIX_MERCHANT_NAME`, `PIX_MERCHANT_CITY`). O QR é renderizado no frontend a partir
do payload retornado pela API. Testes: `npm run test` no backend.
