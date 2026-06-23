import {
    NotFoundException,
    BadRequestException,
    InternalServerErrorException,
} from "@/shared/exceptions/exceptions";
import { logger } from "@/lib/winston";
import { reloadlyService } from "@/externals/reloadly/reloadly";
import { encrypt } from "@/shared/utils/encryption";
import { prisma } from "@/shared/db/prisma";
import { RESPONSE_MESSAGES } from "../constants";


class GiftCardService {
    async getProductExchangeRate(reloadlyId: string): Promise<{
        reloadlyId: string;
        productName: string;
        exchangeRate: number;
        denominationType: string;
        fixedDenominations?: number[];
        minAmount?: number;
        maxAmount?: number;
        recipientCurrency: string;
        senderCurrency: string;
        lastUpdated: Date;
    }> {
        const product = await prisma.giftcardProducts.findUnique({
            where: { reloadlyId: reloadlyId },
        });

        if (!product) {
            throw new NotFoundException(RESPONSE_MESSAGES.ERRORS.PRODUCT_NOT_FOUND);
        }

        if (!product.isActive) {
            throw new BadRequestException(
                RESPONSE_MESSAGES.ERRORS.PRODUCT_UNAVAILABLE,
            );
        }

        let reloadlyData = product.reloadlyData as any;

        const hoursSinceSync =
            (new Date().getTime() - product.updatedAt.getTime()) / (1000 * 60 * 60);

        if (hoursSinceSync > GIFTCARD_CONSTRAINTS.STALENESS_CHECK_HOURS) {
            logger.warn(
                `Product ${reloadlyId} is stale (${hoursSinceSync.toFixed(
                    1,
                )} hours old). Fetching fresh rate...`,
            );

            const freshProductData = await reloadlyService.getProductById(reloadlyId);

            if (freshProductData) {
                await prisma.giftcardProducts.update({
                    where: { reloadlyId: reloadlyId },
                    data: {
                        reloadlyData: freshProductData,
                        updatedAt: new Date(),
                    },
                });

                reloadlyData = freshProductData;
                logger.info(`Using fresh rate for product ${reloadlyId}`);
            } else {
                logger.warn(
                    `Failed to fetch fresh data for product ${reloadlyId}. Using stored data.`,
                );
            }
        }

        const denominationType = reloadlyData.denominationType;
        const exchangeRate =
            reloadlyData.recipientCurrencyToSenderCurrencyExchangeRate || 1700;

        const response: any = {
            reloadlyId: product.reloadlyId,
            productName: product.name,
            exchangeRate,
            denominationType,
            recipientCurrency: reloadlyData.recipientCurrencyCode || product.currency,
            senderCurrency: reloadlyData.senderCurrencyCode || "NGN",
            lastUpdated: product.updatedAt,
        };

        if (denominationType === "FIXED") {
            response.fixedDenominations =
                reloadlyData.fixedRecipientDenominations || [];
            response.fixedDenominationsMap =
                reloadlyData.fixedRecipientToSenderDenominationsMap || {};
        } else if (denominationType === "RANGE") {
            response.minAmount = reloadlyData.minRecipientDenomination;
            response.maxAmount = reloadlyData.maxRecipientDenomination;
        }

        logger.info(`Exchange rate fetched for product ${reloadlyId}:`, {
            exchangeRate,
            denominationType,
            lastUpdated: product.updatedAt,
        });

        return response;
    }
}