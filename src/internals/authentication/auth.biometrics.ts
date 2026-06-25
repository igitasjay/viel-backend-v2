

import { authValidation } from "./auth.validation";
import { ReAuthResponseDTO } from "./auth.dto";
import { Asyncly } from "@/shared/extensions/asyncly";
import { BadRequestException, ForbiddenException, NotFoundException } from "@/shared/exceptions/exceptions";
import { prisma } from "@/shared/db/prisma";
import { httpStatus } from "@/shared/exceptions/statusCodes";
import { redis } from "@/shared/common/redis";
import { AuthTokens } from "@/shared/guards/hash";
import { logger } from "@/lib/winston";

const enableBiometric = Asyncly(async (req, res) => {
  const userId = req.currentUser?.id;
  const data = authValidation.enableBiometric.parse(req.body);

  if (!data.publicKey) {
    throw new BadRequestException("Missing public key");
  }
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new NotFoundException("User not found");
  }

  await prisma.user.update({
    where: { id: userId },
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
  const userId = req.currentUser?.id;

  await prisma.user.update({
    where: { id: userId },
    data: {
      isBiometricEnabled: false,
      biometricPublicKey: null,
    },
  });
  res.status(httpStatus.OK).json({
    message: "Biometric authentication disabled",
  });
});

const reAuthenticateUser = Asyncly(async (req, res) => {
  const data = authValidation.reAuthenticateSchema.parse(req.body);
  const { email, authMethod, password, publicKey } = data;

  // Fetch user by email
  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      fullname: true,
      // username: true,
      phone: true,
      password: true,
      isActive: true,
      isVerified: true,
      isBiometricEnabled: true,
      biometricPublicKey: true,
    },
  });

  if (!user) {
    throw new NotFoundException("User not found");
  }

  if (!user.isActive) {
    throw new ForbiddenException(
      "Your account has been deactivated due to security concerns. Please contact support for assistance.",
    );
  }

  // Verify user identity based on authMethod
  if (authMethod === "password") {
    if (!password) {
      throw new BadRequestException("Password is required");
    }

    // Verify password
    const isPasswordValid = await AuthTokens.comparePassword(
      password,
      user.password,
    );

    if (!isPasswordValid) {
      const attemptKey = `reauth_attempts:${user.id}`;
      const currentAttempts = await redis.get(attemptKey);
      const attempts = currentAttempts ? parseInt(currentAttempts) + 1 : 1;
      const maxAttempts = 5;

      if (attempts >= maxAttempts) {
        await prisma.user.update({
          where: { id: user.id },
          data: { isActive: false },
        });

        // Clear attempts from Redis
        await redis.del(attemptKey);

        logger.warn(
          `Account deactivated for user ${user.id} after ${maxAttempts} failed password attempts during re-authentication`,
        );

        throw new ForbiddenException(
          "Incorrect credentials. Your account has been deactivated for security reasons. Please contact support to reactivate your account.",
        );
      }

      // Update attempts in Redis with 15-minute expiry
      await redis.setex(attemptKey, 900, attempts.toString());

      const remainingAttempts = maxAttempts - attempts;
      logger.warn(
        `Failed password attempt ${attempts}/${maxAttempts} for user ${user.id} during re-authentication`,
      );

      throw new BadRequestException(
        `Incorrect details. ${remainingAttempts} attempts left. You will be locked out after 5 failed attempts.`,
      );
    }

    // Clear attempts on successful verification
    await redis.del(`reauth_attempts:${user.id}`);

    logger.info(`Password verified successfully for user ${user.id}`);
  } else if (authMethod === "biometric") {
    if (!publicKey) {
      throw new BadRequestException("Public key is required");
    }

    if (!user.isBiometricEnabled || !user.biometricPublicKey) {
      throw new BadRequestException("Biometric authentication not enabled");
    }

    // Verify biometric public key matches
    if (publicKey !== user.biometricPublicKey) {
      throw new BadRequestException("could not verify biometric");
    }

    logger.info(`Biometric verified successfully for user ${user.id}`);
  }

  logger.info(
    `Re-authentication successful for user ${user.id} via ${authMethod}`,
  );

  res.status(httpStatus.OK).json({
    message: "Re-authentication successful",
    user: new ReAuthResponseDTO(user),
  });
});

export const authBiometrics = {
  enableBiometric,
  disableBiometrics,
  reAuthenticateUser,
};
