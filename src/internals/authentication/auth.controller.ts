
import { authValidation } from "./auth.validation";
import {
  RegisterResponseDTO,
  VerifyResponseDTO,
  LoginResponseDTO,
  UserResponseDTO,
  PasswordChangeResponseDTO,
  RefreshTResponseDTO,
} from "./auth.dto";
import { Request, Response } from "express";
import {
  MAX_OTP_RETRIES,
  OTP_LOCKOUT_DURATION,
  OTP_RESEND_COOLDOWN,
  PASSWORD_MAX_ATTEMPTS,
  PASSWORD_LOCK_DURATION,
} from "./constants";
import {
  OtpAction,
  ReferralEarningStatus,
  ReferralEarningType,
} from "@prisma/client";
import { Asyncly } from "@/shared/extensions/asyncly";
import { logger } from "@/lib/winston";
import { prisma } from "@/shared/db/prisma";
import { BadRequestException, ConflictException, ForbiddenException, NotFoundException, TooManyRequestsException } from "@/shared/exceptions/exceptions";
import { AuthTokens } from "@/shared/guards/hash";
import { generateAccountID } from "@/shared/helpers/accountid";
import { generateReferralCode } from "@/shared/helpers/referral-code";
import { httpStatus } from "@/shared/exceptions/statusCodes";
import * as mailer from '@/externals/mailers/repo'
import { TokenService } from "@/shared/guards/tokens";
import { redis } from "@/shared/common/redis";
import { config } from "@/shared/config/config";
import { RewardsType } from "@/shared/types/enums";
import { publishToQueue } from "@/shared/workers/publisher";
import { DeviceSessionService } from "../devices/device.service";


const registerUser = Asyncly(async (req, res) => {
  logger.info("Registering user");
  const data = authValidation.registerAccountSchema.parse(req.body);

  const existingByEmail = await prisma.user.findUnique({
    where: { email: data.email },
    select: { id: true, isVerified: true, deletedAt: true },
  });

  if (existingByEmail) {
    if (existingByEmail.deletedAt) {
      throw new BadRequestException(
        "This email is no longer available for registration",
      );
    }

    if (!existingByEmail.isVerified) {
      throw new ConflictException(
        "Account not verified, kindly login to verify",
      );
    }

    throw new BadRequestException("Email already exists");
  }

  const hashedPassword = await AuthTokens.hashPassword(data.password);
  logger.info("Password hashed successfully");

  const referralCode = generateReferralCode();

  let referrer: { id: string } | null = null;
  if (data.referralCode) {
    logger.info(`Checking referralCode ${data.referralCode}...`);
    referrer = await prisma.user.findUnique({
      where: { referralCode: data.referralCode },
      select: { id: true },
    });

    if (referrer) {
      logger.info(`Referral code valid. Referrer: ${referrer.id}`);
    } else {
      logger.error(`Invalid referral code: ${data.referralCode}`);
    }
  }

  // const barcodeUrl = await generateQRCode(data.username);
  const accountID = generateAccountID();

  const { user } = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        fullname: data.fullName,
        // phone: data.phoneNumber,
        email: data.email,
        // username: data.username,
        password: hashedPassword,
        obiExAccountId: accountID,
        // referralSource: data.referralSource,
        // barcodeUrl,
        isActive: true,
        isVerified: false,
        referralCode,
        referredById: referrer?.id,
      },
    });

    // const wallets = await tx.wallet.create({
    //   data: {
    //     userId: user.id,
    //     currency: "NGN",
    //     depositBalance: 0,
    //     referralBalance: 0,
    //     cashBackBalance: 0,
    //   },
    // });
    // logger.info(`Wallet created for user ${user.id}: ${wallets.id}`);
    return { user };
  });

  await publishToQueue({
    type: "VERIFY_ACCOUNT",
    payload: {
      recipient: data.email,
      fullName: user.fullname,
      userId: user.id,
    },
  });

  res.status(httpStatus.CREATED).json({
    message:
      "User registered successfully. Please verify your account with the OTP sent to your mail.",
    user: new RegisterResponseDTO(user),
  });
});

