// src/modules/orders/orders.routes.ts
import { Router } from 'express';
import { authenticate } from '../../shared/auth/middleware.js';
import { loadPermissions } from '../../shared/middleware/loadPermissions.js';
import { authorize } from '../../shared/middleware/rbac.js';
import { validateBody } from '../../shared/middleware/validate.js';
import {
  createOrderSchema,
  updateOrderStatusSchema,
  exportRequestSchema,
} from '../../shared/validation/schemas.js';
import * as controller from './orders.controller.js';

const router = Router();

// Todas as rotas de pedido exigem autenticação + permissões carregadas
router.use(authenticate, loadPermissions);

// ---------- Cliente autenticado ----------
/**
 * @openapi
 * /api/orders:
 *   post:
 *     summary: Criar pedido (checkout) — gera PIX e retorna o payload
 *     tags: [Pedidos]
 *     security: [{ cookieAuth: [] }]
 *     responses:
 *       201: { description: Pedido criado (aguardando pagamento) }
 *       409: { description: Estoque insuficiente }
 */
router.post('/', validateBody(createOrderSchema), controller.createOrder);

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
