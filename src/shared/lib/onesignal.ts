import axios from 'axios';
import { logger } from "@/lib/winston";
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
        return String.fromCharCode(Number(dec));
    });

    decoded = decoded.replace(/&#x([0-9a-f]+);/gi, (_match, hex) => {
        return String.fromCharCode(parseInt(hex, 16));
    });

    return decoded;
}

export class OneSignalService {
    static async sendToUser(payload: PushNotificationPayload): Promise<boolean> {
        try {
            const apiKey = process.env.ONESIGNAL_REST_API_KEY;
            const appId = process.env.ONESIGNAL_APP_ID || "e625b7c9-48a0-42b8-9c43-0db71b766d62";

            if (!apiKey) {
                logger.warn("ONESIGNAL_REST_API_KEY is not defined. Skipping push notification.");
                return false;
            }

            const decodedTitle = decodeHtmlEntities(payload.title);
            const decodedMessage = decodeHtmlEntities(payload.message);

            logger.info("Sending OneSignal notification:", {
                userId: payload.userId,
                title: decodedTitle,
            });

            const data = {
                app_id: appId,
                include_aliases: {
                    external_id: [payload.userId]
                },
                target_channel: "push",
                headings: { en: decodedTitle },
                contents: { en: decodedMessage },
                data: {
                    userId: payload.userId,
                    timestamp: new Date().toISOString(),
                    ...payload.data,
                },
                ios_attachments: payload.imageUrl ? { id1: payload.imageUrl } : undefined,
                big_picture: payload.imageUrl,
            };

            const response = await axios.post(
                "https://onesignal.com/api/v1/notifications",
                data,
                {
                    headers: {
                        "Content-Type": "application/json; charset=utf-8",
                        "Authorization": `Basic ${apiKey}`,
                    },
                }
            );

            logger.info(`OneSignal push notification sent to user ${payload.userId}:`, {
                id: response.data.id,
                recipients: response.data.recipients,
            });

            return response.data.recipients > 0;
        } catch (error: any) {
            logger.error(
                `Failed to send OneSignal push notification to user ${payload.userId}:`,
                error.response?.data || error.message
            );
            return false;
        }
    }
}
