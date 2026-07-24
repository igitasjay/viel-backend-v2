import winston from 'winston';
import config from '@/config/config';

const { combine, timestamp, json, errors, align, printf, colorize } =
  winston.format;

const devConsoleFormat = combine(
  colorize({ all: true }),
  timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  align(),
  printf(({ timestamp, level, message, ...meta }) => {
    const metaString = Object.keys(meta).length
      ? `\n${JSON.stringify(meta)}`
      : '';
    return `${timestamp} [${level}]: ${message} ${metaString}`;
  }),
);

const transports: winston.transport[] = [
  new winston.transports.Console({
    format: config.NODE_ENV !== 'production' ? devConsoleFormat : undefined,
  }),
];

const logger = winston.createLogger({
  level: config.LOG_LEVEL || 'info',
  format: combine(timestamp(), errors({ stack: true }), json()),
  transports,
  silent: config.NODE_ENV === 'test',
});

export { logger };
