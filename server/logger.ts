/**
 * Minimal structured logger for the spatial-analysis API.
 *
 * Writes newline-delimited JSON to stdout so that any log aggregation system
 * (Datadog, CloudWatch, Loki, etc.) can parse records without extra config.
 * Errors go to stderr to keep them separable from regular output.
 *
 * Usage:
 *   import {logger} from './logger';
 *   logger.info('server started', {port: 8787});
 *   logger.error('unhandled error', {message: err.message});
 */

type Level = 'info' | 'warn' | 'error';

type LogRecord = {
  ts: string;
  level: Level;
  msg: string;
  [key: string]: unknown;
};

const write = (level: Level, msg: string, meta: Record<string, unknown> = {}) => {
  const record: LogRecord = {
    ts: new Date().toISOString(),
    level,
    msg,
    ...meta,
  };
  const line = JSON.stringify(record);
  if (level === 'error') {
    process.stderr.write(line + '\n');
  } else {
    process.stdout.write(line + '\n');
  }
};

export const logger = {
  info: (msg: string, meta?: Record<string, unknown>) => write('info', msg, meta),
  warn: (msg: string, meta?: Record<string, unknown>) => write('warn', msg, meta),
  error: (msg: string, meta?: Record<string, unknown>) => write('error', msg, meta),
};
