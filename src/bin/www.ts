import http from 'http';
import app from '../server.js';
import { prisma } from '@/shared/db/prisma';
import { config } from '@shared/config/config';
import { logger } from '@/lib/winston';
import {
  startAllNotificationJobs,
  startGiftcardCodePolling,
} from '../scheduler';
import { initPublisher, closePublisher } from '@shared/workers/publisher';
import { startWorker } from '@/shared/workers/consumer';
import { startProductSyncJob } from '@/internals/giftcard/sync-giftcard-product-job';
// import { startPriceAlertMonitoring } from "../scheduler/price-alert-job";
// import { initializeSocketIO } from "@shared/lib/socket";
// import { initializeSupportSocket } from "../internals/support/support.socket";
// import {
//   startCryptoRateBroadcasting,
//   stopCryptoRateBroadcasting,
// } from "../internals/crypto";

const server = http.createServer(app);

const startApp = async () => {
  try {
    await prisma.$connect();
    logger.info(`\x1b[32mDB:\x1b[0m SQL Connected`);

    // initializeFirebase();

    // initializeSocketIO(server);
    // logger.info("Socket.IO initialized for real-time chat");

    // Initialize support chat Socket.IO events
    // initializeSupportSocket();
    logger.info('Support chat events initialized');

    // Initialize crypto rates broadcasting
    // startCryptoRateBroadcasting();

    startProductSyncJob();
    startAllNotificationJobs();
    // startPriceAlertMonitoring();
    startGiftcardCodePolling();
    logger.info('Scheduled jobs initialized');

    // Start RabbitMQ Worker
    try {
      await initPublisher();
      logger.info('RabbitMQ connection verified');
      await startWorker();
      logger.info('Worker started');
    } catch (err: any) {
      logger.error(`\x1b[31mWorker Error:\x1b[0m ${err.message}`);
      if (config.env !== 'production') {
        console.error(err.stack);
      }
      if (config.env === 'production') process.exit(1);
    }

    // startReversalJob();

    // startOutwardsReversalJob();

    server.listen(config.port || '0.0.0.0', () => {
      logger.info(
        `\x1b[36mServer:\x1b[0m Running on http://localhost:${config.port}`,
      );
    });
  } catch (error: any) {
    logger.error(
      `\x1b[31mError:\x1b[0m Failed to start server: ${error.message}`,
    );
    if (config.env !== 'production') {
      console.error(error.stack);
    }
    process.exit(1);
  }
};

const gracefulShutdown = async () => {
  logger.info(`\x1b[33mServer:\x1b[0m Shutting down...`);
  try {
    await closePublisher();
    logger.info(`\x1b[31mRabbitMQ:\x1b[0m Publisher closed`);

    // stopReversalJob();
    // stopOutwardsReversalJob();
    // stopCryptoRateBroadcasting();
    // logger.info(`\x1b[31mscheduler:\x1b[0m Scheduler closed`);

    await prisma.$disconnect();
    logger.info(`\x1b[32mDB:\x1b[0m Disconnected`);

    server.close(() => {
      logger.info(`\x1b[33mServer:\x1b[0m Closed remaining connections`);
      process.exit(0);
    });

    setTimeout(() => {
      logger.warn(`\x1b[31mServer:\x1b[0m Force exiting after timeout`);
      process.exit(1);
    }, 5000);
  } catch (error: any) {
    logger.error(`\x1b[31mShutdown Error:\x1b[0m ${error.message}`);
    process.exit(1);
  }
};

process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);

process.on('unhandledRejection', (reason: unknown) => {
  if (reason instanceof Error) {
    logger.error('\x1b[31mUnhandled Rejection:\x1b[0m');
    if (config.env !== 'production') {
      console.error(reason.stack);
    }
  } else {
    logger.error('\x1b[31mUnhandled Rejection:\x1b[0m');
  }

  if (config.env === 'production') {
    process.exit(1);
  }
});

process.on('uncaughtException', (error: Error) => {
  logger.error('\x1b[31mUncaught Exception:\x1b[0m');
  if (config.env !== 'production') {
    console.error(error.stack);
  }
  if (config.env === 'production') {
    process.exit(1);
  }
});

startApp();
