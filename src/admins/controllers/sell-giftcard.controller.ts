import { Request, Response } from "express";
import { Prisma } from "@prisma/client";
import { logger } from "@/lib/winston";
import { httpStatus, } from "@shared/exceptions/statusCodes";
import { withPagination } from "@/shared/utils/pagination";
import { decrypt } from "@/shared/utils/encryption";
import { Asyncly } from "@shared/extensions/asyncly";
import { giftCardSellingService } from "../services/admin-giftcard.service";
import { giftCardValidation } from "../validations/giftcard.validation";
import { RESPONSE_MESSAGES } from "../constants/constants";
import { prisma } from "@shared/db/prisma";
import { publishToQueue } from "@shared/workers/publisher";
import { sendGiftcardSaleApprovedandPayoutEmail } from "../../externals";
import {
    NotFoundException,
    BadRequestException,
    InternalServerErrorException,
} from '@/shared/exceptions/exceptions'
import { GiftCardSaleListItemDTO, GiftCardSaleDetailDTO } from '@/admins/dtos/giftcard.dto'
import { v2 as cloudinary } from "cloudinary";

const getAllAcceptedCards = Asyncly(async (req: Request, res: Response) => {
    const { isActive } = req.query;

    const whereClause: any = {};

    if (isActive !== undefined) {
        whereClause.isActive = isActive === "true";
    }

    const result = await withPagination({
        model: "acceptedGiftCard",
        req,
        res,
        where: whereClause,
    });

    logger.info(`Admin ${req.currentAdmin?.id} fetched accepted cards`, {
        page: result.pagination.currentPage,
        total: result.pagination.totalItems,
    });

    res.status(httpStatus.OK).json({
        success: true,
        message: RESPONSE_MESSAGES.GIFTCARD.ACCEPTED_CARDS_FETCHED,
        data: result.results,
        pagination: result.pagination,
    });
});

const getAcceptedCard = Asyncly(async (req: Request, res: Response) => {
    const cardId = req.params.cardId as string;

    const card = await giftCardSellingService.getAcceptedCardById(cardId);

    res.status(httpStatus.OK).json({
        success: true,
        message: "Card details retrieved successfully",
        data: card,
    });
});

const createAcceptedCard = Asyncly(async (req: Request, res: Response) => {
    if (!req.file) {
        throw new BadRequestException("Gift card image is required");
    }

    let imageUrl: string;
    try {
        const uploadResult = await new Promise<string>((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
                {
                    resource_type: "image",
                    folder: "trade-aviator/accepted-giftcards",
                    transformation: [
                        { width: 500, height: 500, crop: "limit" },
                        { quality: "auto:good" },
                        { format: "jpg" },
                    ],
                    public_id: `giftcard_${Date.now()}`,
                    overwrite: true,
                },
                (error, result) => {
                    if (error) {
                        logger.error("Cloudinary upload error:", error);
                        reject(new InternalServerErrorException("Image upload failed"));
                    } else {
                        resolve(result!.secure_url);
                    }
                },
            );
            uploadStream.end(req.file!.buffer);
        });
        imageUrl = uploadResult;
        logger.info(`Image uploaded successfully: ${imageUrl}`);
    } catch (error) {
        logger.error("Failed to upload image to Cloudinary:", { error });
        throw new InternalServerErrorException("Failed to upload image");
    }

    // Parse JSON stringified fields from FormData
    const parsedBody = {
        ...req.body,
        availableRanges:
            typeof req.body.availableRanges === "string"
                ? JSON.parse(req.body.availableRanges)
                : req.body.availableRanges,
        receiptTypes:
            typeof req.body.receiptTypes === "string"
                ? JSON.parse(req.body.receiptTypes)
                : req.body.receiptTypes,
        rates:
            typeof req.body.rates === "string"
                ? JSON.parse(req.body.rates)
                : req.body.rates,
        isActive:
            typeof req.body.isActive === "string"
                ? JSON.parse(req.body.isActive)
                : req.body.isActive,
        imageUrl,
    };

    const validatedData =
        giftCardValidation.createAcceptedCardSchema.parse(parsedBody);

    logger.info(`Admin ${req.currentAdmin?.id} creating accepted card:`, {
        cardType: validatedData.cardType,
        country: validatedData.country,
    });

    const card = await giftCardSellingService.createAcceptedCard(validatedData);

    res.status(httpStatus.CREATED).json({
        success: true,
        message: RESPONSE_MESSAGES.GIFTCARD.CARD_ADDED,
        data: card,
    });
});

