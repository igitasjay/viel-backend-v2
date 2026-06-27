
import { prisma } from "@/shared/db/prisma";
import { OtpAction } from "@prisma/client";

export async function findUserSecurity(userId: string) {
    return prisma.userSecurity.findFirst({ where: { userId } });
}

export async function updateOrCreateOtp(
    userId: string,
    otp: string,
    expiresAt: Date,
    action: OtpAction,
    sentTo: string,
    _deviceId?: string,
) {
    const existing = await prisma.userSecurity.findFirst({ where: { userId } });

    if (!existing) {
        return prisma.userSecurity.create({
            data: {
                userId,
                code: otp,
                createdAt: new Date(),
                expiresAt,
                sentTo,
                action,
                retryCount: 1,
            },
        });
    }

    await prisma.userSecurity.updateMany({
        where: { userId },
        data: {
            code: otp,
            createdAt: new Date(),
            expiresAt,
            sentTo,
            action,
            retryCount: { increment: 1 },
        },
    });

    return prisma.userSecurity.findFirst({ where: { userId } });
}

export async function clearOtp(userId: string, action: OtpAction) {
    return prisma.userSecurity.updateMany({
        where: { userId, action },
        data: {
            code: null,
            createdAt: new Date(),
            expiresAt: null,
            sentTo: null,
            action: null,
            lockedUntil: null,
            retryCount: 0,
        },
    });
}
