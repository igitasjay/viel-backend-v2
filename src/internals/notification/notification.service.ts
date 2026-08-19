import { prisma } from "@shared/db/prisma";
import { logger } from "@/lib/winston";
import { OneSignalService } from "@shared/lib/onesignal";
import {
  NotFoundException,
  InternalServerErrorException,
  AppException,
} from "@shared/exceptions/exceptions";
import { NotificationEventPayload, CreateNotificationInput } from "./interface";
import { publishToQueue } from "@shared/workers/publisher";

export class NotificationService {
  static async createNotification(input: CreateNotificationInput) {
    try {
      const notification = await prisma.notification.create({
        data: {
          userId: input.userId,
          title: input.title,
          message: input.message,
          type: input.type as any,
          // priority: input.priority || 'normal',
          meta: input.metadata || {},
          isRead: false,
        },
      });

      logger.info(
        `Created notification for user ${input.userId}: ${input.title}`,
      );
      return notification;
    } catch (error) {
      logger.error("Failed to create notification:", error as object);
      throw new InternalServerErrorException("Failed to create notification");
    }
  }

  static async getNotifications(input: any) {
    try {
      const whereClause: any = { userId: input.userId };

      if (input.type) whereClause.type = input.type;
      if (input.isRead !== undefined) whereClause.isRead = input.isRead;

      const total = await prisma.notification.count({ where: whereClause });
      const unreadCount = await prisma.notification.count({
        where: { userId: input.userId, isRead: false },
      });

      const notifications = await prisma.notification.findMany({
        where: whereClause,
        orderBy: { createdAt: "desc" },
        skip: (input.page - 1) * input.limit,
        take: input.limit,
      });

      return {
        notifications,
        total,
        page: input.page,
        limit: input.limit,
        unreadCount,
      };
    } catch (error) {
      logger.error(`Failed to get notifications:`, error as object);
      throw new InternalServerErrorException(
        "Failed to retrieve notifications",
      );
    }
  }

  static async updateNotificationStatus(
    notificationId: string,
    userId: string,
  ) {
    try {
      const notification = await prisma.notification.findFirst({
        where: { id: notificationId, userId: userId },
      });

      if (!notification) {
        throw new NotFoundException("Notification not found");
      }

      const updatedNotification = await prisma.notification.update({
        where: { id: notificationId },
        data: { isRead: true },
      });

      logger.info(
        `Marked notification ${notificationId} as ${updatedNotification.isRead} for user ${userId}`,
      );
      return updatedNotification;
    } catch (error) {
      if (error instanceof AppException) throw error;
      logger.error(`Failed to mark notification as read:`, error as object);
      throw new InternalServerErrorException("Failed to update notification");
    }
  }

  static async registerDeviceToken(input: any) {
    try {
      // Find by token instead of userId+deviceId to support multiple accounts on same device
      const existingToken = await prisma.deviceTokens.findUnique({
        where: { token: input.token },
      });

      let deviceToken;
      let isNewRegistration = false;

      if (existingToken) {
        // Update existing token - this handles account switching
        deviceToken = await prisma.deviceTokens.update({
          where: { id: existingToken.id },
          data: {
            userId: input.userId, // Update to current user
            deviceId: input.deviceId,
            platform: input.platform,
            isActive: true,
            updatedAt: new Date(),
          },
        });
        logger.info(
          `Device token updated for user ${input.userId} (was user ${existingToken.userId})`,
        );
      } else {
        deviceToken = await prisma.deviceTokens.create({
          data: {
            userId: input.userId,
            token: input.token,
            deviceId: input.deviceId,
            platform: input.platform,
            isActive: true,
          },
        });
        isNewRegistration = true;
        logger.info(`New device token registered for user ${input.userId}`);
      }

      return { deviceToken, isNewRegistration };
    } catch (error) {
      logger.error("Failed to register device token:", error as object);
      throw new InternalServerErrorException("Failed to register device token");
    }
  }

  static async processNotificationEvent(payload: NotificationEventPayload) {
    try {
      const {
        userId,
        notificationType,
        title,
        message,
        metadata,
        deliveryChannels = ["in_app", "push"],
      } = payload;

      if (deliveryChannels.includes("in_app")) {
        await this.createNotification({
          userId,
          title,
          message,
          type: notificationType,
          metadata,
        });
      }

      if (deliveryChannels.includes("push")) {
        await OneSignalService.sendToUser({
          userId,
          title,
          message,
          imageUrl: payload.imageUrl,
          data: { type: notificationType, ...metadata },
        });
      }

      if (deliveryChannels.includes("email")) {
        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: { email: true, fullname: true },
        });

        if (user?.email) {
          await publishToQueue({
            type: "EMAIL_NOTIFICATION",
            payload: {
              recipient: user.email,
              fullName: user.fullname,
              notificationDetails: {
                notificationType,
                title,
                message,
                metadata,
              },
            },
          });
          logger.info(`Email notification queued for user ${userId}`);
        } else {
          logger.warn(
            `User ${userId} has no email address, skipping email notification`,
          );
        }
      }

