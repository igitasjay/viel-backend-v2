import { Request, Response, NextFunction } from "express";
import { UnauthorizedException } from "@shared/exceptions/exceptions";
import { TokenService } from '@shared/guards/tokens'
import { prisma } from "../db/prisma";
import { logger } from "@/lib/winston";
import { redis } from "@shared/common/redis";

export const requireAuth = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const accessToken = req.headers.authorization?.split(" ")[1];

    if (!accessToken) {
      throw new UnauthorizedException("Token required");
    }

    const tokenInBlacklist = await redis.get(`bl_access:${accessToken}`);
    if (tokenInBlacklist) {
      throw new UnauthorizedException("Session expired. Please login again.");
    }

    let payload;
    try {
      payload = TokenService.verifyUserToken(accessToken);
      logger.info(`✅ Valid token for user ${payload.id}`);
    } catch (err: any) {
      if (err.name === "TokenExpiredError") {
        throw new UnauthorizedException("Session Expired");
      } else {
        throw new UnauthorizedException("Invalid token");
      }
    }

    if (!payload?.id) {
      throw new UnauthorizedException("Invalid token payload");
    }

    const user = await prisma.user.findFirst({
      where: {
        id: payload.id,
        deletedAt: null,
      },
    });

    if (!user) {
      throw new UnauthorizedException("User not found");
    }

    if (!user.isActive) {
      throw new UnauthorizedException(
        "Your account has been deactivated due to security concerns. Please contact support for assistance.",
      );
    }

    req.currentUser = {
      id: user.id,
      email: user.email,
      name: `${user.fullname}`,
    };
    req.accessToken = accessToken;

    // Attach device session if device-id header is present
    const deviceId = req.headers["device-id"] as string;
    if (deviceId) {
      try {
        const deviceSession = await prisma.deviceSession.findUnique({
          where: {
            userId_deviceId: {
              userId: user.id,
              deviceId: deviceId,
            },
          },
          select: {
            id: true,
            deviceId: true,
            deviceType: true,
            deviceName: true,
            location: true,
            isTrusted: true,
          },
        });

        if (deviceSession) {
          req.currentDevice = deviceSession;
        }
      } catch (error) {
        logger.warn(`Failed to fetch device session for user ${user.id}`, {
          deviceId,
          error,
        });
      }
    }

    next();
  } catch (error: any) {
    res.status(error.statusCode || 401).json({
      code:
        error.message === "Session Expired"
          ? "Session Expired"
          : "Unauthorized",
      message: error.message,
    });
  }
};
