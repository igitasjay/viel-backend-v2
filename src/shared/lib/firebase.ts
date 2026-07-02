import { admin, getFirebaseApp } from '@shared/config/firebase';
import { getMessaging, Messaging, MulticastMessage, SendResponse } from 'firebase-admin/messaging';
import { logger } from "@/lib/winston";
import { prisma } from "../db/prisma";
import { PushNotificationPayload } from "./interface";

function decodeHtmlEntities(text: string): string {
    if (!text) return text;

    const entities: Record<string, string> = {
        "&amp;": "&",
        "&lt;": "<",
        "&gt;": ">",
        "&quot;": '"',
        "&#39;": "'",
        "&apos;": "'",
        "&nbsp;": " ",
    };

    let decoded = text;
    Object.entries(entities).forEach(([entity, char]) => {
        decoded = decoded.replace(new RegExp(entity, "gi"), char);
    });

    decoded = decoded.replace(/&#(\d+);/g, (_match, dec) => {
        return String.fromCharCode(dec);
    });

    decoded = decoded.replace(/&#x([0-9a-f]+);/gi, (_match, hex) => {
        return String.fromCharCode(parseInt(hex, 16));
    });

    return decoded;
}

export class FirebaseService {
    private static messaging: Messaging;

    static initialize() {
        const app = getFirebaseApp();
        this.messaging = getMessaging(app);
        logger.info("Firebase Messaging service initialized");
    }

