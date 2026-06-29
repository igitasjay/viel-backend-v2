import { prisma } from "@shared/db/prisma";
import { NotificationType, NotificationPriority } from "@prisma/client";

export class AdminNotificationService {
    static async createNotification(data: {
        type: NotificationType;
        title: string;
        message: string;
        priority?: NotificationPriority;
        metadata?: Record<string, any>;
    }) {
        return await prisma.adminNotification.create({
            data: {
                type: data.type,
                title: data.title,
                message: data.message,
                priority: data.priority || "medium",
                metadata: data.metadata || {},
                isGeneral: true,
                adminId: null,
            },
        });
    }

    static async getNotifications(
        adminId: string,
        options: {
            page?: number;
            limit?: number;
            isRead?: boolean;
            type?: NotificationType;
        } = {},
    ) {
        const page = options.page || 1;
        const limit = options.limit || 20;
        const skip = (page - 1) * limit;

        const whereClause: any = { isGeneral: true };

        if (options.type) {
            whereClause.type = options.type;
        }

        // Filter by read status for this specific admin
        if (options.isRead === true) {
            whereClause.readByAdmins = {
                has: adminId,
            };
        } else if (options.isRead === false) {
            whereClause.NOT = {
                readByAdmins: {
                    has: adminId,
                },
            };
        }

        const [notifications, total] = await Promise.all([
            prisma.adminNotification.findMany({
                where: whereClause,
                orderBy: { createdAt: "desc" },
                skip,
                take: limit,
            }),
            prisma.adminNotification.count({ where: whereClause }),
        ]);

        // Add isRead flag for the current admin
        const notificationsWithReadStatus = notifications.map((notif) => ({
            ...notif,
            isRead: notif.readByAdmins.includes(adminId),
        }));

        return {
            notifications: notificationsWithReadStatus,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    static async getNotificationById(notificationId: string, adminId: string) {
        const notification = await prisma.adminNotification.findFirst({
            where: {
                id: notificationId,
                isGeneral: true,
            },
        });

        if (!notification) {
            throw new Error("Notification not found");
        }

        return {
            ...notification,
            isRead: notification.readByAdmins.includes(adminId),
        };
    }

    static async markAsRead(notificationId: string, adminId: string) {
        const notification = await prisma.adminNotification.findFirst({
            where: {
                id: notificationId,
                isGeneral: true,
            },
        });

        if (!notification) {
            throw new Error("Notification not found");
        }

        // Add adminId to readByAdmins array if not already present
        if (!notification.readByAdmins.includes(adminId)) {
            return await prisma.adminNotification.update({
                where: { id: notificationId },
                data: {
                    readByAdmins: {
                        push: adminId,
                    },
                },
            });
        }

        return notification;
    }

    static async getUnreadCount(adminId: string) {
        return await prisma.adminNotification.count({
            where: {
                isGeneral: true,
                NOT: {
                    readByAdmins: {
                        has: adminId,
                    },
                },
            },
        });
    }

    static async deleteNotification(notificationId: string) {
        return await prisma.adminNotification.delete({
            where: {
                id: notificationId,
                isGeneral: true,
            },
        });
    }
}
