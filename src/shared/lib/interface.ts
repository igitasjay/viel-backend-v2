export interface PushNotificationPayload {
    userId: string;
    title: string;
    message: string;
    data?: Record<string, string>;
    imageUrl?: string;
}
