// src/modules/auth/auth.docs.ts
// Este arquivo existe apenas para que o swagger-jsdoc encontre as anotações @openapi abaixo.
// As rotas são tratadas pelo Better Auth internamente.

/**
 * @openapi
 * /api/auth/sign-up/email:
 *   post:
 *     summary: Registrar novo usuário
 *     tags: [Autenticação]
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
 *     responses:
 *       201:
 *         description: Usuário criado
 *       400:
 *         description: Dados inválidos ou email já existe
 *
 * /api/auth/sign-in/email:
 *   post:
 *     summary: Fazer login com email e senha
 *     tags: [Autenticação]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login bem‑sucedido, cookie de sessão definido
 *       401:
 *         description: Credenciais inválidas
 *
 * /api/auth/get-session:
 *   get:
 *     summary: Obter sessão atual do usuário
 *     tags: [Autenticação]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Dados da sessão e usuário
 *       401:
 *         description: Não autenticado
 *
 * /api/auth/sign-out:
 *   post:
 *     summary: Encerrar sessão
 *     tags: [Autenticação]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Logout realizado
 *
 * /api/auth/forget-password:
 *   post:
 *     summary: Solicitar redefinição de senha (envia e-mail)
 *     tags: [Autenticação]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       200:
 *         description: E-mail enviado (se o usuário existir)
 *
 * /api/auth/reset-password:
 *   post:
 *     summary: Redefinir senha com token
 *     tags: [Autenticação]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [token, password]
 *             properties:
 *               token:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Senha alterada com sucesso
 *       400:
 *         description: Token inválido ou expirado
 */
export {};
