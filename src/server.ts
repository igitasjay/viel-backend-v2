// import 'module-alias/register';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import compression from 'compression';
import helmet from 'helmet';
import morgan from 'morgan';
import axios from 'axios';

// custom module import
import limiter from '@/lib/express_rate_limit';
import config from '@/config/config';
import { connectToDatabase, disconnectFromDatabase } from '@/lib/mongoose';
import { logger } from '@/lib/winston';

// routes
import v1Routes from '@/routes/v1/routes';
import { globalErrorHandler } from '@/middlewares/error.middleware';

// types
import type { CorsOptions } from 'cors';
import authenticate from './middlewares/authenticate.middleware';
import router from './routes/v1/health.route';

// import { startWatcher } from './crypto-infra/workers/evm-watcher';

const app = express();
app.set('trust proxy', true);
app.use(morgan('dev'));

const corsOptions: CorsOptions = {
  origin(origin, callback) {
    if (!origin || config.WHITELISTED_ORIGINS.includes(origin)) {
      callback(null, true);
    } else {
      callback(
        new Error(`CORS error: ${origin} is not allowed by CORS.`),
        false,
      );
      logger.warn(`CORS error: ${origin} is not allowed by CORS.`);
    }
  },
};

// apply cors middleware
app.use(cors(corsOptions));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(cookieParser());
app.use(
  compression({
    threshold: 1024,
  }),
);

app.use(helmet());

app.use(limiter);

const startHealthCheck = () => {
  const url = `${config.SERVER_URL}/api/v1/health`;
  setInterval(async () => {
    try {
      const response = await axios.get(url);
      logger.info(`Autonomous health check: ${response.data.status} - ${response.data.database}`);
    } catch (error: any) {
      logger.error('Autonomous health check failed:', error.message);
    }
  }, 60000); // 1 minute
};

(async () => {
  await connectToDatabase();
  app.use('/uploads', authenticate, express.static('uploads'));
  app.use('/', router);
  app.use('/api/v1', v1Routes);

  // global error handler
  app.use(globalErrorHandler);

  try {
    app.listen(config.PORT, () => {
      logger.info(`Server is running on http://localhost:${config.PORT}`);
      startHealthCheck();
    });

    // startWatcher().catch((err: any) => logger.error('EVM Watcher failed to start:', err));
  } catch (error) {
    logger.error('Error starting the server:', error);
    if (config.NODE_ENV == 'production') {
      process.exit(1);
    }
  }
})();

const handleServerShutdown = async () => {
  try {
    await disconnectFromDatabase();
    logger.warn('Shutting down server...');
    process.exit(0);
  } catch (error) {
    logger.error('Error shutting down server', error);
  }
};

process.on('SIGINT', handleServerShutdown);
process.on('SIGTERM', handleServerShutdown);
