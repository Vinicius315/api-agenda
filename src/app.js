import express from 'express';
import pinoHttp from 'pino-http';
import { logger } from './config/logger.js';
import { register } from './config/metrics.js';
import { metricsMiddleware } from './middlewares/metricsMiddleware.js';
import { errorHandler } from './middlewares/errorHandler.js';
import { AgendamentoRepository } from './repositories/AgendamentoRepository.js';
import { AgendamentoService } from './services/AgendamentoService.js';
import { AgendamentoController } from './controllers/AgendamentoController.js';
import { createAgendamentoRoutes } from './routes/agendamentoRoutes.js';

export function createApp(db) {
  const app = express();

  app.use(express.json());
  if (process.env.NODE_ENV !== 'test') {
    app.use(pinoHttp({ logger }));
  }
  app.use(metricsMiddleware);

  app.get('/health', async (_req, res) => {
    try {
      await db.query('SELECT 1');
      return res.status(200).json({ status: 'ok', database: 'connected' });
    } catch {
      return res.status(503).json({ status: 'degraded', database: 'disconnected' });
    }
  });

  app.get('/metrics', async (_req, res) => {
    res.set('Content-Type', register.contentType);
    return res.end(await register.metrics());
  });

  const repository = new AgendamentoRepository(db);
  const service = new AgendamentoService(repository);
  const controller = new AgendamentoController(service);

  app.use('/agendamentos', createAgendamentoRoutes(controller));
  app.use(errorHandler);

  return app;
}
