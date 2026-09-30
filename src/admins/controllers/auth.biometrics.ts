import { adminAuthValidation } from "../validations/auth.validation";
import { Asyncly } from "@/shared/extensions/asyncly";
import { BadRequestException, ForbiddenException, NotFoundException } from "@/shared/exceptions/exceptions";
import { prisma } from "@/shared/db/prisma";
import { httpStatus } from "@/shared/exceptions/statusCodes";
import { redis } from "@/shared/common/redis";
import { AuthTokens } from "@/shared/guards/hash";
import { logger } from "@/lib/winston";
import { TokenService } from "@/shared/guards/tokens";
import { config } from "@/shared/config/config";

const enableBiometric = Asyncly(async (req, res) => {
  const adminId = req.currentAdmin?.id;
  const data = adminAuthValidation.enableBiometric.parse(req.body);

  if (!data.publicKey) {
    throw new BadRequestException("Missing public key");
  }
  const admin = await prisma.admin.findUnique({
    where: { id: adminId },
  });

  if (!admin) {
    throw new NotFoundException("Admin not found");
  }

  await prisma.admin.update({
    where: { id: adminId },
    data: {
      biometricPublicKey: data.publicKey,
      isBiometricEnabled: true,
    },
  });

  res.status(httpStatus.OK).json({
    message: "Biometrics enabled",
  });
});

const disableBiometrics = Asyncly(async (req, res) => {
  const adminId = req.currentAdmin?.id;

  await prisma.admin.update({
    where: { id: adminId },
    data: {
      isBiometricEnabled: false,
      biometricPublicKey: null,
    },
  });
  res.status(httpStatus.OK).json({
    message: "Biometric authentication disabled",
  });
});

const reAuthenticateAdmin = Asyncly(async (req, res) => {
  const data = adminAuthValidation.reAuthenticateSchema.parse(req.body);
  const { email, authMethod, password, publicKey } = data;

  const admin = await prisma.admin.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      name: true,
      password: true,
      isActive: true,
      isSuper: true,
      isAdmin: true,
      isBiometricEnabled: true,
      biometricPublicKey: true,
    },
  });

  if (!admin) {
    throw new NotFoundException("Admin not found");
  }

  if (!admin.isActive) {
    throw new ForbiddenException(
      "This administrator account is currently deactivated. Please contact system support.",
    );
  }

  if (authMethod === "password") {
    if (!password) {
      throw new BadRequestException("Password is required");
    }

    const isPasswordValid = await AuthTokens.comparePassword(
      password,
      admin.password,
    );

    if (!isPasswordValid) {
      const attemptKey = `admin_reauth_attempts:${admin.id}`;
      const currentAttempts = await redis.get(attemptKey);
      const attempts = currentAttempts ? parseInt(currentAttempts) + 1 : 1;
      const maxAttempts = 5;

      if (attempts >= maxAttempts) {
        await prisma.admin.update({
          where: { id: admin.id },
          data: { isActive: false },
        });

        await redis.del(attemptKey);

        logger.warn(
          `Admin account deactivated for ${admin.id} after ${maxAttempts} failed password attempts during re-authentication`,
        );

        throw new ForbiddenException(
          "Incorrect credentials. Your admin account has been deactivated for security reasons. Please contact super admin to reactivate.",
        );
      }

      await redis.setex(attemptKey, 900, attempts.toString());
      const remainingAttempts = maxAttempts - attempts;
      logger.warn(
        `Failed password attempt ${attempts}/${maxAttempts} for admin ${admin.id} during re-authentication`,
      );

      throw new BadRequestException(
        `Incorrect details. ${remainingAttempts} attempts left. You will be locked out after 5 failed attempts.`,
      );
    }

    await redis.del(`admin_reauth_attempts:${admin.id}`);
    logger.info(`Password verified successfully for admin ${admin.id}`);
  } else if (authMethod === "biometric") {
    if (!publicKey) {
      throw new BadRequestException("Public key is required");
    }

    if (!admin.isBiometricEnabled || !admin.biometricPublicKey) {
      throw new BadRequestException("Biometric authentication not enabled for this admin");
    }

    if (publicKey !== admin.biometricPublicKey) {
      throw new BadRequestException("Could not verify biometric");
    }

    logger.info(`Biometric verified successfully for admin ${admin.id}`);
  }

  logger.info(`Re-authentication successful for admin ${admin.id} via ${authMethod}`);

  const tokenPayload: AuthAdmin = {
    id: admin.id,
    email: admin.email,
    name: `${admin.name}`,
  };

  const accessToken = TokenService.generateAdminToken(tokenPayload);
  const refreshToken = TokenService.generateAdminRefreshToken(tokenPayload);

  const isProduction = config.env === "production";

  res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "none" : "lax",
      path: "/",
      maxAge: config.jwt.accessTokenExpires * 24 * 60 * 60 * 1000,
  });

  res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "none" : "lax",
      path: "/",
      maxAge: config.jwt.refreshTokenExpires * 24 * 60 * 60 * 1000,
  });

  res.status(httpStatus.OK).json({
    message: "Re-authentication successful",
    admin: {
      id: admin.id,
      email: admin.email,
      name: admin.name,
      isSuper: admin.isSuper,
      isAdmin: admin.isAdmin,
      isBiometricEnabled: admin.isBiometricEnabled,
    },
    accessToken,
    refreshToken
  });
});

export const adminAuthBiometrics = {
  enableBiometric,
  disableBiometrics,
  reAuthenticateAdmin,
};