const verifyAccount = Asyncly(async (req: Request, res: Response) => {
  logger.info("Verifying user account");

  const data = authValidation.verifyAccountSchema.parse(req.body);

  if (!data.verificationCode) {
    throw new BadRequestException("Verification code is required");
  }

  const user = await prisma.user.findFirst({
    where: { email: data.email },
    select: {
      id: true,
      email: true,
      fullname: true,
      // phone: true,
      // username: true,
      isBiometricEnabled: true,
      isTwoFactorEnabled: true,
      isActive: true,
      isVerified: true,
      profilePicture: true,
      referredById: true,

      security: {
        select: {
          code: true,
          action: true,
          createdAt: true,
          expiresAt: true,
          lockedUntil: true,
          retryCount: true,
          isPinSet: true,
        },
      },
    },
  });

  if (!user) {
    logger.warn(`User not found for email: ${data.email}`);
    throw new NotFoundException("User not found");
  }

  if (user.isVerified) {
    logger.warn(`User ${user.id} is already verified`);
    throw new ForbiddenException("User already verified");
  }

  if (!user.security) {
    logger.warn(`No security record found for user ${user.id}`);
    throw new BadRequestException(
      "No verification code found. Please request a new one.",
    );
  }

  logger.info("OTP verification attempt");

  if (user.security.action !== OtpAction.VERIFY_ACCOUNT) {
    logger.warn(
      `Invalid OTP action for user ${user.id}. Expected VERIFY_ACCOUNT, got ${user.security.action}`,
    );
    throw new BadRequestException(
      "Invalid verification code. Please request a new account verification code.",
    );
  }

  if (!user.security.code || user.security.code !== data.verificationCode) {
    logger.warn(`❌ Invalid verification code for user ${user.id}`);
    throw new ConflictException("Invalid verification code");
  }

  if (!user.security.createdAt || !user.security.expiresAt) {
    logger.warn(`OTP timestamp missing for user ${user.id}`);
    throw new BadRequestException("OTP metadata is incomplete.");
  }

  if (new Date() > user.security.expiresAt) {
    logger.warn(`OTP expired for user ${user.id}`);
    throw new BadRequestException("OTP has expired");
  }

  (await prisma.user.update({
    where: { id: user.id },
    data: {
      isVerified: true,
    },
  }),
    await mailer.clearOtp(user.id, OtpAction.VERIFY_ACCOUNT));

  const deviceId = req.headers["device-id"] as string;
  if (deviceId) {
    await DeviceSessionService.registerInitialDevice({
      userId: user.id,
      headers: req.headers,
      ipAddress: req.ip!,
    });
  }

  const tokenPayload: AuthUser = {
    id: user.id,
    email: user.email,
    name: `${user.fullname}`,
  };

  const accessToken = TokenService.generateUserToken(tokenPayload);
  const refreshToken = TokenService.generateUserRefreshToken(tokenPayload);

  await redis.set(
    `refresh:${user.id}`,
    refreshToken,
    "EX",
    config.jwt.refreshTokenExpires * 24 * 60 * 60,
  );

  logger.info(`User verified successfully with ID: ${user.id}`);

  if (user.referredById) {
    try {
      // Create pending referral earning
      await prisma.referralEarning.create({
        data: {
          userId: user.referredById,
          referredUserId: user.id,
          earningType: ReferralEarningType.SIGNUP,
          amount: RewardsType.REFERRAL,
          status: ReferralEarningStatus.PENDING,
        },
      });

      await publishToQueue({
        type: "NOTIFICATION_EVENT",
        payload: {
          userId: user.referredById,
          title: "Referral Verified!",
          message: `${user.fullname} just verified their account using your referral code. Your reward will be confirmed after their first trade.`,
          type: "SYSTEM",
          priority: "medium",
          meta: {
            referredUserId: user.id,
            referredUserName: user.fullname,
          },
        },
      });
      logger.info(
        `Referral verification notification and pending earning created for referrer ${user.referredById}`,
      );
    } catch (error) {
      logger.error(`Failed to handle referral for user ${user.id}:`, { error });
    }
  }

  // await sendWelcomeNotification(user.id, user.fullname);
  logger.info(
    `Welcome notification queued for newly registered and verified user ${user.id}`,
  );

  res.status(httpStatus.OK).json({
    message: "Account Verified Successfully",
    user: new VerifyResponseDTO(user, true, accessToken, refreshToken),
  });
});

