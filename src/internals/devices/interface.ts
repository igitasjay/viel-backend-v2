export interface DevicePayload {
    userId: string;
    email: string;
    fullname: string;
    headers: Record<string, any>;
    ipAddress: string;
}
