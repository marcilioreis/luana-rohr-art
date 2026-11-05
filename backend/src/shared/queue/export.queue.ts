import { Queue } from 'bullmq';
import { redis } from '../redis/index.js';
import type { ExportJobData } from './export.worker.js';

export const exportQueue = new Queue<ExportJobData>('order-exports', {
  connection: redis,
  defaultJobOptions: {
    removeOnComplete: { age: 3600, count: 100 },
    removeOnFail: { age: 24 * 3600, count: 500 },
    attempts: 3,
    backoff: { type: 'exponential', delay: 5000 },
  },
});
