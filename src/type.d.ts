import { Request as ExpressRequest } from "express";

declare global {
    interface AuthUser {
        id: string;
        email: string;
        name: string;
        authMethod?: string;
    }

    interface AuthAdmin {
        id: string;
        email: string;
        name: string;
        isSuper?: boolean;
        isAdmin?: boolean;
    }

    interface DeviceSession {
        id: string;
        deviceId: string;
        deviceType: string | null;
        deviceName: string | null;
        location: string | null;
        isTrusted: boolean;
    }

    namespace Express {
        export interface Request {
            currentUser: AuthUser;
            currentAdmin: AuthAdmin;
            accessToken?: string;
            currentDevice?: DeviceSession;
        }
    }

    // Helper interface for explicit casting if needed
    export interface AuthenticatedRequest extends ExpressRequest {
        currentUser: AuthUser;
        currentAdmin: AuthAdmin;
        accessToken?: string;
        currentDevice?: DeviceSession;
    }
}

declare module "hpp";
declare module "express-sslify";

export { };