const resendOtp = Asyncly(async (req, res) => {
  logger.info("Resending OTP");
  const data = authValidation.resendVerificationCodeSchema.parse(req.body);

  const user = await prisma.user.findUnique({
    where: { email: data.email },
    select: {
      id: true,
      isVerified: true,
      fullname: true,
      email: true,
      security: {
        select: {
          lockedUntil: true,
          retryCount: true,
          createdAt: true,
        },
      },
    },
  });

  if (!user) {
    throw new NotFoundException("User not found");
  }

  if (user.isVerified) {
    throw new ConflictException("User already verified");
  }

  const currentTime = new Date();

  if (user.security?.lockedUntil && currentTime < user.security.lockedUntil) {
    const remainingTime = Math.ceil(
      (user.security.lockedUntil.getTime() - currentTime.getTime()) / 60000,
    );
    throw new BadRequestException(
      `Please wait ${remainingTime} minute(s) before requesting a new OTP.`,
    );
  }

  //Check resend cooldown
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

  const currentRetryCount = user.security?.retryCount ?? 0;
  if (currentRetryCount >= MAX_OTP_RETRIES) {
    // Lock the user out
    if (user.security) {
      await prisma.userSecurity.update({
        where: { userId: user.id },
        data: {
          lockedUntil: new Date(Date.now() + OTP_LOCKOUT_DURATION),
        },
      });
    } else {
      await prisma.userSecurity.create({
        data: {
          userId: user.id,
          retryCount: 0,
          lockedUntil: new Date(Date.now() + OTP_LOCKOUT_DURATION),
          isPinSet: false,
        },
      });
    }

    throw new TooManyRequestsException(
      "Too many OTP attempts. Please try again later.",
    );
  }

  await publishToQueue({
    type: "VERIFY_ACCOUNT",
    payload: {
      recipient: data.email,
      fullName: user.fullname,
      userId: user.id,
    },
  });

  logger.info(`OTP resent to ${data.email.substring(0, 3)}****@***.com`);

  return res.status(httpStatus.OK).json({
    message: "New OTP sent successfully. Please check your email.",
  });
});

