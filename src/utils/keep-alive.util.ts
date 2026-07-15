import { config } from '@shared/config/config';
import { logger } from '@/lib/winston';

const KEEP_ALIVE_INTERVAL_MS = 4 * 60 * 1000; // 4 minutes
let intervalId: NodeJS.Timeout | null = null;

/**
 * Pings the server's own /health endpoint every 4 minutes
 * to prevent idle shutdown on platforms like Render free tier.
 * Only runs when in production and SERVER_URL is configured.
 */
export function startKeepAlive(): void {
  if (config.env !== 'production' || !config.serverUrl) {
    logger.info('Keep-alive disabled (non-production or SERVER_URL not set)');
    return;
  }

  const url = `${config.serverUrl}/health`;

  intervalId = setInterval(async () => {
    try {
      const response = await fetch(url);
      const data = await response.json() as { status: string };
      logger.info(`Keep-alive ping: ${data.status}`);
    } catch (error: any) {
      logger.error(`Keep-alive ping failed: ${error.message}`);
    }
  }, KEEP_ALIVE_INTERVAL_MS);

  logger.info(`Keep-alive started: pinging ${url} every 4 minutes`);
}

export function stopKeepAlive(): void {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
    logger.info('Keep-alive stopped');
  }
}
