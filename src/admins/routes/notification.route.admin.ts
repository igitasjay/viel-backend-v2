import express from "express";
import { adminNotificationController } from "../controllers/notification.controller.admin";
import { requireAdminAuth } from "@/shared/middlewares/admin.auth.middleware";

const adminNotificationRoutes = express.Router();

adminNotificationRoutes.post(
    "/send",
    requireAdminAuth,
    adminNotificationController.sendNotificationToUsers
);

adminNotificationRoutes.get(
    "/sent",
    requireAdminAuth,
    adminNotificationController.getSentNotifications
);

export { adminNotificationRoutes };