const loginUser = Asyncly(async (req, res) => {
  logger.info("Logging in user");

  const data = authValidation.loginAccountSchema.parse(req.body);

  const userCheck = await prisma.user.findUnique({
    where: { email: data.email },
    select: { deletedAt: true },
  });

  if (userCheck?.deletedAt) {
    throw new NotFoundException("User not found");
  }

  const user = await prisma.user.findUnique({
    where: { email: data.email },
    select: {
      id: true,
      email: true,
      fullname: true,
      // username: true,
      password: true,
      isBiometricEnabled: true,
      isTwoFactorEnabled: true,
      isActive: true,
      isVerified: true,
      security: {
        select: { isPinSet: true },
      },
      deviceSessions: {
        select: {
          id: true,
          lastLoginAt: true,
        },
      },
    },
  });

  if (!user) {
    throw new NotFoundException("User not found");
  }

  if (!user.isActive) {
    throw new ForbiddenException("Account is blocked, please contact support");
  }

  if (!user.isVerified) {
    await publishToQueue({
      type: "VERIFY_ACCOUNT",
      payload: {
        recipient: data.email,
        fullname: user.fullname,
        userId: user.id,
      },
    });
    logger.info(`OTP sent to ${user.email}`);

    throw new ForbiddenException(
      "Account not verified, kindly complete verification",
    );
  }

  const isValidPassword = await AuthTokens.comparePassword(
    data.password,
    user.password,
  );

  if (!isValidPassword) {
    throw new ForbiddenException("Invalid email or password");
  }

  // const { isNewDevice } = await DeviceSessionService.handleLoginDevice({
  //   userId: user.id,
  //   email: user.email,
  //   fullname: user.fullname,
  //   headers: req.headers,
  //   ipAddress: req.ip!,
  // });

  // if (isNewDevice) {
  //   throw new ForbiddenException("New device detected. A verification OTP has been sent to your email. Please verify to proceed with login.");
  // }

  const tokenPayload: AuthUser = {
    id: user.id,
    email: user.email,
    name: `${user.fullname}`,
  };

  const getTagLine = await prisma.appSettings.findUnique({
    where: { key: "homepage_tagline" },
  });

  await redis.del(`refresh:${user.id}`);

  const accessToken = TokenService.generateUserToken(tokenPayload);
  const refreshToken = TokenService.generateUserRefreshToken(tokenPayload);

  await redis.set(
    `refresh:${user.id}`,
    refreshToken,
    "EX",
    config.jwt.refreshTokenExpires * 24 * 60 * 60,
  );

  logger.info(`User logged in successfully with ID: ${user.id}`);

  const tagline =
    getTagLine?.appValue && getTagLine.appValue.length > 0
      ? getTagLine.appValue[
      Math.floor(Math.random() * getTagLine.appValue.length)
      ]
      : "Trade smarter, earn faster!";

  res.status(httpStatus.OK).json({
    message: "User logged in successfully",
    user: new LoginResponseDTO(user, accessToken, refreshToken, tagline),
  });
});

const forgotPasswordUser = Asyncly(async (req, res) => {
  const data = authValidation.forgotPasswordSchema.parse(req.body);
  const user = await prisma.user.findUnique({
    where: { email: data.email },
    select: {
      id: true,
      fullname: true,
      email: true,
      security: {
        select: {
          lockedUntil: true,
          expiresAt: true,
          retryCount: true,
          action: true,
        },
      },
    },
  });

  if (!user) {
    throw new NotFoundException("User not found.");
  }

  const currentTime = Date.now();

  // Check if user is locked out
  if (
    user.security?.lockedUntil &&
    currentTime < new Date(user.security.lockedUntil).getTime()
  ) {
    const remainingTime = Math.ceil(
      (new Date(user.security.lockedUntil).getTime() - currentTime) /
      (60 * 1000),
    );
    throw new BadRequestException(
      `Please wait ${remainingTime} minute(s) before requesting a new OTP.`,
    );
  }

  if (
    user.security?.expiresAt &&
    currentTime < new Date(user.security.expiresAt).getTime()
  ) {
    const remainingTime = Math.ceil(
      (new Date(user.security.expiresAt).getTime() - currentTime) / 1000,
    );
    const remainingMinutes = Math.ceil(remainingTime / 60);

    throw new BadRequestException(
      `An active otp already exists. Please wait ${remainingMinutes} minute(s) before requesting a new OTP.`,
    );
  }

  // Check retry count and lock if exceeded
  if ((user.security?.retryCount ?? 0) >= MAX_OTP_RETRIES) {
    await prisma.userSecurity.update({
      where: { userId: user.id },
      data: {
        lockedUntil: new Date(Date.now() + OTP_LOCKOUT_DURATION),
        retryCount: 0,
      },
    });
    throw new TooManyRequestsException(
      "You have exceeded the maximum reset attempts. Please wait 3 minutes before trying again or contact support.",
    );
  }

  await publishToQueue({
    type: "FORGOT_PASSWORD_RESET",
    payload: {
      recipient: data.email,
      fullName: user.fullname,
      userId: user.id,
    },
  });
  logger.info(`Forgot Password OTP sent to ${data.email}`);

  await prisma.userSecurity.update({
    where: { userId: user.id },
    data: {
      retryCount: { increment: 1 },
      lockedUntil: new Date(Date.now() + OTP_LOCKOUT_DURATION),
    },
  });
  res.status(httpStatus.OK).json({
    message:
      "If an account with that email exists, a password reset otp has been sent.",
    user: new UserResponseDTO(user),
  });
});

