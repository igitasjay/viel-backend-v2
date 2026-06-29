import { Request, Response } from "express";
import { prisma } from "@shared/db/prisma";
import { logger } from "@/lib/winston";
import { withPagination } from "@shared/utils/pagination";
import { uploadMultipleToCloudinary } from "@/utils/cloudinary.utils";
import { httpStatus } from "@/shared/exceptions/statusCodes";
import { Asyncly } from "@shared/extensions/asyncly";
import { giftCardSellingService } from "../services/sell-giftcard.service";
import { giftCardValidation } from "../giftcard.validation";
import { RESPONSE_MESSAGES } from "../constants";
import { GiftCardSaleListItemDTO } from "../giftcard.dto";
import { BadRequestException } from "@shared/exceptions/exceptions";
import { publishToQueue } from "@shared/workers/publisher";

const getAcceptedCards = Asyncly(async (req: Request, res: Response) => {
    logger.info(`User ${req.currentUser?.id} fetching accepted gift cards`);

    const cards = await giftCardSellingService.getAcceptedCards();

    res.status(httpStatus.OK).json({
        success: true,
        message: RESPONSE_MESSAGES.GIFTCARD.ACCEPTED_CARDS_FETCHED,
        data: {
            cards,
            total: cards.length,
        },
    });
});

const getAcceptedCardById = Asyncly(async (req: Request, res: Response) => {
    const { acceptedCardId } = req.params;
    const userId = req.currentUser!.id;

    logger.info(`User ${userId} fetching accepted card ${acceptedCardId}`);

    const card =
        await giftCardSellingService.getAcceptedCardByIdForUser(acceptedCardId as string);

    res.status(httpStatus.OK).json({
        success: true,
        message: "Accepted card details retrieved successfully",
        data: card,
    });
});

const getSellExchangeRate = Asyncly(async (req: Request, res: Response) => {
    const { acceptedCardId } = req.params;
    const userId = req.currentUser!.id;

    logger.info(
        `User ${userId} fetching exchange rate for accepted card ${acceptedCardId}`,
    );

    const exchangeRate =
        await giftCardSellingService.getSellExchangeRate(acceptedCardId as string);

    res.status(httpStatus.OK).json({
        success: true,
        message: "Exchange rate retrieved successfully",
        data: exchangeRate,
    });
});

const calculateRates = Asyncly(async (req: Request, res: Response) => {
    const validatedData = giftCardValidation.calculateRateSchema.parse(req.body);
    const userId = req.currentUser!.id;

    logger.info(`User ${userId} calculating Giftcard Rates:`, {
        acceptedCardId: validatedData.acceptedCardId,
        cardValue: validatedData.cardValue,
    });
    const result = await giftCardSellingService.calculateRates(validatedData);

    res.status(httpStatus.OK).json({
        success: true,
        message: RESPONSE_MESSAGES.GIFTCARD.RATE_CALCULATED,
        data: result,
    });
});

const calculatePayout = Asyncly(async (req: Request, res: Response) => {
    const validatedData = giftCardValidation.calculateSalePayoutSchema.parse(
        req.body,
    );
    const userId = req.currentUser!.id;

    logger.info(`User ${userId} calculating sale payout:`, {
        acceptedCardId: validatedData.acceptedCardId,
        cardValue: validatedData.cardValue,
        quantity: validatedData.quantity,
    });

    const result =
        await giftCardSellingService.calculateSalePayout(validatedData);

    res.status(httpStatus.OK).json({
        success: true,
        message: RESPONSE_MESSAGES.GIFTCARD.SALE_CALCULATED,
        data: result,
    });
});

