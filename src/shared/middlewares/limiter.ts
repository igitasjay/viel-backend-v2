import rateLimit, { ipKeyGenerator } from "express-rate-limit";
import { logger } from "@/lib/winston";
import { Request, Response, NextFunction } from "express";
import { TooManyRequestsException } from "../exceptions/exceptions";

/**
 * Extracts device information for rate limiting
 */
function getDeviceInfo(req: Request): {
  key: string;
  userId?: string;
  deviceId?: string;
  ip: string;
  location?: string;
  deviceType?: string;
  deviceName?: string;
  isTrusted?: boolean;
} {
  const user = (req as any).currentUser;
  const device = (req as any).currentDevice;
  // const fingerprint = (req as any).deviceFingerprint;

  const ipResult = ipKeyGenerator(req as any);
  const ip =
    typeof ipResult === "string" ? ipResult : (ipResult as { ip: string }).ip;

  if (user?.id && device?.deviceId) {
    return {
      key: `user-${user.id}-device-${device.deviceId}-ip-${ip}`,
      userId: user.id,
      deviceId: device.deviceId,
      ip,
      location: device.location,
      deviceType: device.deviceType,
      deviceName: device.deviceName,
      isTrusted: device.isTrusted,
    };
  }

  // if (user?.id && fingerprint) {
  //   return {
  //     key: `user-${user.id}-fingerprint-${fingerprint.substring(0, 8)}-ip-${ip}`,
  //     userId: user.id,
  //     ip,
  //   };
  // }

  if (user?.id) {
    return {
      key: `user-${user.id}-ip-${ip}`,
      userId: user.id,
      ip,
    };
  }

  return {
    key: `ip-${ip}`,
    ip,
  };
}

// Track suspicious device activity
const deviceActivityMap = new Map<
  string,
  { lastTimestamp: number; deviceIds: Set<string> }
>();

function detectSuspiciousDeviceActivity(
  userId: string,
  deviceId: string,
): { isSuspicious: boolean; reason?: string } {
  const key = `activity-${userId}`;
  const now = Date.now();
  const DEVICE_SWITCH_THRESHOLD = 10 * 1000;

  if (!deviceActivityMap.has(key)) {
    deviceActivityMap.set(key, {
      lastTimestamp: now,
      deviceIds: new Set([deviceId]),
    });
    return { isSuspicious: false };
  }

  const activity = deviceActivityMap.get(key)!;
  const timeDiff = now - activity.lastTimestamp;

  if (!activity.deviceIds.has(deviceId) && timeDiff < DEVICE_SWITCH_THRESHOLD) {
    logger.warn(`Suspicious device switching detected`, {
      userId,
      newDeviceId: deviceId,
      previousDevices: Array.from(activity.deviceIds),
      timeDiff,
    });
    return {
      isSuspicious: true,
      reason: "Rapid device switching detected",
    };
  }

  activity.deviceIds.add(deviceId);
  activity.lastTimestamp = now;

  if (deviceActivityMap.size > 10000) {
    const oldestKey = Array.from(deviceActivityMap.keys())[0];
    deviceActivityMap.delete(oldestKey);
  }

  return { isSuspicious: false };
}

export const authRateLimiter = rateLimit({
  windowMs: 2 * 60 * 1000,
  max: 50,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => getDeviceInfo(req).key,
  skip: (req) => {
    const {
      ip,
      userId,
      deviceId,
      location,
      deviceType,
      deviceName,
      isTrusted,
    } = getDeviceInfo(req);
    logger.debug(`Auth request`, {
      userId: userId,
      deviceId: deviceId,
      ip,
      location: location,
      deviceType: deviceType,
      deviceName: deviceName,
      isTrusted,
      path: req.path,
    });
    return false;
  },
  handler: (req: Request, _res: Response, next: NextFunction) => {
    const { ip, userId } = getDeviceInfo(req);
    logger.warn(`Auth rate limit hit`, { userId: userId || "unknown", ip });
    next(
      new TooManyRequestsException(
        "Too many login attempts. Please try again later.",
      ),
    );
  },
});