const resetPasswordUser = Asyncly(async (req, res) => {
  const data = authValidation.resetPasswordSchema.parse(req.body);
  const user = await prisma.user.findUnique({
    where: { email: data.email },
    select: {
      id: true,
      email: true,
      password: true,
      isVerified: true,
      fullname: true,
      security: {
        select: {
          code: true,
          action: true,
          createdAt: true,
          expiresAt: true,
          lockedUntil: true,
          retryCount: true,
          isPinSet: true,
        },
      },
    },
  });

  if (!user) {
    throw new NotFoundException("User not found");
  }

  if (!user.isVerified) {
    throw new ForbiddenException(
      "Please verify your account before resetting password",
    );
  }

  if (!user.security) {
    logger.warn(`No security record found for user ${user.id}`);
    throw new BadRequestException(
      "No verification code found. Please request a new one.",
    );
  }

  logger.info("OTP verification attempt");

  if (user.security.action !== OtpAction.PASSWORD_RESET) {
    logger.warn(
      `Invalid OTP action for user ${user.id}. Expected PASSWORD_RESET, got ${user.security.action}`,
    );
    throw new BadRequestException(
      "Invalid verification code. Please request a new account verification code.",
    );
  }

  if (!user.security.code || user.security.code !== data.verificationCode) {
    logger.warn(`❌ Invalid verification code for user ${user.id}`);
    throw new ConflictException("Invalid verification code");
  }

  if (!user.security.createdAt || !user.security.expiresAt) {
    logger.warn(`OTP timestamp missing for user ${user.id}`);
    throw new BadRequestException("OTP metadata is incomplete.");
  }

  if (new Date() > user.security.expiresAt) {
    logger.warn(`OTP expired for user ${user.id}`);
    throw new BadRequestException("OTP has expired");
  }

  const isSamePassword = await AuthTokens.comparePassword(
    data.newPassword,
    user.password,
  );

  if (isSamePassword) {
    throw new BadRequestException(
      "New password must be different from the old password",
    );
  }

  const hashedPassword = await AuthTokens.hashPassword(data.newPassword);

  await prisma.user.update({
    where: { id: user.id },
    data: { password: hashedPassword },
  });

  await mailer.clearOtp(user.id, OtpAction.PASSWORD_RESET);

  // await redis.del(`refresh:${user.id}`);
  await TokenService.invalidateTokens(user.id);

  logger.info(`Password reset successful for user ID: ${user.id}`);

  res.status(httpStatus.OK).json({
    message:
      "Password reset successful. You can now log in with your new password.",
  });
});

