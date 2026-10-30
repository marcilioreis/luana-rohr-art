import app from './app.js';
import { startExportWorker } from './shared/queue/export.worker.js';
import { redis } from './shared/redis/index.js';
import { exportQueue } from './shared/queue/export.queue.js';

const PORT = parseInt(process.env.PORT || '3000', 10);

// Inicia o worker do Bull com tratamento de erro
try {
  startExportWorker();
  console.info('📦 Export worker registrado');
} catch (error) {
  console.error('❌ Falha ao iniciar export worker:', error);
}
// Inicia o servidor HTTP
const server = app.listen(PORT, '0.0.0.0', () => {
  console.info(`🚀 Servidor rodando em http://localhost:${PORT}`);
});

// Graceful shutdown
const shutdown = async (signal: string) => {
  console.info(`\n${signal} received. Closing gracefully...`);
  try {
    await exportQueue.close();
    console.info('Fila de exportação fechada');
  } catch (e) {
    console.error(e);
  }
  try {
    await redis.quit();
    console.info('Conexão Redis fechada');
  } catch (e) {
    console.error(e);
  }
  server.close(() => {
    console.info('Servidor HTTP fechado');
    process.exit(0);
  });
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
