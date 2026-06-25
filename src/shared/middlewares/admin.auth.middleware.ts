import { Request, Response, NextFunction } from "express";
import { UnauthorizedException, ForbiddenException } from "@shared/exceptions/exceptions";
import { TokenService } from '@shared/guards/tokens'
import { prisma } from "../db/prisma";
import { logger } from "@/lib/winston";
import { redis } from "@shared/common/redis";
import { TokenExpiredError } from "jsonwebtoken";

export const requireAdminAuth = async (
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const token = req.header("Authorization")?.split(" ")[1];

    if (!token) {
      logger.warn("No token provided for admin authentication");
      throw new UnauthorizedException("Admin token required");
    }

    // ✅ Redis blacklist check (optional, but recommended for logout support)
    const tokenInBlacklist = await redis.get(`bl_access:${token}`);
    if (tokenInBlacklist) {
      logger.warn("Admin token is blacklisted");
      throw new UnauthorizedException("Token revoked");
    }

    let payload;
    try {
      payload = await TokenService.verifyAdminToken(token);
      logger.info(`✅ Valid token for admin ${payload.id}`);
    } catch (err: any) {
      if (err instanceof TokenExpiredError) {
        logger.error("Admin token expired");
        throw new UnauthorizedException("Admin token expired");
      } else {
        throw new UnauthorizedException("Invalid admin token");
      }
    }

    if (!payload?.id) {
      throw new UnauthorizedException("Invalid admin token payload");
    }

    const admin = await prisma.admin.findUnique({
      where: { id: payload.id },
    });

    if (!admin) {
      logger.warn(`Admin not found with ID: ${payload.id}`);
      throw new UnauthorizedException("Admin account not found");
    }
    if (!admin.isActive) {
      logger.warn(`Admin ${admin.email} is not active`);
      throw new UnauthorizedException("Admin account not active");
    }

    req.currentAdmin = {
      id: admin.id,
      email: admin.email,
      name: `${admin.name}`,
      isSuper: admin.isSuper ?? false,
      isAdmin: admin.isAdmin ?? false,
    };

    prisma.admin
      .update({
        where: { id: admin.id },
        data: { lastSeenAt: new Date() },
      })
      .catch((err) => {
        logger.error("Error updating admin lastSeenAt:", err);
      });

    logger.info(
      `✅ Admin authenticated: ${admin.email} | isSuper: ${admin.isSuper ?? false}, isAdmin: ${admin.isAdmin ?? false}`,
    );
    next();
  } catch (error) {
    next(error);
  }
};

export const requireAdmin = async (
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    if (!req.currentAdmin) {
      logger.warn("Admin access attempted without authentication");
      throw new UnauthorizedException("Admin authentication required");
    }

    const { isAdmin, email } = req.currentAdmin;

    if (!isAdmin) {
      logger.warn(`Admin ${email} does not have admin privileges`);
      throw new ForbiddenException("Insufficient admin privileges");
    }

    logger.info(`✅ Admin ${email} with admin privileges authorized`);
    next();
  } catch (error) {
    logger.error("Admin authorization failed");
    next(error);
  }
};

export const requireSuperAdmin = async (
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    if (!req.currentAdmin) {
      throw new UnauthorizedException("Authentication required");
    }

    if (!req.currentAdmin.isSuper) {
      logger.warn(
        `Regular admin ${req.currentAdmin.email} attempted super admin access`,
      );
      throw new ForbiddenException("Super admin privileges required");
    }

    logger.info(`✅ Super admin ${req.currentAdmin.email} authorized`);
    next();
  } catch (error) {
    next(error);
  }
};

export default {
  requireAdminAuth,
  requireAdmin,
  requireSuperAdmin,
};
