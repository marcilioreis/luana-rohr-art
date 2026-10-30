import { Router } from 'express';
import { authenticate } from '../../shared/auth/middleware.js';
import { loadPermissions } from '../../shared/middleware/loadPermissions.js';
import { authorize } from '../../shared/middleware/rbac.js';
import { validateBody } from '../../shared/middleware/validate.js';
import {
  createUserAdminSchema,
  updateUserAdminSchema,
  createRoleSchema,
  updateRoleSchema,
} from '../../shared/validation/schemas.js';
import * as controller from './admin.controller.js';

const router = Router();

// Aplica autenticação e carregamento de permissões a todas as rotas
router.use(authenticate, loadPermissions);

// -- Usuários --

/**
 * @openapi
 * /api/admin/users:
 *   get:
 *     summary: Listar todos os usuários (admin)
 *     tags: [Admin - Usuários]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Lista de usuários com suas roles
 *       403:
 *         description: Sem permissão
 */
router.get('/users', authorize('user:manage'), controller.listUsers);

/**
 * @openapi
 * /api/admin/users/{id}:
 *   get:
 *     summary: Obter um usuário pelo ID (admin)
 *     tags: [Admin - Usuários]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Dados do usuário
 *       404:
 *         description: Usuário não encontrado
 */
router.get('/users/:id', authorize('user:manage'), controller.getUser);

/**
 * @openapi
 * /api/admin/users:
 *   post:
 *     summary: Criar um novo usuário (admin)
 *     tags: [Admin - Usuários]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password, name]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 minLength: 8
 *               name:
 *                 type: string
 *               roleIds:
 *                 type: array
 *                 items:
 *                   type: integer
 *     responses:
 *       201:
 *         description: Usuário criado
 *       400:
 *         description: Dados inválidos
 *       403:
 *         description: Sem permissão
 *       409:
 *         description: Email já em uso
 */
router.post(
  '/users',
  authorize('user:manage'),
  validateBody(createUserAdminSchema),
  controller.createUser
);

/**
 * @openapi
 * /api/admin/users/{id}:
 *   put:
 *     summary: Atualizar um usuário (admin)
 *     tags: [Admin - Usuários]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               role:
 *                 type: string
 *               roleIds:
 *                 type: array
 *                 items:
 *                   type: integer
 *               active:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Usuário atualizado
 *       404:
 *         description: Usuário não encontrado
 */
router.put(
  '/users/:id',
  authorize('user:manage'),
  validateBody(updateUserAdminSchema),
  controller.updateUser
);

// -- Roles --

/**
 * @openapi
 * /api/admin/roles:
 *   get:
 *     summary: Listar todas as roles (admin)
 *     tags: [Admin - Roles]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Lista de roles com suas permissões associadas
 *       403:
 *         description: Sem permissão
 */
router.get('/roles', authorize('role:manage'), controller.listRoles);

/**
 * @openapi
 * /api/admin/roles:
 *   post:
 *     summary: Criar uma nova role (admin)
 *     tags: [Admin - Roles]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               permissionIds:
 *                 type: array
 *                 items:
 *                   type: integer
 *     responses:
 *       201:
 *         description: Role criada
 *       400:
 *         description: Dados inválidos
 *       403:
 *         description: Sem permissão
 */
router.post(
  '/roles',
  authorize('role:manage'),
  validateBody(createRoleSchema),
  controller.createRole
);

/**
 * @openapi
 * /api/admin/roles/{id}:
 *   put:
 *     summary: Atualizar uma role existente (admin)
 *     tags: [Admin - Roles]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               permissionIds:
 *                 type: array
 *                 items:
 *                   type: integer
 *     responses:
 *       200:
 *         description: Role atualizada
 *       404:
 *         description: Role não encontrada
 */
router.put(
  '/roles/:id',
  authorize('role:manage'),
  validateBody(updateRoleSchema),
  controller.updateRole
);

// -- Permissões --

/**
 * @openapi
 * /api/admin/permissions:
 *   get:
 *     summary: Listar todas as permissões (admin)
 *     tags: [Admin - Permissões]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Lista de permissões
 *       403:
 *         description: Sem permissão
 */
router.get('/permissions', authorize('role:manage'), controller.listPermissions);

// -- Auditoria --

/**
 * @openapi
 * /api/admin/audit-logs:
 *   get:
 *     summary: Listar logs de auditoria (admin)
 *     tags: [Admin - Auditoria]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *         description: Filtrar por usuário
 *       - in: query
 *         name: action
 *         schema:
 *           type: string
 *         description: Filtrar por ação
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Limite de registros
 *     responses:
 *       200:
 *         description: Lista de logs de auditoria
 *       403:
 *         description: Sem permissão
 */
router.get('/audit-logs', authorize('audit:view'), controller.listAuditLogs);

export default router;
