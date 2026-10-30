import { Queue } from 'bullmq';
import { redis } from '../redis/index.js';
import type { ExportJobData } from './export.worker.js';

export const exportQueue = new Queue<ExportJobData>('order-exports', {
  connection: redis,
});
