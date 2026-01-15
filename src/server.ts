import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import compression from 'compression';
import helmet from 'helmet';
import morgan from 'morgan';
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
// import { startScanner } from './crypto/service/deposit-scanner.service';

const app = express();
app.use(morgan('dev'));

const corsOptions: CorsOptions = {
  origin(origin, callback) {
    if (
      config.NODE_ENV === 'development' ||
      !config ||
      config.WHITELISTED_ORIGINS.includes(origin!)
    ) {
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

(async () => {
  await connectToDatabase();
  app.use('/uploads', express.static('uploads'));
  app.use('/api/v1', v1Routes);

  // global error handler
  app.use(globalErrorHandler);

  try {
    app.listen(config.PORT, () => {
      logger.info(`Server is running on http://localhost:${config.PORT}`);
    });
    // startScanner('ethereum');
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
