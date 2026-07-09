import { OtpAction } from "@prisma/client";
import {
  BadRequestException,
  NotFoundException,
  UnauthorizedException,
  ForbiddenException,
  TooManyRequestsException,
  ConflictException,
} from "@shared/exceptions/exceptions";
import { Asyncly } from "@shared/extensions/asyncly";
import { prisma } from "@shared/db/prisma";
import { accountValidation } from "./account.validation";
import { Request, Response } from "express";
import { TokenService } from "@shared/guards/tokens";
import { AuthTokens } from "@shared/guards/hash";
import { httpStatus } from "@/shared/exceptions/statusCodes";
import * as DTO from "./account.dto";
import { publishToQueue } from "@shared/workers/publisher";
import { logger } from "@/lib/winston"
import {
  PIN_MAX_ATTEMPTS,
  PIN_LOCK_DURATION,
  PASSWORD_MAX_ATTEMPTS,
  MAX_OTP_RETRIES,
  OTP_LOCKOUT_DURATION,
  OTP_RESEND_COOLDOWN,
} from "./constants";

const setAccountPin = Asyncly(async (req: Request, res: Response) => {
  const userId = req.currentUser?.id;
  const data = accountValidation.SetAccountPinSchema.parse(req.body);

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      fullname: true,
      email: true,
      isActive: true,
      isVerified: true,
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

  if (!user.isVerified) {
    throw new BadRequestException(
      "Please verify your account before setting pin",
    );
  }

  const existingPin = await prisma.userSecurity.findUnique({
    where: {
      userId,
    },
  });

  if (existingPin?.accountPin) {
    throw new BadRequestException(
      "You already have a PIN set for your account.",
    );
  }

  const securePin = await AuthTokens.hashPin(data.accountPin);

  await prisma.userSecurity.update({
    where: { userId },
    data: {
      accountPin: securePin,
      isPinSet: true,
    },
  });
  res.status(httpStatus.CREATED).json({
    message: "Pin set successsfully",
    user: new DTO.AccountPinSetResponseDTO(user, true),
  });
});

const changeAccountPin = Asyncly(async (req: Request, res: Response) => {
  const userId = req.currentUser?.id;
  logger.info(`PIN change request for user ${userId}`);

  const data = accountValidation.ChangeAccountPinSchema.parse(req.body);

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { security: true },
  });

  if (!user) throw new NotFoundException("User not found");
  if (!user.isActive) {
    throw new BadRequestException(
      "Your account has been deactivated due to security concerns. Please contact support for assistance.",
    );
  }
  if (!user.isVerified) throw new ForbiddenException("Account not verified");
  if (!user.security?.accountPin)
    throw new BadRequestException("Account pin not set");

  const passwordAttempts = user.security.passwordAttempts ?? 0;

  logger.info(`Verifying password for user ${userId}`);
  const isPasswordMatch = await AuthTokens.comparePassword(
    data.currentPassword,
    user.password,
  );

  if (!isPasswordMatch) {
    const updatedAttempts = passwordAttempts + 1;
    const isLocked = updatedAttempts >= PASSWORD_MAX_ATTEMPTS;

    await prisma.userSecurity.update({
      where: { userId },
      data: {
        passwordAttempts: updatedAttempts,
        passwordAttemptsResetAt: isLocked ? new Date() : null,
      },
    });

    if (isLocked) {
      logger.info(`Password lockout for user ${userId}`);
      if (req.accessToken) {
        await TokenService.invalidateTokens(userId, req.accessToken);
        logger.info(
          `Tokens invalidated for user ${userId} due to too many password attempts`,
        );
      }

      throw new UnauthorizedException(
        "Too many incorrect password attempts. You have been signed out.",
      );
    }

    const remainingAttempts = PASSWORD_MAX_ATTEMPTS - updatedAttempts;
    throw new BadRequestException(
      `Invalid password. ${remainingAttempts} attempt(s) remaining`,
    );
  }

  logger.info(
    `Password matched for user ${userId}. Resetting password attempts.`,
  );
  await prisma.userSecurity.update({
    where: { userId },
    data: { passwordAttempts: 0, passwordAttemptsResetAt: null },
  });

  const pinAttempts = user.security.oldPinAttempts ?? 0;

  logger.info(`Verifying old PIN for user ${userId}`);
  const isPinMatch = await AuthTokens.comparePin(
    data.oldPin,
    user.security.accountPin,
  );

  if (!isPinMatch) {
    const updatedAttempts = pinAttempts + 1;
    const isLocked = updatedAttempts >= PIN_MAX_ATTEMPTS;

    await prisma.userSecurity.update({
      where: { userId },
      data: {
        oldPinAttempts: updatedAttempts,
        oldPinAttemptsResetAt: isLocked ? new Date() : null,
      },
    });

    if (isLocked) {
      logger.info(`PIN lockout for user ${userId}`);
      if (req.accessToken) {
        await TokenService.invalidateTokens(userId, req.accessToken);
        logger.info(
          `Tokens invalidated for user ${userId} due to too many PIN attempts`,
        );
      }

      throw new UnauthorizedException(
        "Too many incorrect PIN attempts. You have been signed out.",
      );
    }

    const remainingAttempts = PIN_MAX_ATTEMPTS - updatedAttempts;
    throw new BadRequestException(
      `Incorrect PIN. ${remainingAttempts} attempt(s) remaining`,
    );
  }

  logger.info(`Old PIN matched for user ${userId}. Resetting PIN attempts.`);
  await prisma.userSecurity.update({
    where: { userId },
    data: { oldPinAttempts: 0, oldPinAttemptsResetAt: null },
  });

  if (data.oldPin === data.newPin) {
    throw new BadRequestException("New PIN must be different");
  }

  const securePin = await AuthTokens.hashPin(data.newPin);
  await prisma.userSecurity.update({
    where: { userId },
    data: { accountPin: securePin },
  });

  await TokenService.invalidateTokens(user.id, req.accessToken);

  logger.info(`PIN change successful for user ${userId}`);

  res.status(httpStatus.OK).json({
    message: "Transaction PIN updated successfully. Please log in again.",
    user: new DTO.AccountPinChangeResponseDTO(user),
  });
});

