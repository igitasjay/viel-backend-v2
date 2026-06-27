import { ApiClient } from "@/externals/apiclient";
import { logger } from "@/lib/winston";
import { DevicePayload } from "./interface";
import { prisma } from "@/shared/db/prisma";
import { BadRequestException, ForbiddenException, NotFoundException } from "@/shared/exceptions/exceptions";
import { publishToQueue } from "@/shared/workers/publisher";

export class DeviceSessionService {
    static readonly MAX_DEVICES = 5;

    static extractAppDeviceInfo(headers: Record<string, any>) {
        const deviceId = headers["device-id"] as string;
        const deviceType = (headers["device-type"] as string) || "Mobile Device";
        const osVersion = (headers["device-os-version"] as string) || "Unknown";
        const appVersion = (headers["device-app-version"] as string) || "Unknown";
        const deviceName = (headers["device-name"] as string) || null;
        const latitude = (headers["x-latitude"] as string) || null;
        const longitude = (headers["x-longitude"] as string) || null;
        const userAgent = headers["user-agent"] as string;
        const networkProvider =
            ((headers["network-provider"] || headers["carrier-name"]) as string) ||
            null;

        return {
            deviceId,
            deviceType,
            deviceName,
            osVersion,
            appVersion,
            latitude,
            longitude,
            userAgent,
            networkProvider,
        };
    }

    private static async getGeocodedLocation(
        latitude: string | null,
        longitude: string | null,
        ipAddress: string,
    ) {
        let locationStr = "Unknown";

        // Step 1: Try GPS coordinates if available
        if (latitude && longitude) {
            try {
                const response = await ApiClient.get(
                    `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10&addressdetails=1`,
                    null,
                    {
                        headers: {
                            "User-Agent": "MyViel/1.0.0 (support@useMyViel.com)",
                        },
                    },
                    "Geocoding request",
                );

                if (response.data && response.data.address) {
                    const { city, town, village, county, state, country } =
                        response.data.address;
                    const cityOrTown = city || town || village || county || state || "";
                    if (cityOrTown && country) {
                        locationStr = `${cityOrTown}, ${country}`;
                    } else {
                        locationStr = country || cityOrTown || "Unknown";
                    }
                }
            } catch (error) {
                logger.error("GPS Geocoding failed", { latitude, longitude, error });
            }
        }

        // Step 2: If GPS failed or wasn't available, try IP-based geolocation
        if (locationStr === "Unknown" && ipAddress && !this.isLocalIP(ipAddress)) {
            try {
                const ipGeoResponse = await ApiClient.get(
                    `http://ip-api.com/json/${ipAddress}?fields=status,message,country,regionName,city`,
                    null,
                    { timeout: 3000 },
                    "IP Geolocation request",
                );

                if (ipGeoResponse.data && ipGeoResponse.data.status === "success") {
                    const { city, regionName, country } = ipGeoResponse.data;
                    if (city && country) {
                        locationStr = `${city}, ${country}`;
                    } else if (regionName && country) {
                        locationStr = `${regionName}, ${country}`;
                    } else if (country) {
                        locationStr = country;
                    }
                }
            } catch (error) {
                logger.error("IP Geocoding failed", { ipAddress, error });
            }
        }

        return `${locationStr}`;
    }

    // Helper method to check if IP is local
    private static isLocalIP(ip: string): boolean {
        return (
            ip === "::1" ||
            ip === "127.0.0.1" ||
            ip.startsWith("192.168.") ||
            ip.startsWith("10.") ||
            ip.startsWith("172.")
        );
    }

    static async registerInitialDevice({
        userId,
        headers,
        ipAddress,
    }: Omit<DevicePayload, "email" | "fullname">) {
        const deviceInfo = this.extractAppDeviceInfo(headers);
        const {
            deviceId,
            userAgent,
            deviceType,
            osVersion,
            appVersion,
            deviceName,
            latitude,
            longitude,
            networkProvider,
        } = deviceInfo;

        if (!deviceId) {
            return;
        }

        // Check if device already exists
        const existingDevice = await prisma.deviceSession.findUnique({
            where: { userId_deviceId: { userId, deviceId } },
        });

        if (existingDevice) {
            return; // Device already registered
        }

        const deviceCount = await prisma.deviceSession.count({
            where: { userId },
        });

        if (deviceCount >= this.MAX_DEVICES) {
            throw new ForbiddenException(
                `Maximum of ${this.MAX_DEVICES} devices allowed. Please remove a device first.`,
            );
        }

        const location = await this.getGeocodedLocation(
            latitude,
            longitude,
            ipAddress,
        );

        await prisma.deviceSession.create({
            data: {
                userId,
                deviceId,
                deviceType,
                deviceName,
                osVersion,
                appVersion,
                userAgent,
                ipAddress,
                location,
                networkProvider,
                isTrusted: true,
                verifiedAt: new Date(),
            },
        });
    }

