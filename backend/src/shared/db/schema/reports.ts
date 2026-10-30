// src/shared/db/schema/reports.ts
import { pgTable, serial, varchar, text, integer, jsonb, timestamp } from 'drizzle-orm/pg-core';
import { user } from './auth.js';
import { InferInsertModel, InferSelectModel } from 'drizzle-orm';

// Exportações de relatórios de vendas/pedidos (geradas via fila BullMQ).
// A exportação é de pedidos; os filtros (status/intervalo) ficam no campo jsonb.
export const exportedReports = pgTable('exported_reports', {
  id: serial('id').primaryKey(),
  userId: text('user_id')
    .references(() => user.id)
    .notNull(),
  exportedAt: timestamp('exported_at').defaultNow(),
  format: varchar('format', { length: 20 }).notNull(),
  // Filtros aplicados na exportação (status, intervalo de datas)
  filters: jsonb('filters'),
  fileName: varchar('file_name', { length: 255 }),
  fileSize: integer('file_size'),
  status: varchar('status', { length: 20 }).default('pendente'),
  downloadLink: text('download_link'),
  expiresAt: timestamp('expires_at'),
});

export type ExportedReport = InferSelectModel<typeof exportedReports>;
export type InsertExportedReport = InferInsertModel<typeof exportedReports> & {
  filters?: {
    status?: string;
    startDate?: string;
    endDate?: string;
  } | null;
};
