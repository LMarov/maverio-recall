import pino from 'pino';

/**
 * Structured app-wide logger. JSON lines in production (so a log shipper can
 * parse them); pretty-printed to the console everywhere else, including
 * tests, where pino-pretty's own worker-thread transport doesn't play well
 * with vitest's module runner.
 */
export const logger = pino({
  level: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'test' ? 'silent' : 'info'),
  transport:
    process.env.NODE_ENV === 'production'
      ? undefined
      : { target: 'pino-pretty', options: { colorize: true, translateTime: 'HH:MM:ss', ignore: 'pid,hostname' } }
});
