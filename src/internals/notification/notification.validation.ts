import { z } from "zod";
import type { NotificationEventPayload } from "./interface";

export const notificationEventSchema = z.object({
  type: z.literal("NOTIFICATION_EVENT"),
  payload: z.object({
    userId: z.string().min(1, "User ID is required"),
    notificationType: z.enum([
      "TRANSACTION",
      "WALLET",
      "GIFTCARD",
      "DISPUTE",
      "SECURITY",
      "PROMO",
      "SYSTEM",
    ]),
    priority: z.enum(["high", "low"]),
    title: z.string().min(1, "Title is required").max(255, "Title too long"),
    message: z
      .string()
      .min(1, "Message is required")
      .max(1000, "Message too long"),
    metadata: z.record(z.string(), z.any()).optional(),
    deliveryChannels: z
      .array(z.enum(["in_app", "push"]))
      .min(1, "At least one delivery channel required"),
  }),
}) satisfies z.ZodType<{
  type: "NOTIFICATION_EVENT";
  payload: NotificationEventPayload;
}>;

export const registerDeviceTokenSchema = z.object({
  token: z
    .string()
    .min(1, "FCM token is required")
    .max(1000, "FCM token is too long"),

  deviceId: z
    .string()
    .min(1, "Device ID is required")
    .max(255, "Device ID is too long"),

  platform: z.enum(["ios", "android", "web"], {
    message: "Platform must be either 'ios', 'android', or 'web'",
  }),
});

// export const getNotificationsSchema = z.object({
//   query: z.object({
//     page: z
//       .string()
//       .optional()
//       .transform(val => val ? parseInt(val, 10) : 1)
//       .refine(val => val >= 1, "Page must be a positive integer"),

//     limit: z
//       .string()
//       .optional()
//       .transform(val => val ? parseInt(val, 10) : 20)
//       .refine(val => val >= 1 && val <= 100, "Limit must be between 1 and 100"),

//     type: z
//       .enum(["TRANSACTION", "WALLET", "GIFTCARD", "DISPUTE", "SECURITY", "PROMO", "SYSTEM"])
//       .optional(),

//     isRead: z
//       .string()
//       .optional()
//       .transform(val => {
//         if (val === undefined) return undefined;
//         if (val === "true") return true;
//         if (val === "false") return false;
//         throw new Error("isRead must be 'true' or 'false'");
//       })
//   }).optional()
// });

export const updateNotificationSchema = z.object({
  params: z.object({
    id: z
      .string()
      .min(1, "Notification ID is required")
      .regex(/^[0-9A-Z]{26}$/, "Invalid notification ID format"),
  }),

  body: z
    .object({
      isRead: z.boolean({
        // required_error: "isRead is required",
        // invalid_type_error: "isRead must be a boolean"
      }),
    })
    .optional(),
});

export const removeDeviceTokenSchema = z.object({
  deviceId: z
    .string()
    .min(1, "Device ID is required")
    .max(255, "Device ID is too long"),
});

export const notificationValidation = {
  registerDeviceTokenSchema,
  // getNotificationsSchema,
  updateNotificationSchema,
  removeDeviceTokenSchema,
};