const updateAcceptedCard = Asyncly(async (req: Request, res: Response) => {
    const cardId = req.params.cardId as string;

    let imageUrl: string | undefined;
    if (req.file) {
        try {
            const uploadResult = await new Promise<string>((resolve, reject) => {
                const uploadStream = cloudinary.uploader.upload_stream(
                    {
                        resource_type: "image",
                        folder: "trade-aviator/accepted-giftcards",
                        transformation: [
                            { width: 500, height: 500, crop: "limit" },
                            { quality: "auto:good" },
                            { format: "jpg" },
                        ],
                        public_id: `giftcard_${Date.now()}`,
                        overwrite: true,
                    },
                    (error, result) => {
                        if (error) {
                            logger.error("Cloudinary upload error:", error);
                            reject(new InternalServerErrorException("Image upload failed"));
                        } else {
                            resolve(result!.secure_url);
                        }
                    },
                );
                uploadStream.end(req.file!.buffer);
            });
            imageUrl = uploadResult;
            logger.info(`Image uploaded successfully: ${imageUrl}`);
        } catch (error) {
            logger.error("Failed to upload image to Cloudinary:", { error });
            throw new InternalServerErrorException("Failed to upload image");
        }
    }

    // Parse JSON stringified fields from FormData if they exist
    const parsedBody: any = { ...req.body };

    if (
        req.body.availableRanges &&
        typeof req.body.availableRanges === "string"
    ) {
        parsedBody.availableRanges = JSON.parse(req.body.availableRanges);
    }
    if (req.body.receiptTypes && typeof req.body.receiptTypes === "string") {
        parsedBody.receiptTypes = JSON.parse(req.body.receiptTypes);
    }
    if (req.body.rates && typeof req.body.rates === "string") {
        parsedBody.rates = JSON.parse(req.body.rates);
    }
    if (req.body.isActive && typeof req.body.isActive === "string") {
        parsedBody.isActive = JSON.parse(req.body.isActive);
    }
    if (imageUrl) {
        parsedBody.imageUrl = imageUrl;
    }

    const validatedData =
        giftCardValidation.updateAcceptedCardSchema.parse(parsedBody);

    logger.info(`Admin ${req.currentAdmin?.id} updating accepted card ${cardId}`);

    const card = await giftCardSellingService.updateAcceptedCard(
        cardId,
        validatedData,
    );

    res.status(httpStatus.OK).json({
        success: true,
        message: RESPONSE_MESSAGES.GIFTCARD.CARD_UPDATED,
        data: card,
    });
});

const deleteAcceptedCard = Asyncly(async (req: Request, res: Response) => {
    const cardId = req.params.cardId as string;

    logger.info(`Admin ${req.currentAdmin?.id} deleting accepted card ${cardId}`);

    await giftCardSellingService.deleteAcceptedCard(cardId);

    res.status(httpStatus.OK).json({
        success: true,
        message: RESPONSE_MESSAGES.GIFTCARD.CARD_DELETED,
        data: {
            cardId,
        },
    });
});

const getAllSales = Asyncly(async (req: Request, res: Response) => {
    const { status, userId, cardType } = req.query;

    const whereClause: any = {
        category: "GIFTCARDS",
        meta: {
            path: ["giftcard"],
            equals: Prisma.DbNull,
        },
    };

    if (status) {
        whereClause.status = status;
    }

    if (userId) {
        whereClause.userId = userId;
    }

    if (cardType) {
        whereClause.cardType = {
            contains: cardType as string,
            mode: "insensitive",
        };
    }

    const result = await withPagination({
        model: "transaction",
        req,
        res,
        where: whereClause,
        transform: (sale) => new GiftCardSaleListItemDTO(sale),
    });

    logger.info(`Admin ${req.currentAdmin?.id} viewed sales list`, {
        page: result.pagination.currentPage,
        total: result.pagination.totalItems,
    });

    res.status(httpStatus.OK).json({
        success: true,
        message: "Sales fetched successfully",
        data: result.results,
        pagination: result.pagination,
    });
});

