import { Request, Response, NextFunction } from 'express';
import { db } from '../db/index.js';
import {
  user,
  userRoles,
  roles,
  rolePermissions,
  permissions,
  userPermissions,
} from '../db/schema/index.js';
import { eq, and } from 'drizzle-orm';

/**
 * Verifica se o usuário possui uma determinada permissão.
 * Utiliza o cache carregado em req.userPermissions (loadPermissions middleware).
 */
export const hasPermission = (req: Request, permissionCode: string): boolean => {
  if (req.isAdmin) return true; // admin tem acesso total
  return req.userPermissions?.has(permissionCode) ?? false;
};

/**
 * Verifica múltiplas permissões.
 */
export const hasPermissions = (
  req: Request,
  permissionCodes: string[],
  mode: 'any' | 'all' = 'any'
): boolean => {
  if (req.isAdmin) return true;
  if (!req.userPermissions) return false;
  if (permissionCodes.length === 0) return true;
  if (mode === 'any') {
    return permissionCodes.some((code) => req.userPermissions!.has(code));
  } else {
    return permissionCodes.every((code) => req.userPermissions!.has(code));
  }
};

/**
 * Middleware de autorização (atualizado).
 */
export const authorize = (required: string | string[] | { any?: string[]; all?: string[] }) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const { user } = req;
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    let requiredCodes: string[] = [];
    let mode: 'any' | 'all' = 'all';

    if (typeof required === 'string') {
      requiredCodes = [required];
    } else if (Array.isArray(required)) {
      requiredCodes = required;
      mode = 'all';
    } else if (typeof required === 'object') {
      if (required.all) {
        requiredCodes = required.all;
        mode = 'all';
      } else if (required.any) {
        requiredCodes = required.any;
        mode = 'any';
      }
    }

    if (req.isAdmin) return next(); // admin passa direto
    const allowed = hasPermissions(req, requiredCodes, mode);
    if (!allowed) return res.status(403).json({ error: 'Forbidden' });
    next();
  };
};

/**
 * Retorna os nomes das roles vinculadas ao usuário.
 */
export async function getUserRoleNames(userId: string): Promise<string[]> {
  const result = await db
    .select({ name: roles.name })
    .from(userRoles)
    .innerJoin(roles, eq(userRoles.roleId, roles.id))
    .where(eq(userRoles.userId, userId));

  return result.map((r) => r.name);
}

/**
 * Retorna um Set com os códigos de todas as permissões do usuário
 * (diretas e herdadas de roles). Admin implícito tem todas.
 */
export async function getUserPermissionSet(userId: string): Promise<Set<string>> {
  // Verifica se é admin pelo campo role (fallback rápido)
  const [userRecord] = await db.select({ role: user.role }).from(user).where(eq(user.id, userId));

  if (userRecord?.role === 'admin') {
    // Retorna um Set com todas as permissões cadastradas
    const allPerms = await db.select({ code: permissions.code }).from(permissions);
    return new Set(allPerms.map((p) => p.code));
  }

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

  const set = new Set<string>();
  for (const p of directPerms) set.add(p.code);
  for (const p of rolePerms) set.add(p.code);
  return set;
}