const submitSale = Asyncly(async (req: Request, res: Response) => {
    const userId = req.currentUser!.id;

    if (!req.files || (req.files as Express.Multer.File[]).length === 0) {
        throw new BadRequestException("At least 1 image is required");
    }

    const files = req.files as Express.Multer.File[];

    if (files.length > 10) {
        throw new BadRequestException("Maximum 10 images allowed");
    }

    logger.info(`User ${userId} - ALL raw body fields received:`, {
        allFields: Object.keys(req.body),
        bodyContent: req.body,
    });

    const bodyData = {
        acceptedCardId: req.body.acceptedCardId?.trim() || undefined,
        cardRange: req.body.cardRange?.trim() || undefined,
        receiptType: req.body.receiptType?.trim() || undefined,
        cardValue: req.body.cardValue ? parseFloat(req.body.cardValue) : undefined,
        quantity: req.body.quantity ? parseInt(req.body.quantity) : undefined,
        calculatedPayout: req.body.calculatedPayout
            ? parseFloat(req.body.calculatedPayout)
            : undefined,
        cardCode: req.body.cardCode?.trim() || undefined,
        cardPin: req.body.cardPin?.trim() || undefined,
        userNotes: req.body.userNotes?.trim() || undefined,
        promoCode: req.body.promoCode?.trim() || undefined,
    };

    logger.info(`User ${userId} submitting gift card for sale - raw body:`, {
        acceptedCardId: req.body.acceptedCardId,
        cardRange: req.body.cardRange,
        receiptType: req.body.receiptType,
        cardValue: req.body.cardValue,
        quantity: req.body.quantity,
        calculatedPayout: req.body.calculatedPayout,
        cardCode: req.body.cardCode ? "[REDACTED]" : undefined,
        cardPin: req.body.cardPin ? "[REDACTED]" : undefined,
        filesCount: files.length,
    });

    const validatedData = giftCardValidation.submitSaleSchema.parse(bodyData);

    logger.info(`User ${userId} submitting gift card for sale - validated:`, {
        acceptedCardId: validatedData.acceptedCardId,
        cardRange: validatedData.cardRange,
        receiptType: validatedData.receiptType,
        quantity: validatedData.quantity,
        filesCount: files.length,
    });

    const imageUrls = await uploadMultipleToCloudinary(files, userId);

    logger.info(`Uploaded ${imageUrls.length} images for user ${userId}`);

    const result = await giftCardSellingService.submitSale(
        validatedData,
        userId,
        imageUrls,
    );

    res.status(httpStatus.CREATED).json({
        success: true,
        message: RESPONSE_MESSAGES.GIFTCARD.SALE_SUBMITTED,
        data: result,
    });

    setImmediate(async () => {
        try {
            const estimatedReviewTime = "20 minutes";
            await publishToQueue({
                type: "NOTIFICATION_EVENT",
                payload: {
                    userId,
                    notificationType: "GIFTCARD",
                    // priority: "high",
                    title: "Gift Card Submitted for Review",
                    message: `Your ${result.cardType} gift card (${result.quantity}x ${result.cardCurrency
                        }${result.cardValue
                        }) has been submitted for review. You'll receive ₦${Number(
                            result.payoutAmount,
                        ).toLocaleString()} once approved.`,
                    metadata: {
                        saleId: result.id,
                        cardType: result.cardType,
                        country: result.country,
                        cardRange: result.cardRange,
                        cardValue: result.cardValue,
                        cardCurrency: result.cardCurrency,
                        quantity: result.quantity,
                        receiptType: result.receiptType,
                        payoutAmount: result.payoutAmount,
                        buyingRate: result.buyingRate,
                        estimatedReviewTime,
                        status: result.status,
                        submittedAt: result.createdAt,
                        action: "giftcard_sale_submitted",
                    },
                    deliveryChannels: ["push"],
                },
            });
            logger.info(`Sale submission notification queued for user ${userId}`, {
                saleId: result.id,
            });

            // const user = await prisma.user.findUnique({
            //   where: { id: userId },
            //   select: { email: true, fullname: true },
            // });

            // if (user?.email) {
            //   await publishToQueue({
            //     type: "GIFTCARD_SUBMITTED",
            //     payload: {
            //       userId,
            //       recipient: user.email,
            //       fullName: user.fullname,
            //       saleDetails: {
            //         saleId: result.id,
            //         cardType: result.cardType,
            //         country: result.country,
            //         cardRange: result.cardRange,
            //         cardValue: result.cardValue,
            //         cardCurrency: result.cardCurrency,
            //         quantity: result.quantity,
            //         receiptType: result.receiptType,
            //         payoutAmount: result.payoutAmount,
            //         buyingRate: result.buyingRate,
            //         submittedAt: result.createdAt,
            //       },
            //     },
            //   });

            //   logger.info(`Sale submission email queued for user ${userId}`);
            // }
        } catch (error) {
            logger.error("Failed to queue sale submission email:", { error, userId });
        }
    });
});