const forgotAccountPin = Asyncly(async (req: Request, res: Response) => {
  const userId = req.currentUser?.id;

  if (!userId) {
    throw new UnauthorizedException("User not authenticated");
  }

  const data = accountValidation.ForgotAccountPinSchema.parse(req.body);

  const user = await prisma.user.findUnique({
    where: { email: data.email },
    select: {
      id: true,
      email: true,
      password: true,
      fullname: true,
      isActive: true,
      isVerified: true,
      security: true,
    },
  });

  if (!user) {
    throw new NotFoundException("User with email not found");
  }

  if (!user.security?.isPinSet) {
    throw new BadRequestException("User does not have a PIN set");
  }

  const otpRetryCount = user.security.retryCount ?? 0;
  const otpLockedUntil = user.security.lockedUntil;

  if (otpRetryCount >= PIN_MAX_ATTEMPTS && otpLockedUntil) {
    if (new Date() < new Date(otpLockedUntil)) {
      const remainingTime = Math.ceil(
        (new Date(otpLockedUntil).getTime() - Date.now()) / 60000,
      );
      throw new ForbiddenException(
        `Too many OTP attempts. Try again in ${remainingTime} minute(s).`,
      );
    } else {
      await prisma.userSecurity.update({
        where: { userId },
        data: {
          retryCount: 0,
          lockedUntil: null,
        },
      });
    }
  }

  const passwordAttempts = user.security.passwordAttempts ?? 0;
  logger.info(`Verifying password for user ${userId}`);

  const isPasswordMatch = await AuthTokens.comparePassword(
    data.password,
    user.password,
  );

  if (!isPasswordMatch) {
    const updatedAttempts = passwordAttempts + 1;
    const isLocked = updatedAttempts >= PASSWORD_MAX_ATTEMPTS;

    await prisma.userSecurity.update({
      where: { userId },
      data: {
        passwordAttempts: updatedAttempts,
        passwordAttemptsResetAt: isLocked ? new Date() : undefined,
      },
    });

    if (isLocked) {
      logger.info(`Password lockout for user ${userId}`);

      if (req.accessToken) {
        await TokenService.invalidateTokens(userId, req.accessToken);
        logger.info(
          `Tokens invalidated for user ${userId} due to too many password attempts`,
        );
      }

      throw new UnauthorizedException(
        "Too many incorrect password attempts. You have been signed out.",
      );
    }

    const remainingAttempts = PASSWORD_MAX_ATTEMPTS - updatedAttempts;
    throw new BadRequestException(
      `Invalid password. ${remainingAttempts} attempt(s) remaining`,
    );
  }

  logger.info(
    `Password matched for user ${userId}. Resetting password attempts.`,
  );

  // Send OTP
  await publishToQueue({
    type: "FORGOT_PIN_RESET",
    payload: {
      recipient: user.email,
      fullName: user.fullname,
      userId: user.id,
    },
  });

  const newOtpRetryCount = otpRetryCount + 1;
  const isOtpLocked = newOtpRetryCount >= PIN_MAX_ATTEMPTS;

  await prisma.userSecurity.update({
    where: { userId },
    data: {
      passwordAttempts: 0,
      retryCount: newOtpRetryCount,
      lockedUntil: isOtpLocked
        ? new Date(Date.now() + PIN_LOCK_DURATION)
        : undefined,
    },
  });

  logger.info(`Forgot PIN OTP sent to ${user.email}`);

  res.status(httpStatus.OK).json({
    success: true,
    message: "OTP sent to your email for PIN reset",
    user: new DTO.AccountPinChangeResponseDTO(user),
  });
});

