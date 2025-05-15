const promClient = require('prom-client');
const { winstonLogger } = require('./logger');

// Создаем регистр метрик
const register = new promClient.Registry();

// Добавляем стандартные метрики
promClient.collectDefaultMetrics({ register });

// Создаем кастомные метрики
const httpRequestDuration = new promClient.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.1, 0.5, 1, 2, 5]
});

const activeConnections = new promClient.Gauge({
  name: 'active_connections',
  help: 'Number of active VPN connections'
});

const totalRequests = new promClient.Counter({
  name: 'total_requests',
  help: 'Total number of requests',
  labelNames: ['method', 'route']
});

// Регистрируем кастомные метрики
register.registerMetric(httpRequestDuration);
register.registerMetric(activeConnections);
register.registerMetric(totalRequests);

// Middleware для мониторинга HTTP запросов
const monitoringMiddleware = (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    httpRequestDuration
      .labels(req.method, req.route?.path || req.path, res.statusCode.toString())
      .observe(duration / 1000);
    
    totalRequests.inc({ method: req.method, route: req.route?.path || req.path });
  });
  
  next();
};

// Функция для обновления количества активных подключений
const updateActiveConnections = (count) => {
  activeConnections.set(count);
};

module.exports = {
  register,
  monitoringMiddleware,
  updateActiveConnections
}; 