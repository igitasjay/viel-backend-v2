export class NotificationResponseDTO {
  id: string;
  title: string;
  message: string;
  isRead: boolean;
  type: string;
  createdAt: string;

  constructor(notification: any) {
    this.id = notification.id;
    this.title = notification.title;
    this.message = notification.message;
    this.isRead = notification.isRead ?? false;
    this.type = notification.type ?? 'SYSTEM';

    const createdAt = notification.createdAt;
    if (createdAt instanceof Date) {
      this.createdAt = createdAt.toISOString();
    } else if (typeof createdAt === "string") {
      this.createdAt = createdAt;
    } else {
      this.createdAt = new Date().toISOString();
    }
  }
}

export class NotificationListResponseDTO {
  notifications: NotificationResponseDTO[];

  constructor(data: { notifications: NotificationResponseDTO[] }) {
    this.notifications = data.notifications;
  }
}

export class DeviceTokenResponseDTO {
  id: string;
  deviceId: string;
  platform: string;
  isActive: boolean;
  createdAt: string;

  constructor(deviceToken: any) {
    this.id = deviceToken.id;
    this.deviceId = deviceToken.deviceId;
    this.platform = deviceToken.platform;
    this.isActive = deviceToken.isActive;
    this.createdAt = deviceToken.createdAt.toISOString();
  }
}

export class DeviceTokenRegistrationResponseDTO {
  success: boolean;
  deviceToken: DeviceTokenResponseDTO;
  message: string;

  constructor(deviceToken: any, isNewRegistration: boolean) {
    this.success = true;
    this.deviceToken = new DeviceTokenResponseDTO(deviceToken);
    this.message = isNewRegistration
      ? "Device token registered successfully"
      : "Device token updated successfully";
  }
}