export const generalRateLimiter = rateLimit({
  windowMs: 30 * 60 * 1000,
  max: 500,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => getDeviceInfo(req).key,
  skip: (req) => {
    const {
      ip,
      userId,
      deviceId,
      location,
      deviceType,
      deviceName,
      isTrusted,
    } = getDeviceInfo(req);
    logger.debug(`General request`, {
      userId: userId,
      deviceId: deviceId,
      ip,
      location: location,
      deviceType: deviceType,
      deviceName: deviceName,
      isTrusted,
      path: req.path,
    });
    return false;
  },
  handler: (req: Request, _res: Response, next: NextFunction) => {
    const { ip, userId } = getDeviceInfo(req);
    logger.warn(`General rate limit hit`, { userId: userId || "unknown", ip });
    next(
      new TooManyRequestsException(
        "An unexpected error occurred with this server",
      ),
    );
  },
});

// COMBINED VTU LIMITER - Both user-level and device-level checks
export const userVtuRateLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 50, // Per device: 50/min
  keyGenerator: (req) => {
    const { userId, deviceId, ip } = getDeviceInfo(req);
    // Device-level key for stricter per-device limit
    if (userId && deviceId) {
      return `vtu-device-${userId}-${deviceId}`;
    }
    // Fallback to user-level
    if (userId) {
      return `vtu-user-${userId}`;
    }
    return `vtu-ip-${ip}`;
  },
  skip: (req) => {
    const {
      userId,
      deviceId,
      ip,
      location,
      deviceType,
      deviceName,
      isTrusted,
    } = getDeviceInfo(req);
    logger.debug(`VTU request`, {
      userId: userId,
      deviceId: deviceId,
      ip,
      location: location,
      deviceType: deviceType,
      deviceName: deviceName,
      isTrusted: isTrusted !== undefined ? isTrusted : "unknown",
      path: req.path,
    });
    return false;
  },
  handler: (req, _res, next) => {
    const { ip, userId, deviceId } = getDeviceInfo(req);

    if (userId && deviceId) {
      const suspicion = detectSuspiciousDeviceActivity(userId, deviceId);
      if (suspicion.isSuspicious) {
        logger.error(`VTU rate limit + suspicious activity`, {
          userId,
          deviceId,
          ip,
          reason: suspicion.reason,
        });
      } else {
        logger.warn(`VTU rate limit hit`, { userId, deviceId, ip });
      }
    } else {
      logger.warn(`VTU rate limit hit`, { userId: userId || "unknown", ip });
    }

    next(
      new TooManyRequestsException(
        "An unexpected error occurred with this server",
      ),
    );
  },
});

// COMBINED TRANSFER LIMITER - Both user-level and device-level checks
export const userTransferRateLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 30, // Per device: 20/min
  keyGenerator: (req) => {
    const { userId, deviceId, ip } = getDeviceInfo(req);
    // Device-level key for stricter per-device limit
    if (userId && deviceId) {
      return `transfer-device-${userId}-${deviceId}`;
    }
    // Fallback to user-level
    if (userId) {
      return `transfer-user-${userId}`;
    }
    return `transfer-ip-${ip}`;
  },
  skip: (req) => {
    // Log every request (optional - for debugging)
    const {
      userId,
      deviceId,
      ip,
      location,
      deviceType,
      deviceName,
      isTrusted,
    } = getDeviceInfo(req);
    logger.debug(`Transfer request`, {
      userId: userId,
      deviceId: deviceId,
      ip,
      location: location,
      deviceType: deviceType,
      deviceName: deviceName,
      isTrusted: isTrusted !== undefined ? isTrusted : "unknown",
      path: req.path,
    });
    return false; // Don't skip - apply the limiter
  },
  handler: (req, _res, next) => {
    const { ip, userId, deviceId } = getDeviceInfo(req);

    if (userId && deviceId) {
      const suspicion = detectSuspiciousDeviceActivity(userId, deviceId);
      if (suspicion.isSuspicious) {
        logger.error(`Transfer rate limit + suspicious activity`, {
          userId,
          deviceId,
          ip,
          reason: suspicion.reason,
        });
      } else {
        logger.warn(`Transfer rate limit hit`, { userId, deviceId, ip });
      }
    } else {
      logger.warn(`Transfer rate limit hit`, {
        userId: userId || "unknown",
        ip,
      });
    }

    next(
      new TooManyRequestsException(
        "An unexpected error occurred with this server",
      ),
    );
  },
});

