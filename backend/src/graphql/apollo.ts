// src/graphql/apollo.ts
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@as-integrations/express5';
import { Request, Response, NextFunction } from 'express';
import { typeDefs } from './schema.js';
import { resolvers } from './resolvers.js';
import { GraphQLContext } from './types.js';
import { authenticate } from '../shared/auth/middleware.js';

export const createApolloServer = async () => {
  const server = new ApolloServer<GraphQLContext>({
    typeDefs,
    resolvers,
  });

  await server.start();

  // Middleware de autenticação adaptado para Apollo
  const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
    // O Apollo precisa que req.user esteja disponível
    authenticate(req, res, next);
  };

  const apolloMiddleware = expressMiddleware(server, {
    context: async ({ req }: { req: Request }): Promise<GraphQLContext> => ({
      userId: req.user?.id,
    }),
  });

  return { authMiddleware, apolloMiddleware };
};