const getSale = Asyncly(async (req: Request, res: Response) => {
    const saleId = req.params.saleId as string;

    const transaction: any = await prisma.transaction.findFirst({
        where: {
            id: saleId,
            category: "GIFTCARDS",
        },
        include: {
            user: {
                select: {
                    id: true,
                    fullname: true,
                    email: true,
                },
            },
        },
    });

    if (!transaction) {
        throw new Error(RESPONSE_MESSAGES.ERRORS.SALE_NOT_FOUND);
    }

    const gcMeta = (transaction.meta as any)?.cardImages;

    if (!gcMeta) {
        throw new NotFoundException("Gift card metadata not found");
    }

    let decryptedCode: string | null = null;
    let decryptedPin: string | null = null;

    if (transaction.gcEncryptedCode) {
        try {
            decryptedCode = decrypt(transaction.gcEncryptedCode);
        } catch (error) {
            logger.error("Failed to decrypt card code:", error as any);
            decryptedCode = "DECRYPTION_FAILED";
        }
    }
    if (transaction.gcEncryptedPin) {
        try {
            decryptedPin = decrypt(transaction.gcEncryptedPin);
        } catch (error) {
            logger.error("Failed to decrypt card pin:", error as any);
            decryptedPin = "DECRYPTION_FAILED";
        }
    }

    logger.info(`Admin ${req.currentAdmin?.id} viewed sale ${saleId}`);

    res.status(httpStatus.OK).json({
        success: true,
        message: RESPONSE_MESSAGES.GIFTCARD.SALE_FETCHED,
        data: new GiftCardSaleDetailDTO(transaction, decryptedCode, decryptedPin),

        // data: GiftCardSaleDetailDTO({
        //   id: transaction.id,
        //   userId: transaction.userId,
        //   user: transaction.user,
        //   saleReference: transaction.meta?.giftcardSale?.saleReference || null,
        //   quantity: transaction.giftCardQuantity,
        //   payoutAmount: transaction.amount,
        //   cardType: transaction.giftCardType,
        //   cardValue: transaction.giftCardValue,
        //   cardRange: transaction.gcCardRange,
        //   country: transaction.gcCountry,
        //   receiptType: transaction.gcReceiptType,
        //   reviewNotes: transaction.reviewNotes,
        //   rejectionReason: transaction.rejectionReason,
        //   reviewedAt: transaction.reviewedAt,
        //   reviewedBy: transaction.reviewedBy,
        //   status: transaction.status,
        //   images: gcMeta,
        //   cardCode: decryptedCode,
        //   cardPin: decryptedPin,
        //   createdAt: transaction.createdAt,
        //   updatedAt: transaction.updatedAt,
        // },
    });
});

const reviewSale = Asyncly(async (req: Request, res: Response) => {
    const saleId = req.params.saleId as string;
    const adminId = req.currentAdmin!.id;

    logger.info(`Admin ${adminId} starting review of sale ${saleId}`);

    const sale = await giftCardSellingService.reviewSale(saleId, adminId);

    res.status(httpStatus.OK).json({
        success: true,
        message: RESPONSE_MESSAGES.GIFTCARD.SALE_REVIEWED,
        data: sale,
    });

    setImmediate(async () => {
        try {
            await publishToQueue({
                type: "NOTIFICATION_EVENT",
                payload: {
                    userId: sale.userid,
                    notificationType: "GIFTCARD",
                    priority: "medium",
                    title: "Gift Card Under Review",
                    message: `Your ${sale.cardType} gift card sale is now under review. We're verifying the details and will update you shortly.`,
                    metadata: {
                        saleId: sale.id,
                        cardType: sale.cardType,
                        status: sale.status,
                        action: "giftcard_sale_under_review",
                        reviewedAt: new Date().toISOString(),
                    },
                    deliveryChannels: ["push"],
                },
            });

            logger.info(
                `Sale under review notification queued for user ${sale.userid}`,
                {
                    saleId: sale.id,
                },
            );

            // const user = await prisma.user.findUnique({
            //   where: { id: sale.userId },
            //   select: { email: true, fullname: true },
            // });

            // if (user?.email) {
            //   await publishToQueue({
            //     type: "GIFTCARD_UNDER_REVIEW",
            //     payload: {
            //       userId: sale.userId,
            //       recipient: user.email,
            //       fullName: user.fullname,
            //       reviewDetails: {
            //         saleId: sale.id,
            //         cardType: sale.cardType,
            //         cardValue: sale.cardValue,
            //         quantity: sale.quantity,
            //         payoutAmount: sale.payoutAmount,
            //         reviewedAt: new Date().toISOString(),
            //       },
            //     },
            //   });

            //   logger.info(`Sale under review email queued for user ${sale.userId}`);
            // }
        } catch (error) {
            logger.error("Failed to send sale under review notification:", {
                error,
                userId: sale.userid,
            });
        }
    });
});

