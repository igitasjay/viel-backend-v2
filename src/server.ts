// // import 'module-alias/register';
// import express from 'express';
// import cors from 'cors';
// import cookieParser from 'cookie-parser';
// import compression from 'compression';
// import helmet from 'helmet';
// import morgan from 'morgan';
// import axios from 'axios';

// // custom module import
// import limiter from '@/lib/express_rate_limit';
// import config from '@/config/config';
// import { connectToDatabase, disconnectFromDatabase } from '@/lib/mongoose';
// import { logger } from '@/lib/winston';

// // routes
// import v1Routes from '@/routes/v1/routes';
// import cryptoV2Routes from '@/crypto-v2/routes/crypto-v2.routes';
// import { globalErrorHandler } from '@/middlewares/error.middleware';

// // types
// import type { CorsOptions } from 'cors';
// import authenticate from './middlewares/authenticate.middleware';
// import router from './routes/v1/health.route';
// import v2router from './routes/v1/routes.v2';

// // import { startWatcher } from './crypto-infra/workers/evm-watcher';

// const app = express();
// app.set('trust proxy', 1);
// app.use(morgan('dev'));

// const corsOptions: CorsOptions = {
//   origin(origin, callback) {
//     if (!origin || config.WHITELISTED_ORIGINS.includes(origin)) {
//       callback(null, true);
//     } else {
//       callback(
//         new Error(`CORS error: ${origin} is not allowed by CORS.`),
//         false,
//       );
//       logger.warn(`CORS error: ${origin} is not allowed by CORS.`);
//     }
//   },
// };

// // apply cors middleware
// app.use(cors(corsOptions));

// app.use(express.json({
//   verify: (req: any, res, buf) => {
//     req.rawBody = buf;
//   }
// }));
// app.use(express.urlencoded({ extended: true }));

// app.use(cookieParser());
// app.use(
//   compression({
//     threshold: 1024,
//   }),
// );

// app.use(helmet());

// app.use(limiter);

// const startHealthCheck = () => {
//   const url = `${config.SERVER_URL}/api/v1/health`;
//   setInterval(async () => {
//     try {
//       const response = await axios.get(url);
//       logger.info(
//         `Autonomous health check: ${response.data.status} - ${response.data.database}`,
//       );
//     } catch (error: any) {
//       logger.error('Autonomous health check failed:', error.message);
//     }
//   }, 60000); // 1 minute
// };

// (async () => {
//   await connectToDatabase();
//   app.use('/uploads', authenticate, express.static('uploads'));
//   app.use('/', router);
//   app.use('/api/v2', v2router);
//   app.use('/api/v1', v1Routes);
//   // app.use('/api/v2/crypto', cryptoV2Routes);

//   // global error handler
//   app.use(globalErrorHandler);

//   try {
//     app.listen(config.PORT, () => {
//       logger.info(`Server is running on http://localhost:${config.PORT}`);
//       startHealthCheck();
//     });

//     // startWatcher().catch((err: any) => logger.error('EVM Watcher failed to start:', err));
//   } catch (error) {
//     logger.error('Error starting the server:', error);
//     if (config.NODE_ENV == 'production') {
//       process.exit(1);
//     }
//   }
// })();

// const handleServerShutdown = async () => {
//   try {
//     await disconnectFromDatabase();
//     logger.warn('Shutting down server...');
//     process.exit(0);
//   } catch (error) {
//     logger.error('Error shutting down server', error);
//   }
// };

// process.on('SIGINT', handleServerShutdown);
// process.on('SIGTERM', handleServerShutdown);

//  Core & Third-party Modules
import express, { Request, Response, NextFunction } from "express";
import helmet from "helmet";
// import { setupSwagger } from "./swagger";
import compression from "compression";
// import cookieParser from "cookie-parser";
// import path from 'path';
import hpp from "hpp";
import cors from "cors";
import enforce from "express-sslify";
// import { cryptoWalletController } from "./internals/crypto";
// import { transferController } from "./internals/transfers";

// Config & Middlewares
import { config } from "./shared/config/config";
import { logger } from "./lib/winston";
import {
  errorHandler,
  sanitize,
  authRateLimiter,
  generalRateLimiter,
  requireAuth,
  // requireAdminAuth,
  userVtuRateLimiter,
  userTransferRateLimiter,
  // adminRateLimiter,
  adminLoginRateLimiter,
  // adminCriticalActionRateLimiter,
  // apiKeyMiddleware,
} from '@/shared/middlewares/index';
import { httpStatus } from "./shared/exceptions/statusCodes";

// Routes & Controllers
// import router from "./routes/v1/health.route";
import v2router from "./routes/v1/routes.v2";
import { cryptoWalletController } from "./internals/crypto/crypto.controller";
// import { webhookRoutes } from "./internals/webhooks";

