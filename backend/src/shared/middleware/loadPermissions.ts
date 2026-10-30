import { Request, Response, NextFunction } from 'express';
import { db } from '../db/index.js';
import {
  user,
  userRoles,
  rolePermissions,
  permissions,
  userPermissions,
} from '../db/schema/index.js';
import { eq, and } from 'drizzle-orm';
import { redis } from '../redis/index.js';

/**
 * Middleware que carrega as permissões do usuário (diretas e herdadas de roles) e
 * as anexa em req.userPermissions (Set de códigos) e req.isAdmin (boolean).
 *
 * Utiliza cache Redis (TTL 60s) para evitar consultas repetidas ao banco.
 * Deve ser usado após o middleware de autenticação (authenticate).
 */
export const loadPermissions = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      req.userPermissions = new Set();
      req.isAdmin = false;
      return next();
    }

    // Tenta obter do cache Redis
    const cacheKey = `permissions:${userId}`;
    const cached = await redis.get(cacheKey);
    if (cached) {
      const data = JSON.parse(cached);
      req.userPermissions = new Set(data.permissions);
      req.isAdmin = data.isAdmin;
      return next();
    }

    // Consulta ao banco
    const [userRecord] = await db.select({ role: user.role }).from(user).where(eq(user.id, userId));

    const isAdmin = userRecord?.role === 'admin';
    req.isAdmin = isAdmin;

    // Busca permissões diretas (granted = true)
    const directPerms = await db
      .select({ code: permissions.code })
      .from(userPermissions)
      .innerJoin(permissions, eq(userPermissions.permissionId, permissions.id))
      .where(and(eq(userPermissions.userId, userId), eq(userPermissions.granted, true)));

    // Busca permissões herdadas de roles
    const rolePerms = await db
      .select({ code: permissions.code })
      .from(userRoles)
      .innerJoin(rolePermissions, eq(userRoles.roleId, rolePermissions.roleId))
      .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
      .where(eq(userRoles.userId, userId));

    // Monta o conjunto
    const permsSet = new Set<string>();
    for (const p of directPerms) permsSet.add(p.code);
    for (const p of rolePerms) permsSet.add(p.code);

    req.userPermissions = permsSet;

    // Salva no Redis por 60 segundos
    await redis.set(
      cacheKey,
      JSON.stringify({
        permissions: Array.from(permsSet),
        isAdmin,
      }),
      'EX',
      60
    );

    next();
  } catch (error) {
    console.error('Failed to load permissions:', error);
    // Em caso de falha, nega permissão por segurança
    req.userPermissions = new Set();
    req.isAdmin = false;
    next(error);
  }
};
