// src/shared/queue/export.worker.ts
import { Worker, Job } from 'bullmq';
import { json2csv } from 'json-2-csv';
import { storage } from '../../shared/storage/storage.js';
import * as reportsService from '../../modules/orders/reports.service.js';
import * as orderService from '../../modules/orders/orders.service.js';
import { generatePdf, generateXlsx } from '../../modules/orders/export-helpers.js';
import type { OrderStatus } from '../db/schema/orders.js';
import { redis } from '../redis/index.js';

export interface ExportJobData {
  exportId: number;
  format: 'csv' | 'xlsx' | 'json' | 'pdf';
  userId: string;
  filters?: {
    status?: OrderStatus;
    startDate?: string;
    endDate?: string;
  };
}

export const startExportWorker = () => {
  const worker = new Worker<ExportJobData>(
    'order-exports',
    async (job: Job<ExportJobData>) => {
      const { exportId, format, filters: rawFilters } = job.data;
      console.info(`📤 Job ${exportId} iniciado`);

      try {
        await reportsService.updateExportStatus(exportId, 'processando');

        const data = await orderService.getExportData({
          status: rawFilters?.status,
          startDate: rawFilters?.startDate ? new Date(rawFilters.startDate) : undefined,
          endDate: rawFilters?.endDate ? new Date(rawFilters.endDate) : undefined,
        });
        console.info(`📊 Pedidos obtidos: ${data.length} linhas`);

        let fileContent: Buffer | string;
        let extension: string;
        let mimeType: string;

        switch (format) {
          case 'csv':
            fileContent = data.length ? json2csv(data) : '';
            mimeType = 'text/csv';
            extension = 'csv';
            break;
          case 'json':
            fileContent = JSON.stringify(data, null, 2);
            mimeType = 'application/json';
            extension = 'json';
            break;
          case 'pdf':
            fileContent = await generatePdf(data);
            mimeType = 'application/pdf';
            extension = 'pdf';
            break;
          case 'xlsx':
            fileContent = await generateXlsx(data);
            mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
            extension = 'xlsx';
            break;
          default:
            throw new Error(`Formato não suportado: ${format}`);
        }

        const fileName = `pedidos_export_${exportId}_${Date.now()}.${extension}`;
        const downloadLink = await storage.save(fileName, fileContent, mimeType);

        await reportsService.completeExport(
          exportId,
          fileName,
          Buffer.byteLength(fileContent),
          downloadLink
        );

        console.info(`✅ Exportação ${exportId} concluída`);
        return { success: true, fileName };
      } catch (error) {
        console.error(`Export job ${exportId} failed:`, error);
        try {
          await reportsService.updateExportStatus(exportId, 'falha');
        } catch (updateError) {
          console.error(`Failed to update export status for ${exportId}:`, updateError);
        }
        throw error;
      }
    },
    {
      connection: redis,
      autorun: true,
    }
  );

  worker.on('ready', () => {
    console.info('📦 BullMQ worker pronto e aguardando jobs');
  });
  worker.on('error', (err) => {
    console.error('❌ Erro no worker:', err);
  });
  worker.on('failed', (job, err) => {
    console.error(`❌ Job ${job?.id} falhou:`, err.message);
  });
};