    static async handleLoginDevice({
        userId,
        email,
        fullname,
        headers,
        ipAddress,
    }: DevicePayload) {
        const deviceId = headers["device-id"] as string;
        if (!deviceId) {
            throw new BadRequestException("Device-Id header is required");
        }

        // Check if device exists
        const existingDevice = await prisma.deviceSession.findUnique({
            where: { userId_deviceId: { userId, deviceId } },
        });

        if (!existingDevice) {
            const deviceCount = await prisma.deviceSession.count({
                where: { userId },
            });

            if (deviceCount >= this.MAX_DEVICES) {
                throw new ForbiddenException(
                    `Maximum of ${this.MAX_DEVICES} devices allowed. Please remove a device from your account settings.`,
                );
            }

            const deviceInfo = this.extractAppDeviceInfo(headers);
            const location = await this.getGeocodedLocation(
                deviceInfo.latitude,
                deviceInfo.longitude,
                ipAddress,
            );

            const newDevice = await prisma.deviceSession.create({
                data: {
                    userId,
                    deviceId,
                    deviceType: deviceInfo.deviceType,
                    deviceName: deviceInfo.deviceName,
                    osVersion: deviceInfo.osVersion,
                    appVersion: deviceInfo.appVersion,
                    userAgent: deviceInfo.userAgent,
                    networkProvider: deviceInfo.networkProvider,
                    ipAddress,
                    location,
                    isTrusted: false,
                },
            });

            // Send device verification notification
            logger.info(
                `Sending device verification for user ${userId}, deviceId: ${deviceId}, email: ${email}`,
            );
            await publishToQueue({
                type: "DEVICE_VERIFICATION",
                payload: {
                    recipient: email,
                    fullname,
                    userId,
                    deviceId,
                    deviceInfo: {
                        ...deviceInfo,
                        location,
                    },
                    ipAddress,
                    timestamp: new Date().toISOString(),
                },
            });
            logger.info(`Device verification queued successfully for user ${userId}`);

            return { isNewDevice: true, deviceSessionId: newDevice.id };
        }

        // Check if existing device is untrusted
        if (!existingDevice.isTrusted) {
            const deviceInfo = this.extractAppDeviceInfo(headers);
            const location = await this.getGeocodedLocation(
                deviceInfo.latitude,
                deviceInfo.longitude,
                ipAddress,
            );

            // Update device info before resending verification
            await prisma.deviceSession.update({
                where: { id: existingDevice.id },
                data: {
                    lastLoginAt: new Date(),
                    ipAddress,
                    userAgent: deviceInfo.userAgent,
                    deviceType: deviceInfo.deviceType,
                    deviceName: deviceInfo.deviceName,
                    osVersion: deviceInfo.osVersion,
                    appVersion: deviceInfo.appVersion,
                    networkProvider: deviceInfo.networkProvider,
                    location,
                },
            });

            // Resend verification notification
            await publishToQueue({
                type: "DEVICE_VERIFICATION",
                payload: {
                    recipient: email,
                    fullname,
                    userId,
                    deviceId,
                    deviceInfo: {
                        ...deviceInfo,
                        location,
                    },
                    ipAddress,
                    timestamp: new Date().toISOString(),
                },
            });

            return { isNewDevice: true, deviceSessionId: existingDevice.id };
        }

        const deviceInfo = this.extractAppDeviceInfo(headers);
        const location = await this.getGeocodedLocation(
            deviceInfo.latitude,
            deviceInfo.longitude,
            ipAddress,
        );

        // Update existing trusted device with latest info
        await prisma.deviceSession.update({
            where: { id: existingDevice.id },
            data: {
                lastLoginAt: new Date(),
                ipAddress,
                userAgent: deviceInfo.userAgent,
                deviceType: deviceInfo.deviceType,
                deviceName: deviceInfo.deviceName,
                osVersion: deviceInfo.osVersion,
                appVersion: deviceInfo.appVersion,
                networkProvider: deviceInfo.networkProvider,
                location,
            },
        });

        return { isNewDevice: false, deviceSessionId: existingDevice.id };
    }

    // Get user's devices
    static async getUserDevices(userId: string) {
        return prisma.deviceSession.findMany({
            where: { userId },
            select: {
                id: true,
                deviceId: true,
                deviceType: true,
                deviceName: true,
                osVersion: true,
                appVersion: true,
                location: true,
                isTrusted: true,
                networkProvider: true,
                lastLoginAt: true,
                verifiedAt: true,
                createdAt: true,
            },
            orderBy: { lastLoginAt: "desc" },
        });
    }

    static async verifyDevice(userId: string, deviceId: string) {
        const device = await prisma.deviceSession.findUnique({
            where: { userId_deviceId: { userId, deviceId } },
        });

        if (!device) {
            throw new NotFoundException("Device not found");
        }

        return prisma.deviceSession.update({
            where: { id: device.id },
            data: {
                isTrusted: true,
                verifiedAt: new Date(),
            },
        });
    }

    // Remove device
    static async removeDevice(userId: string, deviceId: string) {
        const device = await prisma.deviceSession.findUnique({
            where: { userId_deviceId: { userId, deviceId } },
        });

        if (!device) {
            throw new NotFoundException("Device not found");
        }

        await prisma.deviceSession.delete({
            where: { id: device.id },
        });

        return { message: "Device removed successfully" };
    }
}
