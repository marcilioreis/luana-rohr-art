// src/docs/swagger.ts
import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Luana Rohr Art — Loja API',
      version: '1.0.0',
      description: 'Documentação da API da loja virtual de camisetas',
    },
    servers: [
      {
        url: process.env.BETTER_AUTH_URL || 'http://localhost:3000',
        description: 'Servidor atual',
      },
    ],
    components: {
      securitySchemes: {
        cookieAuth: {
          type: 'apiKey',
          in: 'cookie',
          name: '__Secure-better-auth.session_token',
          description: 'Cookie de sessão obtido após login',
        },
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Token JWT para autenticação (futuro)',
        },
      },
    },
    security: [{ cookieAuth: [] }],
  },
  apis: [
    './src/modules/**/*.routes.ts', // onde estão as anotações JSDoc
  ],
};

export const swaggerSpec = swaggerJsdoc(options);