const resendAccountPinOtp = Asyncly(async (req: Request, res: Response) => {
  const userId = req.currentUser?.id;
  const data = accountValidation.ResendPinOtpSchema.parse(req.body);

  if (!userId) {
    throw new NotFoundException("User not found");
  }

  const user = await prisma.user.findUnique({
    where: { email: data.email },
    select: {
      id: true,
      fullname: true,
      email: true,
      security: true,
    },
  });

  if (!user) {
    throw new NotFoundException("User with email not found");
  }

  if (!user.security?.isPinSet) {
    throw new BadRequestException("User does not have a PIN set");
  }
  const currentTime = new Date();

  if (
    user.security.lockedUntil &&
    new Date() < new Date(user.security.lockedUntil)
  ) {
    const remainingTime = Math.ceil(
      (new Date(user.security.lockedUntil).getTime() - Date.now()) / 60000,
    );
    throw new BadRequestException(
      `Please wait ${remainingTime} minute(s) before requesting a new OTP.`,
    );
  }

  if (user.security?.createdAt) {
    const timeSinceLastOtp =
      currentTime.getTime() - user.security.createdAt.getTime();
    if (timeSinceLastOtp < OTP_RESEND_COOLDOWN * 1000) {
      const remainingCooldown =
        OTP_RESEND_COOLDOWN - Math.floor(timeSinceLastOtp / 1000);
      throw new TooManyRequestsException(
        `Please wait ${remainingCooldown} seconds before requesting a new OTP.`,
      );
    }
  }

  if (user.security.retryCount && user.security.retryCount >= MAX_OTP_RETRIES) {
    await prisma.userSecurity.update({
      where: { userId: user.id },
      data: {
        lockedUntil: new Date(Date.now() + OTP_LOCKOUT_DURATION),
        retryCount: 0,
      },
    });
    throw new ForbiddenException(
      "Too many OTP attempts. Please try again later.",
    );
  }

  await publishToQueue({
    type: "FORGOT_PIN_RESET",
    payload: {
      recipient: user.email,
      fullName: user.fullname,
      userId: user.id,
    },
  });

  await prisma.userSecurity.update({
    where: { userId: user.id },
    data: {
      retryCount: { increment: 1 },
      lockedUntil: new Date(Date.now() + OTP_LOCKOUT_DURATION),
    },
  });

  logger.info(`otp resent to ${data.email.substring(0, 3)}****@***.com`);

  res.status(httpStatus.OK).json({
    message: "OTP resent successfully",
    user: new DTO.AccountPinChangeResponseDTO(user),
  });
});

const verifyAccountPinRequest = Asyncly(async (req: Request, res: Response) => {
  logger.info("Verifying user account");
  const userId = req.currentUser.id;
  const data = accountValidation.ResetAccountPinOtpSchema.parse(req.body);
  if (!data.verificationCode) {
    throw new BadRequestException("Verification code is required");
  }

  const user = await prisma.user.findFirst({
    where: { email: data.email },
    include: {
      security: {
        select: {
          code: true,
          action: true,
          createdAt: true,
          expiresAt: true,
        },
      },
    },
  });
  if (!user) {
    throw new NotFoundException("User not found");
  }
  if (!user.security) {
    throw new BadRequestException(
      "No OTP found. Please request a pin reset first.",
    );
  }

  if (user.security.action !== OtpAction.PIN_RESET) {
    logger.warn(
      `Invalid OTP action for user ${user.id}. Expected PIN_RESET, got ${user.security.action}`,
    );
    throw new BadRequestException(
      "Invalid verification code. Please request a pin reset OTP.",
    );
  }

  if (!user.security.code || user.security.code !== data.verificationCode) {
    logger.warn(`Invalid verification code for user ${user.id}`);
    throw new ConflictException("Invalid verification code");
  }

  if (!user.security.createdAt) {
    logger.warn(`Missing OTP timestamp for user ${user.id}`);
    throw new BadRequestException("OTP is missing.");
  }

  if (!user.security.expiresAt || new Date() > user.security.expiresAt) {
    logger.warn(`OTP expired for user ${user.id}`);
    throw new BadRequestException("OTP has expired. Please request a new one.");
  }

  await prisma.userSecurity.update({
    where: { userId },
    data: {
      code: null,
      expiresAt: null,
      lockedUntil: null,
      retryCount: 0,
      accountPin: null,
      isPinSet: false,
      action: null,
      createdAt: new Date(),
    },
  });
  // await TokenService.invalidateTokens(user.id, req.accessToken);

  logger.info(`account pin reset successful for user ${userId}`);
  res.status(httpStatus.OK).json({
    message:
      "Transaction PIN reset successfully. Please log in again to continue.",
    user: new DTO.ForgotPinResponseDTO(user, false),
  });
});

export const accountController = {
  setAccountPin,
  changeAccountPin,
  verifyAccountPinRequest,
  forgotAccountPin,
  resendAccountPinOtp,
};
