import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError, ZodIssue } from 'zod';

/**
 * Middleware que valida o corpo da requisição com um schema Zod.
 * Em caso de sucesso, substitui req.body pelos dados parseados.
 * Em caso de falha, retorna 400 com os detalhes dos erros.
 */
export const validateBody = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = schema.parse(req.body);
      req.body = parsed; // sobrescrita segura, mas sem tipagem exata
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          error: 'Dados inválidos',
          details: error.issues.map((issue: ZodIssue) => ({
            campo: issue.path.join('.'),
            mensagem: issue.message,
          })),
        });
      }
      next(error);
    }
  };
};

/**
 * Middleware para validar parâmetros de query string (req.query).
 */
export const validateQuery = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = schema.parse(req.query);
      // req.query tipado como ParsedQs; convertemos com type assertion
      (req as any).query = parsed;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          error: 'Parâmetros de consulta inválidos',
          details: error.issues.map((issue: ZodIssue) => ({
            campo: issue.path.join('.'),
            mensagem: issue.message,
          })),
        });
      }
      next(error);
    }
  };
};

/**
 * Middleware para validar parâmetros de rota (req.params).
 */
export const validateParams = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = schema.parse(req.params);
      (req as any).params = parsed;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          error: 'Parâmetros de rota inválidos',
          details: error.issues.map((issue: ZodIssue) => ({
            campo: issue.path.join('.'),
            mensagem: issue.message,
          })),
        });
      }
      next(error);
    }
  };
};
