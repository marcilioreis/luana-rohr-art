import { eq, and, asc, desc } from 'drizzle-orm';
import { db } from '../../shared/db/index.js';
import {
  user,
  userRoles,
  roles,
  rolePermissions,
  permissions,
} from '../../shared/db/schema/index.js';
import { auditLogs } from '../../shared/db/schema/audit.js';
import { auth } from '../../shared/auth/auth.js';

// ========== USUÁRIOS ==========
export const getAllUsers = async () => {
  // Retorna usuário com suas roles RBAC
  const rows = await db
    .select({
      id: user.id,
      email: user.email,
      name: user.name,
      active: user.active,
      role: user.role,
      createdAt: user.createdAt,
    })
    .from(user)
    .orderBy(asc(user.name));

  // Para cada usuário, busca suas roles
  const usersWithRoles = await Promise.all(
    rows.map(async (u) => {
      const userRoleRows = await db
        .select({
          roleId: roles.id,
          roleName: roles.name,
        })
        .from(userRoles)
        .innerJoin(roles, eq(userRoles.roleId, roles.id))
        .where(eq(userRoles.userId, u.id));
      return {
        ...u,
        roles: userRoleRows,
      };
    })
  );
  return usersWithRoles;
};

export const getUserById = async (userId: string) => {
  const [u] = await db.select().from(user).where(eq(user.id, userId));
  if (!u) return null;

  const userRoleRows = await db
    .select({
      roleId: roles.id,
      roleName: roles.name,
    })
    .from(userRoles)
    .innerJoin(roles, eq(userRoles.roleId, roles.id))
    .where(eq(userRoles.userId, userId));

  return { ...u, roles: userRoleRows };
};

export const createUser = async (data: {
  email: string;
  password: string;
  name: string;
  roleIds?: number[];
  createdByAdminId: string;
  ip?: string;
}) => {
  const response = await auth.api.signUpEmail({
    body: {
      email: data.email,
      password: data.password,
      name: data.name,
    },
    asResponse: false,
  });

  // O `response` é um objeto com ao menos a propriedade `user` (e `token` ou `null`)
  // Extrai o usuário de forma segura ignorando a ambiguidade de `token`
  const user = (response as { user: { id: string; email: string; name: string } }).user;

  // Se foram enviados roleIds, associa ao usuário recém-criado
  if (data.roleIds && data.roleIds.length > 0) {
    const inserts = data.roleIds.map((roleId) => ({
      userId: user.id,
      roleId,
    }));
    await db.insert(userRoles).values(inserts);
  }

  // Registra no log de auditoria
  await db.insert(auditLogs).values({
    userId: data.createdByAdminId, // string (UUID) → OK
    action: 'user.create',
    entityType: 'user',
    details: {
      createdUserId: user.id, // guarda o UUID do novo usuário nos detalhes
      email: user.email,
      name: user.name,
    },
    ip: data.ip || '127.0.0.1', // IP passado pelo controller ou fallback
  });

  // Retorna o usuário com suas roles (já incluídas, se houve)
  return getUserById(user.id);
};

export const updateUser = async (
  userId: string,
  data: {
    name?: string;
    email?: string;
    role?: string;
    roleIds?: number[];
    active?: boolean;
  }
) => {
  const existing = await getUserById(userId);
  if (!existing) {
    throw new Error('Usuário não encontrado');
  }

  // Atualiza campos diretos
  if (data.name || data.email || data.role !== undefined || data.active !== undefined) {
    const updateData: any = {};
    if (data.name) updateData.name = data.name;
    if (data.email) updateData.email = data.email;
    if (data.role !== undefined) updateData.role = data.role;
    if (data.active !== undefined) updateData.active = data.active;
    if (Object.keys(updateData).length > 0) {
      await db.update(user).set(updateData).where(eq(user.id, userId));
    }
  }

  // Se enviado roleIds, substitui as roles do usuário
  if (data.roleIds !== undefined) {
    await db.transaction(async (tx) => {
      await tx.delete(userRoles).where(eq(userRoles.userId, userId));
      if (data.roleIds!.length > 0) {
        const inserts = data.roleIds!.map((roleId) => ({
          userId,
          roleId,
        }));
        await tx.insert(userRoles).values(inserts);
      }
    });
  }

  return getUserById(userId);
};

// ========== ROLES ==========
export const getAllRoles = async () => {
  const allRoles = await db.select().from(roles).orderBy(asc(roles.name));
  const rolesWithPermissions = await Promise.all(
    allRoles.map(async (r) => {
      const permRows = await db
        .select({
          permissionId: permissions.id,
          code: permissions.code,
          description: permissions.description,
        })
        .from(rolePermissions)
        .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
        .where(eq(rolePermissions.roleId, r.id));
      return { ...r, permissions: permRows };
    })
  );
  return rolesWithPermissions;
};

export const createRole = async (data: {
  name: string;
  description?: string;
  permissionIds?: number[];
}) => {
  const [newRole] = await db
    .insert(roles)
    .values({ name: data.name, description: data.description })
    .returning();
  if (data.permissionIds && data.permissionIds.length > 0) {
    const inserts = data.permissionIds.map((permId) => ({
      roleId: newRole.id,
      permissionId: permId,
    }));
    await db.insert(rolePermissions).values(inserts);
  }
  return getRoleById(newRole.id);
};

export const getRoleById = async (roleId: number) => {
  const [r] = await db.select().from(roles).where(eq(roles.id, roleId));
  if (!r) return null;
  const permRows = await db
    .select({
      permissionId: permissions.id,
      code: permissions.code,
      description: permissions.description,
    })
    .from(rolePermissions)
    .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
    .where(eq(rolePermissions.roleId, roleId));
  return { ...r, permissions: permRows };
};

export const updateRole = async (
  roleId: number,
  data: { name?: string; description?: string; permissionIds?: number[] }
) => {
  const updateData: any = {};
  if (data.name) updateData.name = data.name;
  if (data.description) updateData.description = data.description;
  if (Object.keys(updateData).length > 0) {
    await db.update(roles).set(updateData).where(eq(roles.id, roleId));
  }
  if (data.permissionIds !== undefined) {
    await db.transaction(async (tx) => {
      await tx.delete(rolePermissions).where(eq(rolePermissions.roleId, roleId));
      if (data.permissionIds!.length > 0) {
        const inserts = data.permissionIds!.map((permId) => ({
          roleId,
          permissionId: permId,
        }));
        await tx.insert(rolePermissions).values(inserts);
      }
    });
  }
  return getRoleById(roleId);
};

// ========== PERMISSÕES ==========
export const getAllPermissions = async () => {
  return db.select().from(permissions).orderBy(asc(permissions.code));
};

// ========== AUDITORIA ==========
export const getAuditLogs = async (filters?: {
  userId?: string;
  action?: string;
  limit?: number;
}) => {
  const conditions = [];

  if (filters?.userId) {
    conditions.push(eq(auditLogs.userId, filters.userId));
  }
  if (filters?.action) {
    conditions.push(eq(auditLogs.action, filters.action));
  }

  const logs = await db
    .select()
    .from(auditLogs)
    .where(and(...conditions))
    .orderBy(desc(auditLogs.createdAt))
    .limit(filters?.limit || 100);

  return logs;
};
