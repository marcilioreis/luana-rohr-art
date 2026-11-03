// src/shared/auth/middleware.ts
import { Request, Response, NextFunction } from 'express';
import { auth } from './auth.js';
import { fromNodeHeaders } from 'better-auth/node';

export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const headers = fromNodeHeaders(req.headers);
    const session = await auth.api.getSession({ headers });

    if (!session) {
      return res.status(401).json({ error: 'Não autorizado' });
    }
    req.user = session.user;
    req.session = session.session; // Armazena a sessão completa para uso futuro, se necessário

    // // eslint-disable-next-line no-console
    // console.log('req.user :>> ', req.user);
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Autenticação opcional: popula req.user se houver sessão, mas NÃO retorna 401 se
// não houver (usado no checkout de convidado, onde o cliente pode estar deslogado).
export const optionalAuthenticate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const headers = fromNodeHeaders(req.headers);
    const session = await auth.api.getSession({ headers });

    if (session) {
      req.user = session.user;
      req.session = session.session;
    }
    next();
  } catch (error) {
    console.error('Optional authentication error:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
};
