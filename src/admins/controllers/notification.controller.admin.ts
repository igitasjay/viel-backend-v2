import { Request, Response } from "express";
import { Asyncly } from "@/shared/extensions/asyncly";
import { httpStatus } from "@/shared/exceptions/statusCodes";
import { prisma } from "@/shared/db/prisma";
import { NotificationType } from "@prisma/client";

const sendNotificationToUsers = Asyncly(async (req: Request, res: Response) => {
    const { title, message, audience, type, scheduledFor } = req.body;
    const adminId = req.currentUser?.id;

    // Audience can be: "All Users", "Active", "Inactive", or a specific user ID
    // Type can be mapped to NotificationType
    let targetType = "SYSTEM";
    if (type === "Promotional") targetType = "PROMO";
    if (type === "System") targetType = "SYSTEM";
    if (type === "Alert") targetType = "SECURITY";
    if (type === "Update") targetType = "SYSTEM";

    let filterCriteria: any = {};
    let targetUserIds: string[] = [];

    if (audience === "All Users") {
        // Leave filterCriteria empty to target all users, but we should make sure they are active
        filterCriteria = { isActive: true };
    } else if (audience === "Active") {
        filterCriteria = { isActive: true };
        // We could use deviceSession logic for more accurate 'Active', but let's stick to isActive for now
    } else if (audience === "Inactive") {
        filterCriteria = { isActive: false };
    } else {
        // Specific user
        targetUserIds = [audience];
    }

    const scheduledTime = scheduledFor ? new Date(scheduledFor) : new Date();

    const scheduledNotif = await prisma.scheduledNotification.create({
        data: {
            title,
            message,
            type: targetType as NotificationType,
            priority: targetType === "PROMO" ? "low" : "high",
            scheduledFor: scheduledTime,
            targetUserIds,
            filterCriteria,
            createdById: adminId,
            metadata: {
                deliveryChannels: ["in_app", "push"],
                audience: audience
            }
        }
    });

    res.status(httpStatus.OK).json({
        success: true,
        message: scheduledFor ? "Notification scheduled successfully" : "Notification queued for sending",
        data: scheduledNotif
    });
});

const getSentNotifications = Asyncly(async (req: Request, res: Response) => {
    // Get scheduled notifications that were created by admin (or all)
    const notifications = await prisma.scheduledNotification.findMany({
        orderBy: { createdAt: "desc" },
        take: 50,
    });

    res.status(httpStatus.OK).json({
        success: true,
        message: "Notifications fetched successfully",
        data: notifications
    });
});

export const adminNotificationController = {
    sendNotificationToUsers,
    getSentNotifications
};
