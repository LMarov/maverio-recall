import client from 'prom-client';

/** Separate registry (not the global default) so tests can import this module repeatedly without "metric already registered" errors. */
export const metricsRegistry = new client.Registry();
client.collectDefaultMetrics({ register: metricsRegistry });

export const httpRequestsTotal = new client.Counter({
  name: 'http_requests_total',
  help: 'Total HTTP requests handled',
  labelNames: ['method', 'route', 'status_code'],
  registers: [metricsRegistry]
});

export const httpRequestDuration = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'HTTP request duration in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5],
  registers: [metricsRegistry]
});
