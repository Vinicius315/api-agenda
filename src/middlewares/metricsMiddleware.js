import { httpRequestDuration } from '../config/metrics.js';

export function metricsMiddleware(req, res, next) {
  const end = httpRequestDuration.startTimer();

  res.on('finish', () => {
    const route = req.route ? `${req.baseUrl}${req.route.path}` : req.path;
    end({
      method: req.method,
      route,
      status_code: String(res.statusCode),
    });
  });

  next();
}
