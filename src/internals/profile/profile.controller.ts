import { Request, Response } from "express";
import { Asyncly } from "@shared/extensions/asyncly";
import { prisma } from "@shared/db/prisma";
import { cloudinary } from "@shared/config/cloudinary"
import { logger } from "@/lib/winston"
import { httpStatus } from "@shared/exceptions/statusCodes";
import { extractPublicIdFromUrl } from "@/utils/cloudinary.utils";
import {
  NotFoundException,
  BadRequestException,
  ConflictException,
  UnauthorizedException,
  InternalServerErrorException,
} from "@shared/exceptions/exceptions";
import { publishToQueue } from "@shared/workers/publisher";
import { ProfileResponseDTO, ProfilePictureResponseDTO } from "./profile.dto";
import { RESPONSE_MESSAGES, PROFILE_PICTURE_CONSTRAINTS } from "./constants";
import bcrypt from "bcrypt";
import { generateQRCode } from "@shared/helpers/qr-code";

const getProfile = Asyncly(async (req: Request, res: Response) => {
  const userId = req.currentUser?.id;
  logger.info(`Fetching basic profile for user ID: ${userId}`);

  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    logger.error(`User not found for ID: ${userId}`);
    throw new NotFoundException("User not found");
  }

  const profileData = new ProfileResponseDTO(user);

  logger.info(`Basic profile retrieved successfully for user ID: ${userId}`);
  res.status(httpStatus.OK).json({
    message: RESPONSE_MESSAGES.PROFILE.FETCHED,
    data: profileData,
  });
});

const updateProfile = Asyncly(async (req: Request, res: Response) => {
  const userId = req.currentUser?.id;
  const updateData = req.body;

  logger.info(`Updating profile for user ID: ${userId}`, { updateData });

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      isVerified: true,
      // hasUpdatedDob: true,
    },
  });

  if (!user) {
    throw new NotFoundException("User not found");
  }

  if (updateData.email && user.isVerified) {
    throw new BadRequestException(
      "Email cannot be changed after account verification",
    );
  }

  // if (updateData.dateOfBirth !== undefined) {
  //   if (user.hasUpdatedDob) {
  //     throw new BadRequestException("Date of Birth cannot be changed again");
  //   }

  //   const [year, month, day] = updateData.dateOfBirth.split("-").map(Number);
  //   updateData.dateOfBirth = new Date(Date.UTC(year, month - 1, day));
  //   updateData.hasUpdatedDob = true;
  // }

  // if (updateData.phone) {
  //   const phoneExists = await prisma.user.findFirst({
  //     where: { phone: updateData.phone, id: { not: userId } },
  //   });

  //   if (phoneExists) {
  //     throw new ConflictException(
  //       "Phone number is already in use by another account",
  //     );
  //   }
  // }

  // if (updateData.username) {
  //   const usernameExists = await prisma.user.findFirst({
  //     where: { username: updateData.username, id: { not: userId } },
  //   });

  //   if (usernameExists) {
  //     throw new ConflictException("Username is already taken");
  //   }
  // }

  const updateFields: any = {
    updatedAt: new Date(),
  };

  if (updateData.fullName) updateFields.fullname = updateData.fullName;
  // if (updateData.phone) updateFields.phone = updateData.phone;
  if (updateData.email) updateFields.email = updateData.email;
  // if (updateData.username) {
  //   updateFields.username = updateData.username;
  //   updateFields.barcodeUrl = await generateQRCode(updateData.username);
  // }
  // if (updateData.dateOfBirth !== undefined)
  //   updateFields.dateOfBirth = updateData.dateOfBirth;
  // if (updateData.hasUpdatedDob) updateFields.hasUpdatedDob = true;

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: updateFields,
  });

  const updatedFieldNames = Object.keys(updateFields);

  logger.info(`Profile updated successfully for user ID: ${userId}`, {
    updatedFields: updatedFieldNames,
  });

  const responseData = new ProfileResponseDTO(updatedUser);

  res.status(httpStatus.OK).json({
    message: RESPONSE_MESSAGES.PROFILE.UPDATED,
    data: responseData,
    updatedFields: updatedFieldNames,
    updated: !!updateFields.hasUpdatedDob,
  });

  setImmediate(async () => {
    try {
      await publishToQueue({
        type: "NOTIFICATION_EVENT",
        payload: {
          userId: userId!,
          notificationType: "SYSTEM",
          priority: "high",
          title: "Profile Updated",
          message: `Your profile has been updated successfully. Updated: ${updatedFieldNames.join(
            ", ",
          )}`,
          metadata: {
            updatedFields: updatedFieldNames,
            action: "profile_update",
          },
          deliveryChannels: ["in_app", "push"],
        },
      });
      logger.info("Notification queued for profile update", { userId });
    } catch (error) {
      logger.error("Failed to queue profile update notification:", { error });
    }
  });
});

