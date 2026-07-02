import { Request, Response } from "express";
import { NotificationService } from "./notification.service";
import { logger } from "@/lib/winston";
import { withPagination } from "@shared/utils/pagination";
import { httpStatus } from "@/shared/exceptions/statusCodes";
import { Asyncly } from "@/shared/extensions/asyncly";
import { NotFoundException, UnauthorizedException } from "@shared/exceptions/exceptions";
import {
  NotificationResponseDTO,
  DeviceTokenRegistrationResponseDTO,
} from "./notification.dto";
import { RESPONSE_MESSAGES } from "./constants";
import { prisma } from "@/shared/db/prisma";

const getNotifications = Asyncly(async (req: Request, res: Response) => {
  const userId = req.currentUser?.id;

  if (!userId) {
    throw new UnauthorizedException("User not authenticated");
  }

  logger.info(`Fetching notifications for user ID: ${userId}`);

  const where: Record<string, any> = { userId, isRead: false };

  const paginatedResult = await withPagination({
    model: "notification",
    req,
    res,
    where,
    transform: (notification) => new NotificationResponseDTO(notification),
  });

  res.status(httpStatus.OK).json({
    message: RESPONSE_MESSAGES.NOTIFICATION.FETCHED,
    ...paginatedResult,
  });
});

const getUnreadNotificationsCount = Asyncly(
  async (req: Request, res: Response) => {
    const userId = req.currentUser.id;
    logger.info(`[Notifications] Fetching unread count for user: ${userId}`);

    if (!userId) {
      logger.warn("[Notifications] Unauthenticated unread count attempt");
      throw new UnauthorizedException("User not authenticated");
    }

    const unreadCount = await prisma.notification.count({
      where: { userId, isRead: false },
    });

    logger.info(
      `[Notifications] User ${userId} has ${unreadCount} unread notifications`,
    );
    res.status(httpStatus.OK).json({
      success: true,
      message: "Unread notifications count retrieved successfully",
      data: { unreadCount },
    });
  },
);

const updateNotificationStatus = Asyncly(
  async (req: Request, res: Response) => {
    const userId = req.currentUser?.id;
    const { id } = req.params;

    if (!userId) {
      throw new UnauthorizedException("User not authenticated");
    }

    const updatedNotification =
      await NotificationService.updateNotificationStatus(id, userId);

    res.status(httpStatus.OK).json({
      message: RESPONSE_MESSAGES.NOTIFICATION.UPDATED,
      data: new NotificationResponseDTO(updatedNotification),
    });
  },
);

const markAllAsRead = Asyncly(async (req: Request, res: Response) => {
  const userId = req.currentUser?.id;

  if (!userId) {
    throw new UnauthorizedException("User not authenticated");
  }

  await prisma.notification.updateMany({
    where: { userId, isRead: false },
    data: { isRead: true },
  });

  res.status(httpStatus.OK).json({
    message: "All notifications marked as read",
  });
});

const deleteNotification = Asyncly(async (req: Request, res: Response) => {
  const userId = req.currentUser?.id;
  const { id } = req.params;

  if (!userId) {
    throw new UnauthorizedException("User not authenticated");
  }

  const deleteResult = await prisma.notification.deleteMany({
    where: { id: id, userId: userId },
  });

  if (deleteResult.count === 0) {
    throw new NotFoundException("Notification not found");
  }

  res.status(httpStatus.OK).json({
    message: RESPONSE_MESSAGES.NOTIFICATION.DELETED,
    data: { id },
  });
});

const registerDeviceToken = Asyncly(async (req: Request, res: Response) => {
  const userId = req.currentUser?.id;
  const { token, deviceId, platform } = req.body;

  if (!userId) {
    throw new UnauthorizedException("User not authenticated");
  }

  const result = await NotificationService.registerDeviceToken({
    userId,
    token,
    deviceId,
    platform,
  });

  const responseData = new DeviceTokenRegistrationResponseDTO(
    result.deviceToken,
    result.isNewRegistration,
  );

  res.status(httpStatus.OK).json({
    message: RESPONSE_MESSAGES.NOTIFICATION.DEVICE_TOKEN_REGISTERED,
    data: responseData,
  });
});

const removeDeviceToken = Asyncly(async (req: Request, res: Response) => {
  const userId = req.currentUser?.id;
  const { deviceId } = req.body;

  await prisma.deviceTokens.updateMany({
    where: { userId: userId, deviceId: deviceId },
    data: { isActive: false },
  });

  res.status(httpStatus.OK).json({
    message: "Device token removed successfully",
    data: { deviceId },
  });
});

const testPushNotification = Asyncly(async (req: Request, res: Response) => {
  const userId = req.currentUser?.id;
  const { title, message, data, imageUrl } = req.body || {};

  if (!userId) {
    throw new UnauthorizedException("User not authenticated");
  }

  const notificationTitle = title || "Welcome to Trade Aviator! 🎉";
  const notificationMessage =
    message ||
    `We are glad to have you on board${req.currentUser?.name ? `, ${req.currentUser.name}` : ""}!\n\nStart exploring our features and enjoy a seamless trading experience.`;

  const result = await NotificationService.processNotificationEvent({
    userId,
    notificationType: "WELCOME",
    title: notificationTitle,
    message: notificationMessage,
    metadata: {
      type: "WELCOME",
      screen: "home",
      ...data,
    },
    deliveryChannels: ["push"],
    imageUrl:
      imageUrl ||
      "https://images.unsplash.com/photo-1594323713852-9626155bfd37?q=80&w=774&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  });

  res.status(httpStatus.OK).json({
    message: "Test push notification sent successfully",
    data: {
      userId,
      title: notificationTitle,
      message: notificationMessage,
      result,
    },
  });
});

export const notificationController = {
  getNotifications,
  getUnreadNotificationsCount,
  updateNotificationStatus,
  deleteNotification,
  markAllAsRead,
  registerDeviceToken,
  removeDeviceToken,
  testPushNotification,
};
