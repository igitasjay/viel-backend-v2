import winson from 'winston';
import config from '@/config';

const { combine, timestamp, json, errors, align, printf, colorize } =
  winson.format;

const transports: winson.transport[] = [];

if (config.NODE_ENV !== 'production') {
  transports.push(
    new winson.transports.Console({
      format: combine(
        colorize({ all: true }),
        timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        align(),
        printf(({ timestamp, level, message, ...meta }) => {
          const metaString = Object.keys(meta).length
            ? `\n${JSON.stringify(meta)}`
            : '';
          return `${timestamp} [${level}]: ${message} ${metaString}`;
        }),
      ),
    }),
  );
}

const logger = winson.createLogger({
  level: config.LOG_LEVEL || 'info',
  format: combine(timestamp(), errors({ stack: true }), json()),
  transports,
  silent: config.NODE_ENV === 'test',
});

export { logger };
