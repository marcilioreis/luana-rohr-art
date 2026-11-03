// src/modules/products/products.routes.ts
import { Router } from 'express';
import { authenticate } from '../../shared/auth/middleware.js';
import { loadPermissions } from '../../shared/middleware/loadPermissions.js';
import { authorize } from '../../shared/middleware/rbac.js';
import { validateBody } from '../../shared/middleware/validate.js';
import {
  createProductSchema,
  updateProductSchema,
  createVariantSchema,
  updateVariantSchema,
} from '../../shared/validation/schemas.js';
import * as controller from './products.controller.js';

const router = Router();

// Middleware de gestão: autenticado + permissão product:manage
const manage = [authenticate, loadPermissions, authorize('product:manage')];

// ---------- Gestão (admin) — declarado antes de /:slug para evitar colisão ----------
/**
 * @openapi
 * /api/products/manage:
 *   get:
 *     summary: Listar todos os produtos (admin, inclui inativos)
 *     tags: [Produtos]
 *     security: [{ cookieAuth: [] }]
 *     responses:
 *       200: { description: Lista de produtos }
 */
router.get('/manage', ...manage, controller.listProductsAdmin);
router.get('/manage/:id', ...manage, controller.getProductAdmin);

/**
 * @openapi
 * /api/products:
 *   post:
 *     summary: Criar produto (admin)
 *     tags: [Produtos]
 *     security: [{ cookieAuth: [] }]
 *     responses:
 *       201: { description: Produto criado }
 *       403: { description: Sem permissão }
 */
router.post('/', ...manage, validateBody(createProductSchema), controller.createProduct);
router.put('/:id', ...manage, validateBody(updateProductSchema), controller.updateProduct);
router.delete('/:id', ...manage, controller.deleteProduct);

// Variantes
router.post(
  '/:id/variants',
  ...manage,
  validateBody(createVariantSchema),
  controller.createVariant
);
router.put(
  '/variants/:variantId',
  ...manage,
  validateBody(updateVariantSchema),
  controller.updateVariant
);
router.delete('/variants/:variantId', ...manage, controller.deleteVariant);

// Imagens (upload via StorageProvider)
router.post('/:id/images', ...manage, controller.uploadImage);
router.delete('/images/:imageId', ...manage, controller.deleteImage);

// ---------- Público (loja) ----------
/**
 * @openapi
 * /api/products:
 *   get:
 *     summary: Listar produtos ativos (PLP)
 *     tags: [Produtos]
 *     parameters:
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *     responses:
 *       200: { description: Lista de produtos }
 */
router.get('/', controller.listProducts);

/**
 * @openapi
 * /api/products/collections:
 *   get:
 *     summary: Listar coleções ativas (temas curatoriais)
 *     tags: [Produtos]
 *     responses:
 *       200: { description: Lista de coleções }
 */
router.get('/collections', controller.listCollections);

/**
 * @openapi
 * /api/products/{slug}:
 *   get:
 *     summary: Obter um produto pelo slug (PDP)
 *     tags: [Produtos]
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Produto }
 *       404: { description: Produto não encontrado }
 */
router.get('/:slug', controller.getProductBySlug);

export default router;