const processSalePayout = Asyncly(async (req: Request, res: Response) => {
    const validatedData = giftCardValidation.processSalePayout.parse({
        ...req.body,
    });
    const adminId = req.currentAdmin!.id;

    logger.info(`Admin ${adminId} approving sale ${validatedData.saleId}`);

    const { sale: saleDetails, transaction } =
        await giftCardSellingService.processSalePayout(
            validatedData.saleId,
            adminId,
            validatedData.reviewNotes,
        );

    res.status(httpStatus.OK).json({
        success: true,
        message: RESPONSE_MESSAGES.GIFTCARD.SALE_APPROVED,
        data: saleDetails,
    });

    setImmediate(async () => {
        try {
            await publishToQueue({
                type: "NOTIFICATION_EVENT",
                payload: {
                    userId: saleDetails.userid,
                    notificationType: "GIFTCARD",
                    priority: "high",
                    title: "Gift Card Approved",
                    message: `Your ${saleDetails.cardType
                        } gift card sale has been approved! ₦${Number(
                            saleDetails.payoutAmount,
                        ).toLocaleString()} will be credited to your wallet shortly.`,
                    metadata: {
                        saleId: saleDetails.id,
                        cardType: saleDetails.cardType,
                        payoutAmount: saleDetails.payoutAmount,
                        action: "giftcard_sale_approved",
                        approvedAt: new Date().toISOString(),
                    },
                    deliveryChannels: ["in_app", "push"],
                },
            });

            logger.info(
                `Sale approval notification queued for user ${saleDetails.userid}`,
                {
                    saleId: saleDetails.id,
                },
            );

            const user = await prisma.user.findUnique({
                where: { id: saleDetails.userid },
                select: { email: true, fullname: true },
            });

            if (user?.email) {
                await sendGiftcardSaleApprovedandPayoutEmail(
                    user.email,
                    user.fullname,
                    {
                        saleId: saleDetails.id,
                        cardType: saleDetails.cardType,
                        cardValue: Number(saleDetails.cardValue),
                        quantity: saleDetails.quantity,
                        payoutAmount: Number(saleDetails.payoutAmount),
                        transactionId: transaction.id,
                        paidAt: new Date().toISOString(),
                    },
                );
                logger.info(`Sale approval email sent to user ${saleDetails.userid}`);
            }
        } catch (error) {
            logger.error("Failed to send sale approval notification:", {
                error,
                userId: saleDetails.userid,
            });
        }
    });
});

const rejectSale = Asyncly(async (req: Request, res: Response) => {
    const validatedData = giftCardValidation.rejectSaleSchema.parse({
        ...req.body,
    });

    const adminId = req.currentAdmin.id;

    logger.info(`Admin ${adminId} rejecting sale ${validatedData.saleId}`, {
        reason: validatedData.rejectionReason,
    });

    const sale = await giftCardSellingService.rejectSale(validatedData, adminId);

    res.status(httpStatus.OK).json({
        success: true,
        message: RESPONSE_MESSAGES.GIFTCARD.SALE_REJECTED,
        data: sale,
    });

    setImmediate(async () => {
        try {
            await publishToQueue({
                type: "NOTIFICATION_EVENT",
                payload: {
                    userId: sale.userid,
                    notificationType: "GIFTCARD",
                    priority: "high",
                    title: "Gift Card Rejected ❌",
                    message: `Your ${sale.cardType} gift card sale was rejected. Reason: ${validatedData.rejectionReason}`,
                    metadata: {
                        saleId: sale.id,
                        rejectionReason: validatedData.rejectionReason,
                        action: "giftcard_sale_rejected",
                    },
                    deliveryChannels: ["in_app", "push", "email"],
                },
            });

            logger.info(
                `Sale rejection notification queued for user ${sale.userid}`,
                {
                    saleId: sale.id,
                },
            );

            const user = await prisma.user.findUnique({
                where: { id: sale.userid },
                select: { email: true, fullname: true },
            });

            if (user?.email) {
                await publishToQueue({
                    type: "GIFTCARD_REJECTED",
                    payload: {
                        userId: sale.userid,
                        recipient: user.email,
                        fullName: user.fullname,
                        rejectionDetails: {
                            saleId: sale.id,
                            cardType: sale.cardType,
                            cardValue: sale.cardValue,
                            quantity: sale.quantity,
                            rejectionReason: validatedData.rejectionReason,
                            reviewNotes: validatedData.reviewNotes || null,
                            rejectedAt: new Date().toISOString(),
                        },
                    },
                });

                logger.info(`Sale rejection email queued for user ${sale.userid}`);
            }
        } catch (error) {
            logger.error("Failed to send sale rejection notification:", {
                error,
                userId: sale.userid,
            });
        }
    });
});

export const giftcardSellAdminController = {
    getAllAcceptedCards,
    getAcceptedCard,
    createAcceptedCard,
    updateAcceptedCard,
    deleteAcceptedCard,

    getAllSales,
    getSale,
    reviewSale,
    processSalePayout,
    rejectSale,
};
