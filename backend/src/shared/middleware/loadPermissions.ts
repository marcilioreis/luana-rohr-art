// src/shared/auth/loadPermissions.ts
// (ajuste o caminho do import conforme a estrutura do seu projeto)
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
import { cacheGet, cacheSet } from '../redis/cache.js';

/**
 * Middleware que carrega as permissões do usuário (diretas e herdadas de roles)
 * e as anexa em `req.userPermissions` (Set de códigos) e `req.isAdmin` (boolean).
 *
 * Cache:
 * - Usa `cacheGet`/`cacheSet` (resilientes): falha de Redis = cache miss silencioso.
 * - TTL de 60s por usuário.
 * - Desligável globalmente via REDIS_CACHE_ENABLED=false.
 *
 * Erros:
 * - Falha de banco: nega permissões e propaga via `next(error)`.
 * - Falha de cache: ignorada (nunca derruba a request).
 *
 * Deve ser usado após o middleware de autenticação (`authenticate`).
 */
const CACHE_TTL_SECONDS = 60;

interface CachedPermissions {
  permissions: string[];
  isAdmin: boolean;
}

export const loadPermissions = async (req: Request, _res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;

    // Sem usuário autenticado: segue com permissões vazias
    if (!userId) {
      req.userPermissions = new Set();
      req.isAdmin = false;
      return next();
    }

    const cacheKey = `permissions:${userId}`;

    // 1) Tenta cache (falha silenciosa → retorna null → segue pro DB)
    const cached = await cacheGet<CachedPermissions>(cacheKey);
    if (cached && Array.isArray(cached.permissions) && typeof cached.isAdmin === 'boolean') {
      req.userPermissions = new Set(cached.permissions);
      req.isAdmin = cached.isAdmin;
      return next();
    }

    // 2) Cache miss: consulta ao banco
    const [userRecord] = await db.select({ role: user.role }).from(user).where(eq(user.id, userId));

    const isAdmin = userRecord?.role === 'admin';

    // Permissões diretas (granted = true)
    const directPerms = await db
      .select({ code: permissions.code })
      .from(userPermissions)
      .innerJoin(permissions, eq(userPermissions.permissionId, permissions.id))
      .where(and(eq(userPermissions.userId, userId), eq(userPermissions.granted, true)));

    // Permissões herdadas de roles
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

    // 3) Anexa na request
    req.userPermissions = permsSet;
    req.isAdmin = isAdmin;

    // 4) Popula o cache (falha silenciosa, nunca derruba a request)
    await cacheSet(
      cacheKey,
      { permissions: Array.from(permsSet), isAdmin } satisfies CachedPermissions,
      CACHE_TTL_SECONDS
    );

    return next();
  } catch (error) {
    // Só chega aqui em falha real (banco, tipicamente).
    // Mantém o comportamento de negar por segurança e propaga o erro.
    console.error('❌ Falha ao carregar permissões (DB):', error);
    req.userPermissions = new Set();
    req.isAdmin = false;
    return next(error);
  }
};