// App Initialization
const app = express();

// ========================
// SECURITY MIDDLEWARE
// ========================
//
//

// 1. Force HTTPS in production
if (config.env === "production") {
  app.use(enforce.HTTPS({ trustProtoHeader: true }));
}

// 2. Security Headers
app.use(
  helmet({
    frameguard: { action: "deny" },
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "trusted.cdn.com"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "trusted.cdn.com"],
        connectSrc: ["'self'"],
        frameSrc: ["'none'"],
      },
    },
    xssFilter: true,
    noSniff: true,
  }),
);
app.disable("x-powered-by");

//  3. Additional Security Headers
app.use((_req: Request, res: Response, next: NextFunction) => {
  res.setHeader("X-XSS-Protection", "1; mode=block");
  res.setHeader("X-Content-Type-Options", "nosniff");
  next();
});

// 4. CORS Configuration
const corsOptions = {
  origin: (
    origin: string | undefined,
    callback: (err: Error | null, allow?: boolean) => void,
  ) => {
    const allowedOrigins = [
      "http://localhost:6001",
      "http://localhost:5000",
      "https://your-mobile-app.com",
      "capacitor://localhost",
      "ionic://localhost",
      "http://localhost",
      "http://localhost:3000",
    ];

    if (
      !origin ||
      allowedOrigins.some(
        (allowedOrigin) =>
          origin === allowedOrigin ||
          origin.startsWith(`${allowedOrigin}/`) ||
          origin.endsWith(`.${allowedOrigin}`),
      )
    ) {
      return callback(null, true);
    }
    callback(new Error("Not allowed"));
  },
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "X-Requested-With",
    "Accept",
    "expo-api-key",
  ],
  exposedHeaders: ["set-cookie"],
  credentials: true,
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));

// 6. Body Parsing & Security
app.use(
  express.json({
    limit: "10kb",
    verify: (req: any, _res, buf) => {
      req.rawBody = buf.toString();
    },
  }),
);
app.use(express.urlencoded({ extended: true, limit: "10kb" }));
app.use(hpp());
app.use(compression());
app.use(sanitize);
app.set("trust proxy", true);
// app.use(cookieParser());

//  7. Content-Type Validation
app.use((req: Request, res: Response, next: NextFunction): void => {
  if (req.path.startsWith("/webhook/")) return next();

  if (["POST", "PUT", "PATCH"].includes(req.method)) {
    const contentType = req.headers["content-type"];
    const hasBody =
      req.headers["content-length"] && req.headers["content-length"] !== "0";
    if (
      hasBody &&
      (!contentType ||
        (!contentType.includes("application/json") &&
          !contentType.includes("multipart/form-data")))
    ) {
      res.status(400).json({
        error: "Content-Type must be application/json or multipart/form-data",
      });
    }
  }

  next();
});

// ========================
//  APPLICATION MIDDLEWARE
// ========================
//

// 1. Logging
// app.use(morganMiddleware);
app.use((req: Request, _res: Response, next: NextFunction) => {
  const logPayload =
    config.env === "development" && ["POST", "PUT"].includes(req.method);
  logger.info(`${req.method} ${req.url}`, {
    ip: req.ip,
    ua: req.headers["user-agent"],
    ...(logPayload && { body: req.body }),
  });
  next();
});

// app.use("/haven", transferController.webhookHandler);

// 2. Obiex Webhook Handler
app.use("/obi", cryptoWalletController.webhookHandler);

//  Swagger Documentation
// setupSwagger(app);

// ========================
// ROUTES
// ========================

//  1. Basic Routes
app.get("/", (_req: Request, res: Response) => {
  res.send("Hello, Welcome to the Viel API!");
});

app.get("/ping", (_req, res) => {
  res.status(200).send("PONG");
});

app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
});

// 2. API Routes

// app.use("/api/v1/webhooks", webhookRoutes);

// Apply auth limiter to login/register endpoints
app.use("/api/v2", v2router);
app.use("/api/v1/auth", authRateLimiter);

// // VTU and Transfer need authentication to track by User ID + IP
// app.use("/api/v1/vtu", requireAuth, userVtuRateLimiter);
// app.use("/api/v1/transfer", requireAuth, userTransferRateLimiter);

// Apply base admin rate limiter and auth to all admin routes
app.use("/api/v1/admin/auth/login", adminLoginRateLimiter);

// Apply general limiter to the rest of the API
app.use("/api/v1", generalRateLimiter);
// app.use("/api/v1/admin", adminRouter);

// ========================
//  ERROR HANDLING
// ========================

// ❌ 1. 404 Handler
app.use((req: Request, res: Response) => {
  res.status(httpStatus.NOT_FOUND).json({
    message: `Can't find ${req.originalUrl} on this server!`,
  });
});

// 2. Global Error Handler
app.use(errorHandler);

export default app;
