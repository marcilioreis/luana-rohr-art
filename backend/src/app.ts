import 'dotenv/config';
import express from 'express';
import rateLimit from 'express-rate-limit';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import { toNodeHandler, fromNodeHeaders } from 'better-auth/node';
import { RedisStore } from 'rate-limit-redis';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './docs/swagger.js';
import { auth } from './shared/auth/auth.js';
import productRoutes from './modules/products/products.routes.js';
import orderRoutes from './modules/orders/orders.routes.js';
import adminRoutes from './modules/admin/admin.routes.js';
import { createApolloServer } from './graphql/apollo.js';
import { redis } from './shared/redis/index.js';
import { getUserPermissionSet, getUserRoleNames } from './shared/middleware/rbac.js';

// ---- Rate limiter com prefixo ÚNICO no Redis ----
const apiLimiter = rateLimit({
  store: new RedisStore({
    sendCommand: (...args: any[]) => redis.call(args[0], ...args.slice(1)),
    prefix: 'rl:api:',
  }),
  windowMs: 15 * 60 * 1000,
  max: 300,
  message: { error: 'Limite de requisições da API excedido, tente novamente mais tarde.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const app = express();

try {
  app.set('trust proxy', 1);

  // CORS antes do handler do Better Auth
  app.use(
    cors({
      origin: [
        process.env.FRONTEND_URL || 'http://localhost:5173',
        'http://localhost:4173', // ✅ Vite preview
        'http://127.0.0.1:41705', // ✅ Browser proxy
        'http://localhost:3000',
        'https://studio.apollographql.com',
      ],
      credentials: true,
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
    })
  );

  if (process.env.NODE_ENV !== 'production') {
    app.use(helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false }));
  } else {
    app.use(helmet());
  }

  app.use(compression());
  app.use(morgan('dev'));

  // Health check
  app.get('/health', (req, res) => res.send('OK'));

  // ================== ROTEAMENTO PRINCIPAL ==================

  // Rota personalizada que retorna sessão + permissões
  app.get('/api/auth/get-session', async (req, res) => {
    try {
      const headers = fromNodeHeaders(req.headers);
      const session = await auth.api.getSession({ headers });
      if (!session) {
        return res.json(null);
      }
      const [permissionsSet, roleNames] = await Promise.all([
        getUserPermissionSet(session.user.id),
        getUserRoleNames(session.user.id),
      ]);
      res.json({
        user: session.user,
        session: session.session,
        permissions: Array.from(permissionsSet),
        roles: roleNames,
      });
    } catch (error) {
      console.error('Erro ao obter sessão enriquecida:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // 1. Autenticação (Better Auth)
  app.all('/api/auth/{*splat}', toNodeHandler(auth));

  // 2. JSON parser para as próximas rotas (limite maior p/ upload de imagem base64)
  app.use(express.json({ limit: '10mb' }));

  // 3. Rotas da loja
  //    - products: GET público (PLP/PDP) + gestão (RBAC product:manage) por rota
  //    - orders: autenticação + loadPermissions dentro do próprio router
  app.use('/api/products', apiLimiter, productRoutes);
  app.use('/api/orders', apiLimiter, orderRoutes);
  app.use('/api/admin', adminRoutes);

  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

  // 4. GraphQL (relatórios de vendas)
  const { authMiddleware, apolloMiddleware } = await createApolloServer();
  app.use('/graphql', authMiddleware, apolloMiddleware);
} catch (error) {
  console.error('Erro ao iniciar servidor:', error);
}

export default app;
