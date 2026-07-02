export interface NotificationEventPayload {
  userId: string;
  notificationType:
    | "WELCOME"
    | "TRANSACTION"
    | "WALLET"
    | "GIFTCARD"
    | "DISPUTE"
    | "SECURITY"
    | "PROMO"
    | "SYSTEM"
    | "REWARD"
    | "TICKET_PURCHASE"
    | "MARKETING";
  // priority: "high" | "low"; // high = in-app, low = push
  title: string;
  message: string;
  metadata?: Record<string, any>;
  deliveryChannels: ("in_app" | "push" | "email")[];
  imageUrl?: string;
}

export interface NotificationEvent {
  type: "NOTIFICATION_EVENT";
  payload: NotificationEventPayload;
}

export interface CreateNotificationInput {
  userId: string;
  title: string;
  message: string;
  type: string;
  // priority?: string;
  metadata?: Record<string, any>;
}
