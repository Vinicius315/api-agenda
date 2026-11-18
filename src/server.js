import 'dotenv/config';
import { pool } from './config/database.js';
import { logger } from './config/logger.js';
import { createApp } from './app.js';

const PORT = Number(process.env.PORT) || 3000;
const app = createApp(pool);

const server = app.listen(PORT, () => {
  logger.info({ port: PORT }, 'Servidor API Agenda iniciado');
});

async function shutdown(signal) {
  logger.info({ signal }, 'Encerrando servidor...');
  server.close(async () => {
    await pool.end();
    process.exit(0);
  });
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
