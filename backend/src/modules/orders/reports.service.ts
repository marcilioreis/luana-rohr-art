// src/modules/orders/reports.service.ts
import { db } from '../../shared/db/index.js';
import { exportedReports } from '../../shared/db/schema/reports.js';
import { eq } from 'drizzle-orm';

export interface ExportFilters {
  status?: string;
  startDate?: string;
  endDate?: string;
}

export const createExportRequest = async (
  userId: string,
  format: 'csv' | 'xlsx' | 'json' | 'pdf',
  filters?: ExportFilters
) => {
  const [record] = await db
    .insert(exportedReports)
    .values({ userId, format, filters, status: 'pendente' })
    .returning();
  return record;
};

export const updateExportStatus = async (
  exportId: number,
  status: 'processando' | 'concluido' | 'falha'
) => {
  await db.update(exportedReports).set({ status }).where(eq(exportedReports.id, exportId));
};

export const completeExport = async (
  exportId: number,
  fileName: string,
  fileSize: number,
  downloadLink: string
) => {
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  await db
    .update(exportedReports)
    .set({ status: 'concluido', fileName, fileSize, downloadLink, expiresAt })
    .where(eq(exportedReports.id, exportId));
};

export const getExportById = async (exportId: number) => {
  const [exp] = await db.select().from(exportedReports).where(eq(exportedReports.id, exportId));
  return exp;
};