const changePasswordUser = Asyncly(async (req: Request, res: Response) => {
  const userId = req.currentUser?.id;
  const data = authValidation.passwordChangeSchema.parse(req.body);

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { security: true },
  });
  if (!user) throw new NotFoundException("User not found");

  // --- PASSWORD ATTEMPT LOGIC ---
  const attempts = user.security?.passwordAttempts ?? 0;
  const isLockExpired =
    user.security?.passwordAttemptsResetAt &&
    new Date() >
    new Date(
      user.security.passwordAttemptsResetAt.getTime() +
      PASSWORD_LOCK_DURATION,
    );

  if (isLockExpired) {
    await prisma.userSecurity.update({
      where: { userId },
      data: { passwordAttempts: 0, passwordAttemptsResetAt: null },
    });
  }

  if (attempts >= PASSWORD_MAX_ATTEMPTS && !isLockExpired) {
    const remainingTime = Math.ceil(
      (user.security!.passwordAttemptsResetAt!.getTime() +
        PASSWORD_LOCK_DURATION -
        Date.now()) /
      (60 * 1000),
    );
    throw new TooManyRequestsException(
      `Password locked. Try again in ${remainingTime} minute(s)`,
    );
  }

  // --- CHECK CURRENT PASSWORD ---
  const isPasswordValid = await AuthTokens.comparePassword(
    data.currentPassword,
    user.password,
  );

  if (!isPasswordValid) {
    const updatedAttempts = attempts + 1;
    const isLocked = updatedAttempts >= PASSWORD_MAX_ATTEMPTS;

    await prisma.userSecurity.update({
      where: { userId },
      data: {
        passwordAttempts: updatedAttempts,
        passwordAttemptsResetAt: isLocked ? new Date() : null,
      },
    });

    if (isLocked) {
      throw new TooManyRequestsException(
        `Too many incorrect password attempts. Locked for ${PASSWORD_LOCK_DURATION / (60 * 1000)
        } minutes`,
      );
    }

    const remaining = PASSWORD_MAX_ATTEMPTS - updatedAttempts;
    throw new BadRequestException(
      `Invalid current password. ${remaining} attempt(s) remaining`,
    );
  }

  await prisma.userSecurity.update({
    where: { userId },
    data: { passwordAttempts: 0, passwordAttemptsResetAt: null },
  });

  if (data.currentPassword === data.newPassword) {
    throw new BadRequestException(
      "New password cannot be the same as current password",
    );
  }

  const hashedNewPassword = await AuthTokens.hashPassword(data.newPassword);
  await prisma.user.update({
    where: { id: userId },
    data: { password: hashedNewPassword },
  });

  await TokenService.invalidateTokens(user.id, req.accessToken);

  res.status(httpStatus.OK).json({
    message: "Password reset successful. Please log in with your new password.",
    user: new PasswordChangeResponseDTO(user),
  });
});

const logout = Asyncly(async (req, res) => {
  const accessToken = req.header("Authorization")?.split(" ")[1];

  if (!accessToken) {
    throw new BadRequestException("session expired");
  }

  const decoded = TokenService.decodeToken(accessToken);
  const userId = decoded?.payload.id;

  if (!userId) {
    throw new NotFoundException("Invalid");
  }

  const exp = decoded.exp;
  const ttl = exp - Math.floor(Date.now() / 1000);

  await redis.setex(`bl_access:${accessToken}`, ttl, "true");

  await redis.del(`refresh:${userId}`);

  res.status(httpStatus.OK).json({
    success: true,
    message: "Logout successful",
  });
});

const refreshToken = Asyncly(async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    throw new BadRequestException("token is required");
  }

  let userId: string | null = null;
  let isValid = false;

  try {
    const verified = TokenService.verifyUserRefreshToken(refreshToken);
    userId = verified.id;
    isValid = true;
  } catch {
    throw new NotFoundException("session expired");
  }

  if (!isValid || !userId) {
    throw new NotFoundException("session expired");
  }

  const storedToken = await redis.get(`refresh:${userId}`);

  if (!storedToken || storedToken !== refreshToken) {
    throw new NotFoundException("Session expired");
  }

  await redis.del(`refresh:${userId}`);

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new NotFoundException("User not found");
  }

  const tokenPayload: AuthUser = {
    id: user.id,
    email: user.email,
    name: `${user.fullname}`,
  };

  const accessToken = TokenService.generateUserToken(tokenPayload);
  res.status(httpStatus.OK).json({
    message: "token refreshed successfully",
    user: new RefreshTResponseDTO(user, accessToken),
  });
});

// const checkUsername = Asyncly(async (req, res) => {
//   let { username } = req.params;

//   if (!username) {
//     throw new BadRequestException("Username is required");
//   }

//   // Prepend @ if it doesn't already start with it
//   if (!username.startsWith("@")) {
//     username = `@${username}`;
//   }

//   const existingUser = await prisma.user.findUnique({
//     where: { username },
//     select: { id: true },
//   });

//   res.status(httpStatus.OK).json({
//     status: existingUser ? "taken" : "available",
//   });
// });

export const authController = {
  registerUser,
  loginUser,
  // checkUsername,
  changePasswordUser,
  verifyAccount,
  resendOtp,
  forgotPasswordUser,
  resetPasswordUser,
  logout,
  refreshToken,
};