const uploadProfilePicture = Asyncly(async (req: Request, res: Response) => {
  const userId = req.currentUser?.id;
  logger.info(`Uploading profile picture for user ID: ${userId}`);

  if (!req.file) {
    throw new BadRequestException(RESPONSE_MESSAGES.PROFILE.NO_FILE_PROVIDED);
  }

  if (!PROFILE_PICTURE_CONSTRAINTS.ALLOWED_TYPES.includes(req.file.mimetype)) {
    throw new BadRequestException(RESPONSE_MESSAGES.PROFILE.INVALID_FILE_TYPE);
  }

  if (req.file.size > PROFILE_PICTURE_CONSTRAINTS.MAX_SIZE) {
    throw new BadRequestException(RESPONSE_MESSAGES.PROFILE.FILE_TOO_LARGE);
  }

  const currentUser = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      profilePicture: true,
    },
  });

  if (!currentUser) {
    logger.error(`User not found for ID: ${userId}`);
    throw new NotFoundException("User not found");
  }

  // Upload to Cloudinary
  const uploadResult = await new Promise<any>((resolve, reject) => {
    cloudinary.uploader
      .upload_stream(
        {
          resource_type: "image",
          folder: "trade-aviator/profile-pictures",
          transformation: [
            {
              width: 400,
              height: 400,
              crop: "auto",
              gravity: "faces",
              zoom: 0.75,
            },
            { quality: "auto:good" },
            { format: "jpg" },
          ],
          public_id: `profile_${userId}_${Date.now()}`,
          overwrite: true,
        },
        (error, result) => {
          if (error) {
            logger.error(`Cloudinary upload error for user ${userId}:`, error);
            reject(
              new InternalServerErrorException(
                RESPONSE_MESSAGES.PROFILE.PICTURE_UPLOAD_FAILED,
              ),
            );
          } else {
            resolve(result);
          }
        },
      )
      .end(req.file!.buffer);
  });

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      profilePicture: uploadResult.secure_url,
      updatedAt: new Date(),
    },
  });

  if (
    currentUser.profilePicture &&
    currentUser.profilePicture.includes("cloudinary.com")
  ) {
    const oldPublicId = extractPublicIdFromUrl(currentUser.profilePicture);

    if (oldPublicId) {
      cloudinary.uploader
        .destroy(oldPublicId)
        .then(() => logger.info(`Deleted old profile picture: ${oldPublicId}`))
        .catch((error) =>
          logger.error(
            `Failed to delete old profile picture: ${oldPublicId}`,
            error,
          ),
        );
    } else {
      logger.warn(
        `Could not extract publicId from URL: ${currentUser.profilePicture}`,
      );
    }
  }

  logger.info(`Profile picture uploaded successfully for user ID: ${userId}`);

  const responseData = new ProfilePictureResponseDTO({
    id: updatedUser.id,
    profilePicture: updatedUser.profilePicture,
    cloudinaryId: uploadResult.public_id,
    uploadedAt: new Date(),
  });

  res.status(httpStatus.OK).json({
    message: RESPONSE_MESSAGES.PROFILE.PICTURE_UPLOADED,
    data: responseData,
  });
});

const removeProfilePicture = Asyncly(async (req: Request, res: Response) => {
  const userId = req.currentUser?.id;
  logger.info(`Removing profile picture for user ID: ${userId}`);

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      profilePicture: true,
    },
  });

  if (!user) {
    logger.error(`User not found for ID: ${userId}`);
    throw new NotFoundException("User not found");
  }

  if (!user.profilePicture) {
    throw new BadRequestException(
      RESPONSE_MESSAGES.PROFILE.NO_PICTURE_TO_REMOVE,
    );
  }

  if (user.profilePicture.includes("cloudinary.com")) {
    const publicId = extractPublicIdFromUrl(user.profilePicture);

    if (publicId) {
      try {
        await cloudinary.uploader.destroy(publicId);
        logger.info(`Deleted profile picture from Cloudinary: ${publicId}`);
      } catch (error) {
        logger.error(
          `Failed to delete from Cloudinary: ${publicId}`,
          error as object,
        );
      }
    } else {
      logger.warn(
        `Could not extract publicId from URL: ${user.profilePicture}`,
      );
    }
  }

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      profilePicture: null,
      updatedAt: new Date(),
    },
  });

  logger.info(`Profile picture removed successfully for user ID: ${userId}`);

  const profileData = new ProfileResponseDTO(updatedUser);

  res.status(httpStatus.OK).json({
    message: RESPONSE_MESSAGES.PROFILE.PICTURE_REMOVED,
    data: profileData,
  });
});

