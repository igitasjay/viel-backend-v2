
import { Request, Response } from "express";
import { Asyncly } from "@shared/extensions/asyncly";
import { prisma } from "@/shared/db/prisma";
import { httpStatus } from "@shared/exceptions/statusCodes";
import { logger } from "@/lib/winston";
// import { publishToQueue } from "@/shared/workers";
import { RESPONSE_MESSAGES } from "../constants";
import { giftCardValidation } from "../giftcard.validation";
// import { withPagination } from "@/shared/helpers/pagination";
import { giftCardService } from "../services/buy-giftcard.service";
import { decrypt } from "@/shared/utils/encryption";
import { withPagination } from "@/shared/utils/pagination";
import { createDisplayName } from "@/shared/helpers/giftcard-displayname";
import { publishToQueue } from "@/shared/workers/publisher";

const getMinMaxAmounts = (
    reloadlyData: any,
): { minAmount: number | null; maxAmount: number | null } => {
    const isFixedProduct = reloadlyData?.denominationType === "FIXED";
    const fixedDenominations = reloadlyData?.fixedRecipientDenominations;

    if (
        isFixedProduct &&
        Array.isArray(fixedDenominations) &&
        fixedDenominations.length > 0
    ) {
        return {
            minAmount: Math.min(...fixedDenominations),
            maxAmount: Math.max(...fixedDenominations),
        };
    }

    return {
        minAmount: reloadlyData?.minRecipientDenomination || null,
        maxAmount: reloadlyData?.maxRecipientDenomination || null,
    };
};

const ALLOWED_COUNTRIES = [
    { code: "NG", name: "Nigeria" },
    { code: "CA", name: "Canada" },
    { code: "US", name: "United States" },
    { code: "GB", name: "United Kingdom" },
    { code: "DE", name: "Germany" },
    { code: "FR", name: "France" },
];

const getCountries = Asyncly(async (_req: Request, res: Response) => {
    const allowedCodes = ALLOWED_COUNTRIES.map((c) => c.code);

    const countries = await prisma.giftcardProducts.findMany({
        where: {
            isActive: true,
            countryCode: { in: allowedCodes },
        },
        select: {
            countryCode: true,
        },
        distinct: ["countryCode"],
    });

    const availableCodes = new Set(countries.map((c) => c.countryCode));

    const orderedCountries = ALLOWED_COUNTRIES.filter((c) =>
        availableCodes.has(c.code),
    );

    logger.info(
        `Retrieved ${orderedCountries.length} countries with active products`,
    );

    res.status(httpStatus.OK).json({
        success: true,
        message: "Countries retrieved successfully",
        data: {
            countries: orderedCountries,
            total: orderedCountries.length,
        },
    });
});

const getProducts = Asyncly(async (req: Request, res: Response) => {
    const { country, search, reloadlyId } = req.query;

    const whereClause: any = {
        isActive: true,
    };

    if (reloadlyId) {
        whereClause.reloadlyId = reloadlyId as string;
    } else if (search) {
        whereClause.name = {
            contains: search as string,
            mode: "insensitive",
        };
    }

    if (country) {
        whereClause.countryCode = country;
    }

    const feeConfig = await prisma.feeConfiguration.findFirst({
        where: {
            type: "GIFTCARD_BUY",
            isActive: true,
        },
    });

    const feePercentage =
        feeConfig?.feeType === "PERCENTAGE" ? Number(feeConfig.feeValue) : 2;

    const result = await withPagination({
        model: "giftcardProducts",
        req,
        res,
        sortOrder: "asc",
        where: whereClause,
        transform: (product) => {
            const reloadlyData = product.reloadlyData as any;
            const { minAmount, maxAmount } = getMinMaxAmounts(reloadlyData);

            return {
                id: product.id,
                reloadlyId: product.reloadlyId,
                name: product.name,
                displayName: createDisplayName(product.name),
                country: product.country,
                countryCode: product.countryCode,
                currency: product.currency,
                imageUrl: product.imageUrl,
                denominationType: reloadlyData?.denominationType || "RANGE",
                fixedDenominations: reloadlyData?.fixedRecipientDenominations || null,
                minAmount,
                maxAmount,
                exchangeRate:
                    reloadlyData?.recipientCurrencyToSenderCurrencyExchangeRate || 1700,
                feePercentage: feePercentage,
                lastRateUpdate: product.updatedAt.toISOString(),
                redeemInstructions: {
                    concise: reloadlyData?.redeemInstruction?.concise || null,
                    verbose: reloadlyData?.redeemInstruction?.verbose || null,
                },
                brand: reloadlyData?.brand || null,
            };
        },
        additional: {
            message: RESPONSE_MESSAGES.GIFTCARD.PRODUCTS_FETCHED,
        },
    });

    res.status(httpStatus.OK).json(result);
});

