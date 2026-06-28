import {
    BadRequestException,
    ForbiddenException,
    UnauthorizedException,
} from "@shared/exceptions/exceptions";
import { prisma } from "@shared/db/prisma";
import { logger } from "@/lib/winston";
import { AuthTokens } from "@shared/guards/hash";
import { TokenService } from "@/shared/guards/tokens";
import { PIN_MAX_ATTEMPTS, PIN_LOCK_DURATION } from "./constants";

export const useTransactionPin = async (
    userId: string,
    enteredPin: string,
    accessToken?: string,
) => {
    if (!enteredPin) {
        throw new BadRequestException("Transaction PIN is required");
    }
    logger.info(`User ${userId} is attempting to use a transaction PIN.`);
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
            isVerified: true,
            security: {
                select: {
                    accountPin: true,
                    failedPinAttempts: true,
                    lockedUntil: true,
                    isPinSet: true,
                },
            },
        },
    });
    if (!user) {
        throw new UnauthorizedException("User not authenticated.");
    }
    if (!user.isVerified) {
        throw new ForbiddenException(
            "Please verify your account before using  transaction PIN.",
        );
    }

    if (!user.security?.isPinSet) {
        throw new BadRequestException("Transaction PIN not set");
    }
    if (!user.security.accountPin) {
        throw new BadRequestException("Transaction PIN is required or invalid Pin");
    }

    logger.info(`Comparing PIN for user ${userId}`);
    const isMatch = await AuthTokens.comparePin(
        enteredPin,
        user.security.accountPin,
    );

    if (!isMatch) {
        const updatedAttempts = (user.security.failedPinAttempts ?? 0) + 1;
        const isLocked = updatedAttempts >= PIN_MAX_ATTEMPTS;

        await prisma.userSecurity.update({
            where: { userId: userId },
            data: {
                failedPinAttempts: updatedAttempts,
                lockedUntil: isLocked ? new Date(Date.now() + PIN_LOCK_DURATION) : null,
            },
        });

        if (isLocked) {
            logger.info(`entered locked attempts ${userId}`);
            if (accessToken) {
                await TokenService.invalidateTokens(userId, accessToken);
                logger.info(
                    `Tokens invalidated for user ${userId} due to too many PIN attempts`,
                );
            } else {
                logger.warn(`no token parsed`);
            }

            throw new ForbiddenException(
                "Too many incorrect attempts. You have been signed out.",
            );
        }

        throw new BadRequestException(
            `Incorrect PIN. ${PIN_MAX_ATTEMPTS - updatedAttempts} attempt(s) remaining.`,
        );
    }

    // Reset failed attempts on successful PIN entry
    await prisma.userSecurity.update({
        where: { userId: userId },
        data: { failedPinAttempts: 0, lockedUntil: null },
    });

    logger.info(`User PIN verified successfully for user ${userId}`);
    return true;
};