const deleteAccount = Asyncly(async (req: Request, res: Response) => {
  const userId = req.currentUser?.id;
  const { password } = req.body;

  logger.info(`Account deletion requested for user ID: ${userId}`);

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      fullname: true,
      email: true,
      password: true,
      profilePicture: true,
      wallets: {
        select: {
          id: true,
          // depositBalance: true,
          referralBalance: true,
          // cashBackBalance: true,
        },
      },
      // virtualAccounts: {
      //   select: {
      //     id: true,
      //     balance: true,
      //   },
      // },
    },
  });

  if (!user) {
    logger.error(`User not found for ID: ${userId}`);
    throw new NotFoundException("User not found");
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    logger.warn(`Invalid password provided for account deletion: ${userId}`);
    throw new UnauthorizedException("Invalid password");
  }

  // const hasBalance = user.wallets.some(
  //   (wallet) =>
  //     Number(wallet.depositBalance) > 0 ||
  //     Number(wallet.referralBalance) > 0 ||
  //     Number(wallet.cashBackBalance) > 0,
  // );

  // const hasVirtualAccountBalance = user.virtualAccounts.some(
  //   (va) => Number(va.balance) > 0,
  // );

  // if (hasBalance || hasVirtualAccountBalance) {
  //   logger.warn(
  //     `Account deletion blocked due to active balance for user ${userId}`,
  //   );
  //   throw new BadRequestException(
  //     "Cannot delete account with active balance. Please withdraw all funds first.",
  //   );
  // }

  await prisma.$executeRaw`
    UPDATE users
    SET "deletedAt" = ${new Date()}, "updatedAt" = ${new Date()}
    WHERE id = ${userId}
  `;

  logger.info(`Account soft deleted successfully for user ID: ${userId}`);

  try {
    await publishToQueue({
      type: "NOTIFICATION_EVENT",
      payload: {
        userId,
        notificationType: "SYSTEM",
        priority: "high",
        title: "Account Deleted",
        message: `Your Viel account has been permanently deleted. We're sorry to see you go.`,
        metadata: {
          type: "account_deletion",
          deletedAt: new Date().toISOString(),
        },
        deliveryChannels: ["email"],
      },
    });
    logger.info(`Account deletion notification queued for user ${userId}`);
  } catch (error) {
    logger.error(
      `Failed to queue account deletion notification for user ${userId}:`,
      error as object,
    );
  }

  res.status(httpStatus.OK).json({
    message:
      "Account deleted successfully. Your data has been removed from our system.",
    data: {
      deletedAt: new Date().toISOString(),
      email: user.email,
    },
  });
});

// const getTagline = Asyncly(async (req: Request, res: Response) => {
//   const userId = req.currentUser?.id;
//   logger.info(`Fetching app tagline... for ${userId}`);

//   const deviceId = req.headers["device-id"] as string;

//   if (!deviceId) {
//     logger.warn(`No device-id header provided for user ${userId}`);
//     const defaultTagline = "Trade smarter, earn faster!";

//     return res.status(httpStatus.OK).json({
//       success: true,
//       message: "Tagline retrieved successfully",
//       data: {
//         tagline: defaultTagline,
//       },
//     });
//   }

//   const deviceSession = await prisma.deviceSession.findUnique({
//     where: { userId_deviceId: { userId: userId!, deviceId } },
//     select: { lastTaglineShown: true },
//   });

//   const defaultTagline = "Trade smarter, earn faster!";
//   const taglineValue = deviceSession?.lastTaglineShown || defaultTagline;

//   logger.info(`Retrieved tagline: ${taglineValue}`);

//   return res.status(httpStatus.OK).json({
//     success: true,
//     message: "Tagline retrieved successfully",
//     data: {
//       tagline: taglineValue,
//     },
//   });
// });