const getSales = Asyncly(async (req: Request, res: Response) => {
    const userId = req.currentUser!.id;
    const { status } = req.query;

    const whereClause: any = { userId };

    if (status) {
        whereClause.status = status;
    }

    const result = await withPagination<GiftCardSaleListItemDTO>({
        model: "giftcardSales",
        req,
        res,
        where: whereClause,
        transform: (sale) => new GiftCardSaleListItemDTO(sale),
        additional: {
            message: RESPONSE_MESSAGES.GIFTCARD.SALES_FETCHED,
        },
    });

    logger.info(`User ${userId} retrieved sale history`, {
        page: result.pagination.currentPage,
        total: result.pagination.totalItems,
    });

    res.status(httpStatus.OK).json(result);
});

const getSale = Asyncly(async (req: Request, res: Response) => {
    const { saleId } = req.params;
    const userId = req.currentUser!.id;

    logger.info(`User ${userId} requesting sale ${saleId}`);

    const sale = await giftCardSellingService.getUserSaleById(saleId as string, userId);

    res.status(httpStatus.OK).json({
        success: true,
        message: RESPONSE_MESSAGES.GIFTCARD.SALE_FETCHED,
        data: sale,
    });
});

const cancelSale = Asyncly(async (req: Request, res: Response) => {
    const { saleId } = req.params;
    const userId = req.currentUser!.id;

    logger.info(`User ${userId} cancelling sale ${saleId}`);

    await giftCardSellingService.cancelSale(saleId as string, userId);

    res.status(httpStatus.OK).json({
        success: true,
        message: RESPONSE_MESSAGES.GIFTCARD.SALE_CANCELLED,
        data: {
            saleId,
        },
    });

    setImmediate(async () => {
        try {
            await publishToQueue({
                type: "NOTIFICATION_EVENT",
                payload: {
                    userId,
                    notificationType: "GIFTCARD",
                    priority: "low",
                    title: "Sale Cancelled",
                    message: `Your gift card sale has been cancelled.`,
                    metadata: {
                        saleId,
                        action: "giftcard_sale_cancelled",
                    },
                    deliveryChannels: ["in_app", "push"],
                },
            });

            const user = await prisma.user.findUnique({
                where: { id: userId },
                select: { email: true, fullname: true },
            });

            if (user?.email) {
                await publishToQueue({
                    type: "GIFTCARD_SALE_CANCELLED",
                    payload: {
                        userId,
                        recipient: user.email,
                        fullName: user.fullname,
                        cancellationDetails: {
                            saleId,
                            cancelledAt: new Date().toISOString(),
                        },
                    },
                });

                logger.info(`Sale cancellation email queued for user ${userId}`);
            }
        } catch (error) {
            logger.error("Failed to queue cancellation notification:", {
                error,
                userId,
                saleId,
            });
        }
    });
});

export const giftcardSellController = {
    getAcceptedCards,
    getAcceptedCardById,
    getSellExchangeRate,
    calculateRates,
    calculatePayout,
    submitSale,
    getSales,
    getSale,
    cancelSale,
};
