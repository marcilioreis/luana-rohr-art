// src/modules/orders/orders.controller.ts
import { Request, Response } from 'express';
import path from 'path';
import fs from 'fs/promises';
import * as orderService from './orders.service.js';
import * as reportsService from './reports.service.js';
import type { OrderStatus } from '../../shared/db/schema/orders.js';
import { exportQueue } from '../../shared/queue/export.queue.js';
import { storage } from '../../shared/storage/storage.js';
import { db } from '../../shared/db/index.js';
import { auditLogs } from '../../shared/db/schema/audit.js';

const getNumericId = (param: string | string[]): number => {
  const id = Array.isArray(param) ? param[0] : param;
  return parseInt(id, 10);
};

// ========== CLIENTE ==========
export const createOrder = async (req: Request, res: Response) => {
  try {
    const customerId = req.user!.id;
    const order = await orderService.createOrder(customerId, req.body);
    res.status(201).json(order);

    if (order) {
      await db.insert(auditLogs).values({
        userId: customerId,
        action: 'order.create',
        entityType: 'order',
        entityId: order.id,
        details: { orderNumber: order.orderNumber, total: order.total },
        ip: req.ip,
      });
    }
  } catch (error: unknown) {
    console.error('Create order error:', error);
    const message = error instanceof Error ? error.message : 'Erro desconhecido';
    if (message.includes('Estoque insuficiente'))
      return res.status(409).json({ error: 'Estoque insuficiente para um dos itens' });
    if (message.includes('indisponível'))
      return res.status(409).json({ error: 'Um dos produtos está indisponível' });
    res.status(500).json({ error: 'Falha ao criar pedido' });
  }
};

export const listMyOrders = async (req: Request, res: Response) => {
  try {
    const orders = await orderService.findByCustomerEnriched(req.user!.id);
    res.json(orders);
  } catch (error) {
    console.error('List my orders error:', error);
    res.status(500).json({ error: 'Falha ao listar pedidos' });
  }
};

export const getMyOrder = async (req: Request, res: Response) => {
  try {
    const id = getNumericId(req.params.id);
    const order = await orderService.findByIdEnriched(id);
    if (!order) return res.status(404).json({ error: 'Pedido não encontrado' });
    // Cliente só vê o próprio pedido; admin vê qualquer um
    if (!req.isAdmin && order.customerId !== req.user!.id) {
      return res.status(403).json({ error: 'Acesso negado' });
    }
    res.json(order);
  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({ error: 'Falha ao obter pedido' });
  }
};

// ========== ADMIN ==========
export const listOrders = async (req: Request, res: Response) => {
  try {
    const status =
      typeof req.query.status === 'string' ? (req.query.status as OrderStatus) : undefined;
    const orders = await orderService.findAllEnriched(status);
    res.json(orders);
  } catch (error) {
    console.error('List orders error:', error);
    res.status(500).json({ error: 'Falha ao listar pedidos' });
  }
};

export const updateOrderStatus = async (req: Request, res: Response) => {
  try {
    const id = getNumericId(req.params.id);
    const { status } = req.body as { status: OrderStatus };
    const order = await orderService.updateStatus(id, status);
    if (!order) return res.status(404).json({ error: 'Pedido não encontrado' });
    res.json(order);

    await db.insert(auditLogs).values({
      userId: req.user!.id,
      action: 'order.status_change',
      entityType: 'order',
      entityId: id,
      details: { status },
      ip: req.ip,
    });
  } catch (error: unknown) {
    console.error('Update order status error:', error);
    const message = error instanceof Error ? error.message : 'Erro desconhecido';
    if (message.includes('Transição inválida')) return res.status(400).json({ error: message });
    if (message.includes('Status inválido'))
      return res.status(400).json({ error: 'Status inválido' });
    res.status(500).json({ error: 'Falha ao atualizar status do pedido' });
  }
};

export const confirmPayment = async (req: Request, res: Response) => {
  try {
    const id = getNumericId(req.params.id);
    const order = await orderService.updateStatus(id, 'pago');
    if (!order) return res.status(404).json({ error: 'Pedido não encontrado' });
    res.json(order);

    await db.insert(auditLogs).values({
      userId: req.user!.id,
      action: 'order.payment_confirmed',
      entityType: 'order',
      entityId: id,
      details: { orderNumber: order.orderNumber },
      ip: req.ip,
    });
  } catch (error: unknown) {
    console.error('Confirm payment error:', error);
    const message = error instanceof Error ? error.message : 'Erro desconhecido';
    if (message.includes('Transição inválida'))
      return res.status(400).json({ error: 'O pedido não está aguardando pagamento' });
    res.status(500).json({ error: 'Falha ao confirmar pagamento' });
  }
};

// ========== EXPORTAÇÃO (BullMQ) ==========
export const requestExport = async (req: Request, res: Response) => {
  try {
    const { format = 'csv', filters } = req.body;
    const record = await reportsService.createExportRequest(req.user!.id, format, filters);

    await exportQueue.add(`export-${record.id}`, {
      exportId: record.id,
      format,
      userId: req.user!.id,
      filters,
    });

    res.status(202).json({
      exportId: record.id,
      status: 'pendente',
      message: 'Exportação solicitada. Verifique o status em /api/orders/exports/:exportId/status',
    });
  } catch (error) {
    console.error('Request export error:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

export const getExportStatus = async (req: Request, res: Response) => {
  try {
    const exportId = getNumericId(req.params.exportId);
    const record = await reportsService.getExportById(exportId);
    if (!record) return res.status(404).json({ error: 'Exportação não encontrada' });

    let downloadLink = null;
    if (record.status === 'concluido') {
      if (process.env.STORAGE_DRIVER === 'local') {
        downloadLink = `/api/orders/exports/${record.id}/download`;
      } else {
        downloadLink = await storage.getSignedDownloadUrl(record.fileName!, 1800);
      }
    }
    res.json({ id: record.id, status: record.status, downloadLink });
  } catch (error) {
    console.error('Get export status error:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

export const downloadExport = async (req: Request, res: Response) => {
  try {
    const exportId = getNumericId(req.params.exportId);
    const record = await reportsService.getExportById(exportId);
    if (!record || record.status !== 'concluido') {
      return res.status(404).json({ error: 'Exportação não encontrada ou não concluída' });
    }

    if (process.env.STORAGE_DRIVER === 'local') {
      const filePath = path.join(process.cwd(), 'exports', record.fileName!);
      try {
        const stat = await fs.stat(filePath);
        res.setHeader('Content-Type', 'application/octet-stream');
        res.setHeader('Content-Disposition', `attachment; filename="${record.fileName}"`);
        res.setHeader('Content-Length', stat.size);
        const fileStream = await fs.open(filePath, 'r');
        fileStream.createReadStream().pipe(res);
      } catch (err) {
        console.error('Erro ao ler arquivo local:', err);
        res.status(500).json({ error: 'Arquivo não encontrado no servidor' });
      }
      return;
    }

    const signedUrl = await storage.getSignedDownloadUrl(record.fileName!, 3600);
    res.redirect(signedUrl);
  } catch (error) {
    console.error('Download export error:', error);
    res.status(500).json({ error: 'Erro ao fazer download do arquivo' });
  }
};