// ADMIN OPERATIONS LIMITER
export const adminRateLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 30,
  keyGenerator: (req) => {
    const admin = (req as any).currentAdmin;
    const ipResult = ipKeyGenerator(req as any);
    const ip =
      typeof ipResult === "string" ? ipResult : (ipResult as { ip: string }).ip;

    if (!admin?.id) {
      logger.warn(`Unauthorized admin access attempt from IP: ${ip}`);
      return `unknown-admin-${ip}`;
    }

    return `admin-${admin.id}-${ip}`;
  },
  skip: (req) => {
    const admin = (req as any).currentAdmin;
    const ipResult = ipKeyGenerator(req as any);
    const ip =
      typeof ipResult === "string" ? ipResult : (ipResult as { ip: string }).ip;
    logger.debug(`Admin request`, {
      adminId: admin?.id || "unknown",
      ip,
      path: req.path,
    });
    return false;
  },
  handler: (req, _res, next) => {
    const adminId = (req as any).currentAdmin?.id;
    logger.warn(`Admin rate limit hit`, { adminId: adminId || "unknown" });
    next(
      new TooManyRequestsException(
        "Admin rate limit exceeded. Please slow down.",
      ),
    );
  },
});

// ADMIN LOGIN RATE LIMITER - Extra Strict
export const adminLoginRateLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 3,
  keyGenerator: (req) => {
    const ipResult = ipKeyGenerator(req as any);
    const ip =
      typeof ipResult === "string" ? ipResult : (ipResult as { ip: string }).ip;
    const userAgent = req.headers["user-agent"] || "unknown";
    return `admin-login-${ip}-${userAgent.substring(0, 20)}`;
  },
  skip: (req) => {
    const ipResult = ipKeyGenerator(req as any);
    const ip =
      typeof ipResult === "string" ? ipResult : (ipResult as { ip: string }).ip;
    logger.debug(`Admin login attempt`, {
      ip,
      userAgent: req.headers["user-agent"],
      path: req.path,
    });
    return false;
  },
  handler: (req, _res, next) => {
    const ipResult = ipKeyGenerator(req as any);
    const ip =
      typeof ipResult === "string" ? ipResult : (ipResult as { ip: string }).ip;
    logger.error(`Admin login rate limit hit`, {
      ip,
      userAgent: req.headers["user-agent"],
    });
    next(
      new TooManyRequestsException(
        "Too many admin login attempts. Please try again in 5 minutes.",
      ),
    );
  },
});

// SENSITIVE ADMIN OPERATIONS - Extreme Strict
export const adminCriticalActionRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  keyGenerator: (req) => {
    const adminId = (req as any).currentAdmin?.id;
    return `admin-critical-${adminId}`;
  },
  skip: (req) => {
    const adminId = (req as any).currentAdmin?.id;
    logger.debug(`Admin critical action`, { adminId, path: req.path });
    return false;
  },
  handler: (req, _res, next) => {
    const adminId = (req as any).currentAdmin?.id;
    logger.error(`Admin critical action rate limit hit`, { adminId });
    next(
      new TooManyRequestsException(
        "Critical action rate limit exceeded. Try again in 1 hour.",
      ),
    );
  },
});
