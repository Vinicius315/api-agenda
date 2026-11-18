import { AppError } from '../errors/AppError.js';
import { logger } from '../config/logger.js';

export function errorHandler(err, req, res, _next) {
  if (err instanceof AppError) {
    logger.warn({ err, path: req.originalUrl, method: req.method }, err.message);
    return res.status(err.statusCode).json({
      error: err.code,
      message: err.message,
    });
  }

  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({
      error: 'INVALID_JSON',
      message: 'Corpo da requisicao contem JSON invalido.',
    });
  }

  logger.error({ err, path: req.originalUrl, method: req.method }, 'Erro interno inesperado');
  return res.status(500).json({
    error: 'INTERNAL_SERVER_ERROR',
    message: 'Erro interno no servidor.',
  });
}