const getSingleProduct = Asyncly(async (req: Request, res: Response) => {
    const { reloadlyId } = req.params;

    const product = await prisma.giftcardProducts.findUnique({
        where: {
            reloadlyId: reloadlyId,
            isActive: true,
        },
        select: {
            id: true,
            reloadlyId: true,
            name: true,
            country: true,
            countryCode: true,
            currency: true,
            denomination: true,
            minAmount: true,
            maxAmount: true,
            imageUrl: true,
            reloadlyData: true,
            updatedAt: true,
        },
    });

    if (!product) {
        throw new Error(RESPONSE_MESSAGES.ERRORS.PRODUCT_NOT_FOUND);
    }

    const feeConfig = await prisma.feeConfiguration.findFirst({
        where: {
            type: "GIFTCARD_BUY",
            isActive: true,
        },
    });

    const feePercentage =
        feeConfig?.feeType === "PERCENTAGE" ? Number(feeConfig.feeValue) : 2;

    const reloadlyData = product.reloadlyData as any;
    const { minAmount, maxAmount } = getMinMaxAmounts(reloadlyData);

    const transformedProduct = {
        id: product.id,
        reloadlyId: product.reloadlyId,
        name: product.name,
        displayName: createDisplayName(product.name),
        country: product.country,
        countryCode: product.countryCode,
        currency: product.currency,
        imageUrl: product.imageUrl,
        denominationType: reloadlyData?.denominationType || "RANGE",
        fixedDenominations: reloadlyData?.fixedRecipientDenominations || null,
        minAmount,
        maxAmount,
        exchangeRate:
            reloadlyData?.recipientCurrencyToSenderCurrencyExchangeRate || 1700,
        feePercentage: feePercentage,
        lastRateUpdate: product.updatedAt.toISOString(),
        redeemInstructions: {
            concise: reloadlyData?.redeemInstruction?.concise || null,
            verbose: reloadlyData?.redeemInstruction?.verbose || null,
        },
        brand: reloadlyData?.brand || null,
    };

    logger.info(`Product ${reloadlyId} retrieved by user ${req.currentUser?.id}`);

    res.status(httpStatus.OK).json({
        success: true,
        message: "Product details retrieved successfully",
        data: transformedProduct,
    });
});

const getExchangeRate = Asyncly(async (req: Request, res: Response) => {
    const { reloadlyId } = req.params;

    logger.info(`Exchange rate requested for product ${reloadlyId}`);

    const result = await giftCardService.getProductExchangeRate(reloadlyId);

    res.status(httpStatus.OK).json({
        success: true,
        message: "Exchange rate retrieved successfully",
        data: result,
    });
});

