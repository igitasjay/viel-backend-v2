import express from "express";
import { notificationController } from "./notification.controller";
import { requireAuth, validate } from "@shared/middlewares";
import { notificationValidation } from "./notification.validation";

const notificationRoutes = express.Router();

notificationRoutes.get(
  "/",
  requireAuth,
  notificationController.getNotifications,
);

notificationRoutes.get(
  "/unread",
  requireAuth,
  notificationController.getUnreadNotificationsCount,
);

notificationRoutes.patch(
  "/mark-all-read",
  requireAuth,
  notificationController.markAllAsRead,
);

notificationRoutes.post(
  "/device-token",
  requireAuth,
  validate(notificationValidation.registerDeviceTokenSchema),
  notificationController.registerDeviceToken,
);

notificationRoutes.delete(
  "/device-token",
  requireAuth,
  validate(notificationValidation.removeDeviceTokenSchema),
  notificationController.removeDeviceToken,
);

notificationRoutes.delete(
  "/:id",
  requireAuth,
  notificationController.deleteNotification,
);

notificationRoutes.patch(
  "/:id",
  requireAuth,
  notificationController.updateNotificationStatus,
);

notificationRoutes.post(
  "/test-push",
  requireAuth,
  notificationController.testPushNotification,
);

export { notificationRoutes };
