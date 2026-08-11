

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
import v2router from "./routes/v2/routes";
import { cryptoWalletController } from "./internals/crypto/crypto.controller";
import { profileController } from "./internals/profile/profile.controller";
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
      // "http://localhost:6001",
      // "http://localhost:5000",
      // "https://your-mobile-app.com",
      // "capacitor://localhost",
      // "ionic://localhost",
      "http://localhost",
      "http://localhost:5001",
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
  if (req.path.startsWith("/webhook/") || req.path.includes("/monnify/webhook")) return next();

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
app.post("/obi", cryptoWalletController.webhookHandler);

// 3. Didit Webhook Handler
app.post("/didit", profileController.handleDiditWebhook);

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