    static async sendToUser(payload: PushNotificationPayload): Promise<boolean> {
        try {
            if (!this.messaging) {
                this.initialize();
            }

            // Debug: Log original payload
            logger.info("Original notification payload:", {
                title: payload.title,
                message: payload.message,
                titleContainsAmp: payload.title?.includes("&"),
                messageContainsAmp: payload.message?.includes("&"),
            });

            const deviceTokens = await prisma.deviceTokens.findMany({
                where: {
                    userId: payload.userId,
                    isActive: true,
                },
                select: {
                    token: true,
                    platform: true,
                },
            });

            if (deviceTokens.length === 0) {
                logger.warn(`No active device tokens found for user ${payload.userId}`);
                return false;
            }

            const tokens = deviceTokens.map((dt) => dt.token);

            const decodedTitle = decodeHtmlEntities(payload.title);
            const decodedMessage = decodeHtmlEntities(payload.message);

            // Debug: Log decoded values
            logger.info("Decoded notification values:", {
                originalTitle: payload.title,
                decodedTitle,
                originalMessage: payload.message,
                decodedMessage,
            });

            const message: MulticastMessage = {
                tokens,
                notification: {
                    title: decodedTitle,
                    body: decodedMessage,
                    imageUrl: payload.imageUrl,
                },
                data: {
                    userId: payload.userId,
                    timestamp: new Date().toISOString(),
                    ...payload.data,
                },
                android: {
                    notification: {
                        icon: "ic_notification",
                        color: "#d25a19",
                        sound: "default",
                        channelId:
                            payload.data?.notificationType === "SYSTEM" &&
                                payload.data?.type?.startsWith("support")
                                ? "support_notifications"
                                : "trade_aviator_notifications",
                        priority: "high" as any,
                        defaultSound: true,
                        defaultVibrateTimings: true,
                        defaultLightSettings: true,
                        imageUrl: payload.imageUrl,
                        tag: payload.data?.notificationType || "general",
                        clickAction: "FLUTTER_NOTIFICATION_CLICK",
                        visibility: "public" as any,
                        sticky:
                            payload.data?.notificationType === "SYSTEM" &&
                            payload.data?.type?.startsWith("support"),
                        localOnly: payload.data?.notificationType === "SECURITY",
                        vibrateTimingsMillis:
                            payload.data?.notificationType === "SYSTEM" &&
                                payload.data?.type?.startsWith("support")
                                ? [0, 250, 250, 250]
                                : undefined,
                        lightSettings: {
                            color: "#d25a19",
                            lightOnDurationMillis: 300,
                            lightOffDurationMillis: 1000,
                        },
                    },
                    priority: "high",
                    ttl:
                        payload.data?.notificationType === "SYSTEM" &&
                            payload.data?.type?.startsWith("support")
                            ? 86400
                            : 3600,
                    collapseKey: payload.data?.conversationId
                        ? `support_${payload.data.conversationId}`
                        : undefined,
                },
                apns: {
                    payload: {
                        aps: {
                            sound:
                                payload.data?.notificationType === "SYSTEM" &&
                                    payload.data?.type?.startsWith("support")
                                    ? { name: "default", critical: false, volume: 1.0 }
                                    : "default",
                            badge: 1,
                            contentAvailable: true,
                            mutableContent: true,
                            interruptionLevel:
                                (payload.data?.notificationType === "SYSTEM" &&
                                    payload.data?.type?.startsWith("support")) ||
                                    payload.data?.notificationType === "URGENT"
                                    ? "time-sensitive"
                                    : "active",
                            relevanceScore:
                                payload.data?.notificationType === "SYSTEM" &&
                                    payload.data?.type?.startsWith("support")
                                    ? 1.0
                                    : 0.5,
                            threadId:
                                payload.data?.conversationId ||
                                payload.data?.notificationType ||
                                "general",
                            targetContentId: payload.data?.conversationId,
                        },
                    },
                    fcmOptions: {
                        imageUrl: payload.imageUrl,
                    },
                    headers: {
                        "apns-priority": "10",
                        "apns-push-type": "alert",
                        "apns-expiration":
                            payload.data?.notificationType === "SYSTEM" &&
                                payload.data?.type?.startsWith("support")
                                ? String(Math.floor(Date.now() / 1000) + 86400) // 24h
                                : String(Math.floor(Date.now() / 1000) + 3600), // 1h
                    },
                },
                webpush: {
                    notification: {
                        title: decodedTitle,
                        body: decodedMessage,
                        icon: payload.imageUrl || "/logo.png",
                        badge: "/badge.png",
                        tag: payload.data?.notificationType || "general",
                        requireInteraction:
                            (payload.data?.notificationType === "SYSTEM" &&
                                payload.data?.type?.startsWith("support")) ||
                            payload.data?.notificationType === "URGENT",
                        renotify: true,
                        vibrate: [200, 100, 200],
                        timestamp: Date.now(),
                    },
                    fcmOptions: {
                        link: payload.data?.conversationId
                            ? `/support/conversations/${payload.data.conversationId}`
                            : "/",
                    },
                    headers: {
                        Urgency:
                            payload.data?.notificationType === "URGENT" ? "high" : "normal",
                    },
                },
            };

            const response = await this.messaging.sendEachForMulticast(message);

            logger.info(`Push notification sent to user ${payload.userId}:`, {
                successCount: response.successCount,
                failureCount: response.failureCount,
            });

            if (response.failureCount > 0) {
                response.responses.forEach((resp, index) => {
                    if (!resp.success && resp.error) {
                        logger.error(`Failed to send to token ${index}:`, {
                            token: tokens[index].substring(0, 20) + "...",
                            errorCode: resp.error.code,
                            errorMessage: resp.error.message,
                        });
                    }
                });
                await this.handleFailedTokens(response.responses, tokens);
            }
            console.log(response.successCount);
            return response.successCount > 0;
        } catch (error) {
            logger.error(
                `Failed to send push notification to user ${payload.userId}:`,
                error as object,
            );
            return false;
        }
    }

    private static async handleFailedTokens(
        responses: SendResponse[],
        tokens: string[],
    ): Promise<void> {
        const failedTokens: string[] = [];

        responses.forEach((response, index) => {
            if (!response.success) {
                const error = response.error;

                if (
                    error?.code === "messaging/registration-token-not-registered" ||
                    error?.code === "messaging/invalid-registration-token"
                ) {
                    failedTokens.push(tokens[index]);
                }
            }
        });

        if (failedTokens.length > 0) {
            await prisma.deviceTokens.updateMany({
                where: {
                    token: { in: failedTokens },
                },
                data: {
                    isActive: false,
                    updatedAt: new Date(),
                },
            });

            logger.info(`Marked ${failedTokens.length} invalid tokens as inactive`);
        }
    }
}