const getNetTradingVolume = Asyncly(async (req: Request, res: Response) => {
  const userId = req.currentUser?.id;
  logger.info(`Fetching net trading volume for user ID: ${userId}`);

  const aggregations = await prisma.transaction.groupBy({
    by: ['type'],
    where: {
      userId,
      status: 'SUCCESS',
      category: {
        in: ['GIFTCARDS', 'CRYPTO'],
      },
      type: {
        not: null,
      },
    },
    _sum: {
      amount: true,
    },
  });

  let totalBuyVolume = 0;
  let totalSellVolume = 0;

  aggregations.forEach((agg) => {
    if (agg.type === 'DEBIT') {
      totalBuyVolume = Number(agg._sum.amount || 0);
    } else if (agg.type === 'CREDIT') {
      totalSellVolume = Number(agg._sum.amount || 0);
    }
  });

  const netVolume = totalBuyVolume + totalSellVolume;

  res.status(httpStatus.OK).json({
    message: "Net trading volume retrieved successfully",
    data: {
      buyVolume: totalBuyVolume.toString(),
      sellVolume: totalSellVolume.toString(),
      netVolume: netVolume.toString(),
    },
  });
});

const DIDIT_WORKFLOW_ID = "63c4964d-0c99-4071-8b51-a300c2b7000b";

const createDiditSession = Asyncly(async (req: Request, res: Response) => {
  const userId = req.currentUser?.id;
  if (!userId) throw new UnauthorizedException("Not authorized");

  logger.info(`Creating Didit verification session for user ID: ${userId}`);

  const axios = require('axios');
  try {
    const response = await axios.post("https://verification.didit.me/v3/session/", {
      workflow_id: DIDIT_WORKFLOW_ID,
      vendor_data: userId,
    }, {
      headers: {
        "x-api-key": process.env.DIDIT_API_KEY!,
        "Content-Type": "application/json",
      },
    });

    const session = response.data;
    
    res.status(httpStatus.CREATED).json({
      message: "Session created successfully",
      data: {
        session_token: session.session_token,
        url: session.url,
        session_id: session.session_id,
      }
    });
  } catch (error: any) {
    logger.error(`Failed to create Didit session for ${userId}: ${error.response?.data || error.message}`);
    throw new InternalServerErrorException("Failed to initiate verification session.");
  }
});

import crypto from "node:crypto";

function shortenFloats(v: unknown): unknown {
  if (Array.isArray(v)) return v.map(shortenFloats);
  if (v && typeof v === "object") {
    return Object.fromEntries(
      Object.entries(v as Record<string, unknown>).map(([k, x]) => [k, shortenFloats(x)]),
    );
  }
  if (typeof v === "number" && !Number.isInteger(v) && v % 1 === 0) return Math.trunc(v);
  return v;
}

function sortKeys(v: unknown): unknown {
  if (Array.isArray(v)) return v.map(sortKeys);
  if (v && typeof v === "object") {
    return Object.keys(v as object)
      .sort()
      .reduce<Record<string, unknown>>((acc, k) => {
        acc[k] = sortKeys((v as Record<string, unknown>)[k]);
        return acc;
      }, {});
  }
  return v;
}

const handleDiditWebhook = Asyncly(async (req: Request, res: Response) => {
  const sig = req.headers["x-signature-v2"] as string ?? "";
  const ts = Number(req.headers["x-timestamp"]);

  if (!ts || Math.abs(Date.now() / 1000 - ts) > 300) {
    res.status(401).send("stale");
    return;
  }

  const canonical = JSON.stringify(sortKeys(shortenFloats(req.body)));

  const expected = crypto
    .createHmac("sha256", process.env.DIDIT_WEBHOOK_SECRET!)
    .update(canonical, "utf8")
    .digest("hex");
    
  if (
    sig.length !== expected.length ||
    !crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(sig))
  ) {
    res.status(401).send("bad sig");
    return;
  }

  const parsed = req.body;
  const userId = parsed.vendor_data;
  
  if (parsed.status === "Approved") {
    await prisma.user.update({
      where: { id: userId },
      data: { isVerified: true, isKycVerified: true }
    });
  } else if (parsed.status === "Declined" || parsed.status === "Kyc Expired") {
    await prisma.user.update({
      where: { id: userId },
      data: { isVerified: false, isKycVerified: false }
    });
  }

  res.status(200).send("ok");
});

export const profileController = {
  getProfile,
  updateProfile,
  uploadProfilePicture,
  removeProfilePicture,
  deleteAccount,
  getNetTradingVolume,
  createDiditSession,
  handleDiditWebhook,
};
