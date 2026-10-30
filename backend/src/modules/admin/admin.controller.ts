// src/modules/admin/admin.controller.ts
import { Request, Response } from 'express';
import * as adminService from './admin.service.js';

// Helper para extrair string de parâmetro (evita string[])
const getStringParam = (param: string | string[]): string =>
  Array.isArray(param) ? param[0] : param;

const getNumericId = (param: string | string[]): number => {
  const id = Array.isArray(param) ? param[0] : param;
  return parseInt(id, 10);
};

// ========== USUÁRIOS ==========
export const listUsers = async (req: Request, res: Response) => {
  try {
    const users = await adminService.getAllUsers();
    res.json(users);
  } catch (error) {
    console.error('Erro ao listar usuários:', error);
    res.status(500).json({ error: 'Falha ao listar usuários' });
  }
};

export const getUser = async (req: Request, res: Response) => {
  try {
    const id = getStringParam(req.params.id);
    const user = await adminService.getUserById(id);
    if (!user) return res.status(404).json({ error: 'Usuário não encontrado' });
    res.json(user);
  } catch (error) {
    console.error('Erro ao obter usuário:', error);
    res.status(500).json({ error: 'Falha ao obter usuário' });
  }
};

export const createUser = async (req: Request, res: Response) => {
  try {
    const { email, password, name, roleIds } = req.body;
    const createdByAdminId = req.user!.id;

    const newUser = await adminService.createUser({
      email,
      password,
      name,
      roleIds,
      createdByAdminId,
      ip: req.ip,
    });

    res.status(201).json(newUser);
  } catch (error: unknown) {
    console.error('Erro ao criar usuário:', error);
    const message = error instanceof Error ? error.message : 'Erro desconhecido';
    // Trata erros específicos do Better Auth (ex: email duplicado)
    if (
      message.toLowerCase().includes('already exists') ||
      message.toLowerCase().includes('unique')
    ) {
      return res.status(409).json({ error: 'Email já está em uso' });
    }
    res.status(500).json({ error: 'Falha ao criar usuário' });
  }
};

export const updateUser = async (req: Request, res: Response) => {
  try {
    const id = getStringParam(req.params.id);
    const updated = await adminService.updateUser(id, req.body);
    if (!updated) return res.status(404).json({ error: 'Usuário não encontrado' });
    res.json(updated);
  } catch (error) {
    console.error('Erro ao atualizar usuário:', error);
    res.status(500).json({ error: 'Falha ao atualizar usuário' });
  }
};

// ========== ROLES ==========
export const listRoles = async (req: Request, res: Response) => {
  try {
    const roles = await adminService.getAllRoles();
    res.json(roles);
  } catch (error) {
    console.error('Erro ao listar roles:', error);
    res.status(500).json({ error: 'Falha ao listar roles' });
  }
};

export const createRole = async (req: Request, res: Response) => {
  try {
    const role = await adminService.createRole(req.body);
    res.status(201).json(role);
  } catch (error) {
    console.error('Erro ao criar role:', error);
    res.status(500).json({ error: 'Falha ao criar role' });
  }
};

export const updateRole = async (req: Request, res: Response) => {
  try {
    const id = getNumericId(req.params.id);
    const updated = await adminService.updateRole(id, req.body);
    if (!updated) return res.status(404).json({ error: 'Role não encontrada' });
    res.json(updated);
  } catch (error) {
    console.error('Erro ao atualizar role:', error);
    res.status(500).json({ error: 'Falha ao atualizar role' });
  }
};

// ========== PERMISSÕES ==========
export const listPermissions = async (req: Request, res: Response) => {
  try {
    const perms = await adminService.getAllPermissions();
    res.json(perms);
  } catch (error) {
    console.error('Erro ao listar permissões:', error);
    res.status(500).json({ error: 'Falha ao listar permissões' });
  }
};

// ========== AUDITORIA ==========
export const listAuditLogs = async (req: Request, res: Response) => {
  try {
    const filters = {
      userId: req.query.userId ? getStringParam(req.query.userId as string | string[]) : undefined,
      action: req.query.action as string | undefined,
      limit: req.query.limit
        ? parseInt(getStringParam(req.query.limit as string | string[]), 10)
        : undefined,
    };
    const logs = await adminService.getAuditLogs(filters);
    res.json(logs);
  } catch (error) {
    console.error('Erro ao listar logs de auditoria:', error);
    res.status(500).json({ error: 'Falha ao listar logs de auditoria' });
  }
};