const placeOrder = Asyncly(async (req: Request, res: Response) => {
    const validatedData = req.body;
    const userId = req.currentUser!.id;
    const reqToken = req.accessToken;

    logger.info(`Gift card order requested by user ${userId}:`, {
        reloadlyId: validatedData.reloadlyId,
        cardValue: validatedData.cardValue,
        quantity: validatedData.quantity,
        calculatedTotal: validatedData.calculatedTotal,
        currency: validatedData.currency,
        paymentMethod: validatedData.paymentMethod,
        userAgent: req.headers["user-agent"],
    });

    const result = await giftCardService.placeDirectOrder(
        validatedData,
        userId,
        req.currentUser?.name,
        req.currentUser?.email,
        reqToken,
    );

    res.status(httpStatus.CREATED).json({
        success: true,
        message: RESPONSE_MESSAGES.GIFTCARD.ORDER_PLACED,
        data: result,
    });

    setImmediate(async () => {
        try {
            const notificationMessage =
                result.status === "SUCCESS"
                    ? `Your ${result.productName} gift card (${result.quantity}x ${result.cardValue}) is ready! 🎁`
                    : `Your ${result.productName} gift card order is processing. You'll be notified when codes are ready. ⏳`;

            await publishToQueue({
                type: "NOTIFICATION_EVENT",
                payload: {
                    userId,
                    notificationType: "GIFTCARD",
                    priority: result.status === "SUCCESS" ? "high" : "low",
                    title:
                        result.status === "SUCCESS"
                            ? "Gift Card Ready! 🎁"
                            : "Order Processing ⏳",
                    message: notificationMessage,
                    metadata: {
                        orderId: result.orderId,
                        orderReference: result.orderReference,
                        productName: result.productName,
                        totalAmount: result.totalAmount,
                        status: result.status,
                        action: "giftcard_order",
                    },
                    deliveryChannels: ["in_app, push"],
                },
            });
            logger.info(`Giftcard Order notification queued for user ${userId}`, {
                orderId: result.orderId,
                status: result.status,
            });

            const user = await prisma.user.findUnique({
                where: { id: userId },
                select: { email: true, fullname: true },
            });

            if (user?.email) {
                const orderCodes = await prisma.giftcardCodes.findMany({
                    where: { transactionId: result.orderId },
                });

                const decryptedCodes = orderCodes.map((code) => {
                    try {
                        return {
                            code: decrypt(code.encryptedCode),
                            pin: code.encryptedPin ? decrypt(code.encryptedPin) : null,
                            redemptionUrl: code.redemptionUrl,
                        };
                    } catch (error) {
                        logger.error(`Failed to decrypt code ${code.id}:`, { error });
                        return {
                            code: "DECRYPTION_FAILED",
                            pin: null,
                            redemptionUrl: code.redemptionUrl,
                        };
                    }
                });

                await publishToQueue({
                    type: "GIFTCARD_PURCHASED",
                    payload: {
                        userId,
                        recipient: user.email,
                        fullName: user.fullname,
                        orderDetails: {
                            orderId: result.orderId,
                            orderReference: result.orderReference,
                            productName: result.productName,
                            quantity: result.quantity,
                            cardValue: result.cardValue,
                            totalAmount: result.totalAmount,
                            status: result.status,
                            purchasedAt: new Date().toISOString(),
                            codes: decryptedCodes,
                        },
                    },
                });
                logger.info(
                    `Purchase email queued for user ${userId} with ${decryptedCodes.length} codes`,
                );
            }
        } catch (error) {
            logger.error("Failed to queue purchase email:", { error, userId });
        }
    });
});

const refreshOrderCodes = Asyncly(async (req: Request, res: Response) => {
    const { transactionId } = req.params;
    const userId = req.currentUser!.id;

    logger.info(
        `User ${userId} requesting code refresh for order ${transactionId}`,
    );
    const result = await giftCardService.refreshCodes(transactionId, userId);

    res.status(httpStatus.OK).json({
        success: true,
        message: result.message,
        data: {
            transactionId,
            codesDelivered: result.codesDelivered,
        },
    });
});

export const giftcardController = {
    getCountries,
    getProducts,
    getSingleProduct,
    getExchangeRate,
    placeOrder,
    refreshOrderCodes,
};
