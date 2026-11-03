// src/modules/orders/orders.routes.ts
import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { RedisStore } from 'rate-limit-redis';
import { authenticate, optionalAuthenticate } from '../../shared/auth/middleware.js';
import { loadPermissions } from '../../shared/middleware/loadPermissions.js';
import { authorize } from '../../shared/middleware/rbac.js';
import { validateBody } from '../../shared/middleware/validate.js';
import { redis } from '../../shared/redis/index.js';
import {
  createOrderSchema,
  updateOrderStatusSchema,
  exportRequestSchema,
} from '../../shared/validation/schemas.js';
import * as controller from './orders.controller.js';

const router = Router();

// Limiter estrito só no checkout (POST /): cada pedido faz baixa de estoque real, então
// mitiga esgotamento por script anônimo. Fail-open se o Redis falhar (como o apiLimiter).
const checkoutLimiter = rateLimit({
  store: new RedisStore({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    sendCommand: (...args: any[]) => redis.call(args[0], ...args.slice(1)),
    prefix: 'rl:checkout:',
  }),
  windowMs: 60 * 1000,
  max: 10,
  message: { error: 'Muitas tentativas de checkout, tente novamente em instantes.' },
  standardHeaders: true,
  legacyHeaders: false,
  passOnStoreError: true,
});

// ---------- Públicas (checkout de convidado) ----------
/**
 * @openapi
 * /api/orders:
 *   post:
 *     summary: Criar pedido (checkout) — gera PIX e retorna o payload. Aceita convidado.
 *     tags: [Pedidos]
 *     responses:
 *       201: { description: Pedido criado (aguardando pagamento) }
 *       409: { description: Estoque insuficiente }
 */
router.post(
  '/',
  checkoutLimiter,
  optionalAuthenticate,
  validateBody(createOrderSchema),
  controller.createOrder
);

/**
 * @openapi
 * /api/orders/track/{token}:
 *   get:
 *     summary: Acompanhar pedido por token de acesso público (convidado)
 *     tags: [Pedidos]
 *     responses:
 *       200: { description: Pedido encontrado (inclui PIX e status) }
 *       404: { description: Pedido não encontrado }
 */
router.get('/track/:token', controller.trackOrder);

/**
 * @openapi
 * /api/orders/shipping-quote:
 *   get:
 *     summary: Cotação de frete por UF (pública) — usada pelo checkout
 *     tags: [Pedidos]
 *     parameters:
 *       - in: query
 *         name: uf
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Cotação de frete }
 *       400: { description: UF inválida }
 */
router.get('/shipping-quote', controller.getShippingQuote);

// Daqui pra baixo, exige autenticação + permissões carregadas
router.use(authenticate, loadPermissions);

/**
 * @openapi
 * /api/orders/mine:
 *   get:
 *     summary: Listar os pedidos do cliente autenticado
 *     tags: [Pedidos]
 *     security: [{ cookieAuth: [] }]
 *     responses:
 *       200: { description: Lista de pedidos do cliente }
 */
router.get('/mine', controller.listMyOrders);

// ---------- Exportação (admin) — antes de /:id ----------
router.post(
  '/exports',
  authorize('order:manage'),
  validateBody(exportRequestSchema),
  controller.requestExport
);
router.get('/exports/:exportId/status', authorize('order:manage'), controller.getExportStatus);
router.get('/exports/:exportId/download', authorize('order:manage'), controller.downloadExport);

// ---------- Admin (gestão de pedidos) ----------
/**
 * @openapi
 * /api/orders:
 *   get:
 *     summary: Listar todos os pedidos (admin, painel)
 *     tags: [Pedidos]
 *     security: [{ cookieAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: status
 *         schema: { type: string }
 *     responses:
 *       200: { description: Lista de pedidos }
 *       403: { description: Sem permissão }
 */
router.get('/', authorize('order:manage'), controller.listOrders);

/**
 * @openapi
 * /api/orders/{id}/status:
 *   patch:
 *     summary: Transição manual de status do pedido (admin)
 *     tags: [Pedidos]
 *     security: [{ cookieAuth: [] }]
 *     responses:
 *       200: { description: Pedido atualizado }
 *       400: { description: Transição inválida }
 */
router.patch(
  '/:id/status',
  authorize('order:manage'),
  validateBody(updateOrderStatusSchema),
  controller.updateOrderStatus
);

router.post('/:id/confirm-payment', authorize('order:manage'), controller.confirmPayment);

// ---------- Detalhe (cliente dono ou admin) ----------
router.get('/:id', controller.getMyOrder);

export default router;