      logger.info(`Processed notification event for user ${userId}: ${title}`);
    } catch (error) {
      logger.error("Failed to process notification event:", error as object);
      throw error;
    }
  }

  static async createBroadcast(input: {
    title: string;
    message: string;
    type: string;
    priority?: string;
    metadata?: any;
    targetAudience?: string;
    filterCriteria?: any;
    userIds: string[];
    createdById?: string;
  }) {
    try {
      const broadcast = await prisma.broadcastNotification.create({
        data: {
          title: input.title,
          message: input.message,
          type: input.type as any,
          priority: input.priority || "medium",
          metadata: input.metadata || {},
          targetAudience: input.targetAudience || "CUSTOM",
          filterCriteria: input.filterCriteria || {},
          totalSent: input.userIds.length,
          createdById: input.createdById,
        },
      });

      await prisma.broadcastNotificationStatus.createMany({
        data: input.userIds.map((userId) => ({
          userId,
          broadcastId: broadcast.id,
        })),
      });

      logger.info(
        `Created broadcast notification: ${broadcast.id} for ${input.userIds.length} users`,
      );
      return broadcast;
    } catch (error) {
      logger.error("Failed to create broadcast notification:", error as object);
      throw new InternalServerErrorException(
        "Failed to create broadcast notification",
      );
    }
  }

  static async getUserNotificationsWithBroadcasts(input: {
    userId: string;
    type?: string;
    isRead?: boolean;
    page: number;
    limit: number;
  }) {
    try {
      const whereClause: any = { userId: input.userId };
      if (input.type) whereClause.type = input.type;
      if (input.isRead !== undefined) whereClause.isRead = input.isRead;

      const userNotifications = await prisma.notification.findMany({
        where: whereClause,
        orderBy: { createdAt: "desc" },
      });

      const broadcastStatuses =
        await prisma.broadcastNotificationStatus.findMany({
          where: {
            userId: input.userId,
            ...(input.isRead !== undefined && { isRead: input.isRead }),
          },
          include: {
            broadcast: true,
          },
          orderBy: { createdAt: "desc" },
        });

      const broadcastNotifications = broadcastStatuses.map((status) => ({
        id: status.broadcast.id,
        userId: input.userId,
        title: status.broadcast.title,
        message: status.broadcast.message,
        type: status.broadcast.type,
        status: null,
        isRead: status.isRead,
        meta: status.broadcast.metadata,
        priority: status.broadcast.priority,
        createdAt: status.broadcast.createdAt,
        isBroadcast: true,
      }));

      const allNotifications = [
        ...userNotifications.map((n) => ({ ...n, isBroadcast: false })),
        ...broadcastNotifications,
      ]
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        )
        .slice((input.page - 1) * input.limit, input.page * input.limit);

      const totalUserNotifs = await prisma.notification.count({
        where: whereClause,
      });
      const totalBroadcasts = await prisma.broadcastNotificationStatus.count({
        where: {
          userId: input.userId,
          ...(input.isRead !== undefined && { isRead: input.isRead }),
        },
      });
      const unreadUserNotifs = await prisma.notification.count({
        where: { userId: input.userId, isRead: false },
      });
      const unreadBroadcasts = await prisma.broadcastNotificationStatus.count({
        where: { userId: input.userId, isRead: false },
      });

      return {
        notifications: allNotifications,
        total: totalUserNotifs + totalBroadcasts,
        page: input.page,
        limit: input.limit,
        unreadCount: unreadUserNotifs + unreadBroadcasts,
      };
    } catch (error) {
      logger.error("Failed to get user notifications:", error as object);
      throw new InternalServerErrorException(
        "Failed to retrieve notifications",
      );
    }
  }

  static async markBroadcastAsRead(broadcastId: string, userId: string) {
    try {
      const status = await prisma.broadcastNotificationStatus.findUnique({
        where: {
          userId_broadcastId: { userId, broadcastId },
        },
      });

      if (!status) {
        throw new NotFoundException("Broadcast notification not found");
      }

      if (status.isRead) {
        return status;
      }

      const updatedStatus = await prisma.broadcastNotificationStatus.update({
        where: {
          userId_broadcastId: { userId, broadcastId },
        },
        data: {
          isRead: true,
          readAt: new Date(),
        },
      });

      await prisma.broadcastNotification.update({
        where: { id: broadcastId },
        data: { totalRead: { increment: 1 } },
      });

      logger.info(`Marked broadcast ${broadcastId} as read for user ${userId}`);
      return updatedStatus;
    } catch (error) {
      if (error instanceof AppException) throw error;
      logger.error("Failed to mark broadcast as read:", error as object);
      throw new InternalServerErrorException(
        "Failed to update broadcast status",
      );
    }
  }
}
