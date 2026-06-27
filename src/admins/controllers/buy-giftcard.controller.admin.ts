import { Request, Response } from "express";
import { httpStatus } from "@/shared/exceptions/statusCodes";
import { Asyncly } from "@/shared/extensions/asyncly";
import { logger } from "@/lib/winston";
import { reloadlyService } from "@/externals/reloadly/reloadly";
import { withPagination } from "@/shared/utils/pagination";
import { OrderHistoryItemDTO } from "@/internals/giftcard/giftcard.dto";
import { BadRequestException, NotFoundException, ServiceUnavailableException } from "@/shared/exceptions/exceptions";
import { prisma } from "@/shared/db/prisma";
import { encrypt } from "@/shared/utils/encryption";


const syncProducts = Asyncly(async (req: Request, res: Response) => {
    logger.info(`Admin ${req.currentAdmin?.id} initiated product sync`);

    const result = await reloadlyService.syncProductsToDatabase();

    logger.info(
        `Product sync completed by admin ${req.currentAdmin?.id}:`,
        result,
    );

    if (result.synced === 0 && result.errors > 0) {
        return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: `Product sync failed: ${result.errors} errors occurred. Check logs for details`,
            data: {
                totalFetched: result.totalFetched,
                syncedProducts: result.synced,
                deactivatedProducts: result.deactivated,
                errors: result.errors,
                timestamp: new Date().toISOString(),
            },
        });
    }

    if (result.errors > 0) {
        return res.status(httpStatus.OK).json({
            success: true,
            message: `Product sync completed with warnings: ${result.synced} synced, ${result.deactivated} deactivated, ${result.errors} failed`,
            data: {
                totalFetched: result.totalFetched,
                syncedProducts: result.synced,
                deactivatedProducts: result.deactivated,
                errors: result.errors,
                timestamp: new Date().toISOString(),
            },
        });
    }

    res.status(httpStatus.OK).json({
        success: true,
        message: `Product sync completed successfully: ${result.synced} synced, ${result.deactivated} deactivated`,
        data: {
            totalFetched: result.totalFetched,
            syncedProducts: result.synced,
            deactivatedProducts: result.deactivated,
            errors: result.errors,
            timestamp: new Date().toISOString(),
        },
    });
});

const getAllProducts = Asyncly(async (req: Request, res: Response) => {
    const { search, countryCode, country, isActive, reloadlyId } = req.query;

    const whereClause: any = {};

    if (reloadlyId) {
        whereClause.reloadlyId = reloadlyId as string;
    } else if (search) {
        whereClause.OR = [
            {
                name: {
                    contains: search as string,
                    mode: "insensitive",
                },
            },
            {
                reloadlyId: {
                    contains: search as string,
                    mode: "insensitive",
                },
            },
        ];
    }

    if (countryCode) {
        whereClause.countryCode = countryCode as string;
    }

    if (country) {
        whereClause.country = {
            contains: country as string,
            mode: "insensitive",
        };
    }

    if (isActive !== undefined) {
        whereClause.isActive = isActive === "true";
    }

    const result = await withPagination({
        model: "giftcardProducts",
        req,
        res,
        where: whereClause,
    });

    logger.info(`Admin ${req.currentAdmin?.id} fetched giftcard products`, {
        page: result.pagination.currentPage,
        total: result.pagination.totalItems,
    });

    res.status(httpStatus.OK).json({
        success: true,
        message: "Products fetched successfully",
        data: result.results,
        pagination: result.pagination,
    });
});

const getAllOrders = Asyncly(async (req: Request, res: Response) => {
    const { status, userId } = req.query;

    const whereClause: any = {
        category: "GIFTCARDS",
        meta: {
            path: ["giftcard"],
            not: null,
        },
    };

    if (status) {
        whereClause.status = status;
    }

    if (userId) {
        whereClause.userId = userId as string;
    }

    const result = await withPagination({
        model: "transaction",
        req,
        res,
        where: whereClause,
        transform: (order) => new OrderHistoryItemDTO(order),
    });

    logger.info(`Admin ${req.currentAdmin?.id} fetched giftcard orders`, {
        page: result.pagination.currentPage,
        total: result.pagination.totalItems,
    });

    res.status(httpStatus.OK).json({
        success: true,
        message: "Orders fetched successfully",
        data: result.results,
        pagination: result.pagination,
    });
});

const getOrder = Asyncly(async (req: Request, res: Response) => {
    const { orderId } = req.params;
    const adminId = req.currentAdmin!.id;

    logger.info(`Admin ${adminId} requesting order details for ${orderId}`);

    const transaction = await prisma.transaction.findFirst({
        where: {
            id: orderId,
            category: "GIFTCARDS",
        },
        include: {
            user: {
                select: {
                    id: true,
                    fullname: true,
                    email: true,
                    username: true,
                    phone: true,
                },
            },
            giftcardCodes: true,
        },
    });

    if (!transaction) {
        throw new NotFoundException("Order not found");
    }

    const gcMeta = (transaction.meta as any)?.giftcard;

    if (!gcMeta) {
        throw new NotFoundException("Gift card metadata not found");
    }

    // const decryptedCodes: any[] = [];
    // for (const code of transaction.giftcardCodes) {
    //   try {
    //     const decryptedCode = decrypt(code.encryptedCode);
    //     const decryptedPin = code.encryptedPin
    //       ? decrypt(code.encryptedPin)
    //       : null;

    //     decryptedCodes.push({
    //       id: code.id,
    //       code: decryptedCode,
    //       pin: decryptedPin,
    //       status: code.status,
    //       redemptionUrl: code.redemptionUrl,
    //       createdAt: code.createdAt,
    //     });
    //   } catch (error) {
    //     logger.error(`Failed to decrypt code ${code.id}:`, error as any);
    //     decryptedCodes.push({
    //       id: code.id,
    //       code: "DECRYPTION_FAILED",
    //       pin: null,
    //       status: code.status,
    //       redemptionUrl: code.redemptionUrl,
    //       createdAt: code.createdAt,
    //       error: "Failed to decrypt code",
    //     });
    //   }
    // }

    logger.info(`Admin ${adminId} retrieved order ${orderId}`);

    res.status(httpStatus.OK).json({
        success: true,
        message: "Order details retrieved successfully",
        data: {
            id: transaction.id,
            userId: transaction.userId,
            orderReference: gcMeta.orderReference || transaction.reference,
            status: transaction.status,

            cardType: gcMeta.cardType,
            country: gcMeta.country,
            denomination: gcMeta.denomination,
            quantity: gcMeta.quantity,

            rate: gcMeta.rate,
            cardTotal: gcMeta.cardTotal,
            fee: gcMeta.fee,
            promoDiscount: gcMeta.promoDiscount,
            nairaValue: gcMeta.nairaValue,

            paymentMethod: gcMeta.paymentMethod,
            walletId: transaction.walletId,
            virtualAccountId: transaction.virtualAccountId,
            transactionId: transaction.id,

            reloadlyOrderId: gcMeta.reloadlyOrderId,
            reloadlyData: gcMeta.reloadlyData,
            failureReason: gcMeta.failureReason,

            promoCodeId: gcMeta.promoCodeId,
            promoCodeUsed: gcMeta.promoCodeUsed,

            createdAt: transaction.createdAt,
            updatedAt: transaction.updatedAt,

            user: transaction.user,
        },
    });
});

const retryOrder = Asyncly(async (req: Request, res: Response) => {
    const { orderId } = req.params;
    const adminId = req.currentAdmin!.id;

    logger.info(
        `Admin ${adminId} initiating code delivery retry for order ${orderId}`,
    );

    const transaction = await prisma.transaction.findFirst({
        where: {
            id: orderId,
            category: "GIFTCARDS",
        },
        include: {
            giftcardCodes: true,
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
        throw new NotFoundException("Order not found");
    }

    // Extract giftcard metadata
    const gcMeta = (transaction.meta as any)?.giftcard;

    if (!gcMeta) {
        throw new NotFoundException("Gift card metadata not found");
    }

    if (transaction.status !== "PROCESSING") {
        throw new BadRequestException(
            `Cannot retry order with status: ${transaction.status}. Only PROCESSING orders can be retried.`,
        );
    }

    if (transaction.giftcardCodes.length > 0) {
        throw new BadRequestException(
            "Codes already delivered for this order. Cannot retry.",
        );
    }

    if (!gcMeta.reloadlyOrderId) {
        throw new BadRequestException(
            "No Reloadly order ID found. Cannot fetch codes.",
        );
    }

    let codes: any[] = [];
    try {
        const codesResponse = await reloadlyService.getRedeemCodes(
            parseInt(gcMeta.reloadlyOrderId),
        );

        if (codesResponse && Array.isArray(codesResponse)) {
            codes = codesResponse;
        }
    } catch (error) {
        logger.error(
            `Admin ${adminId} - Failed to fetch codes for order ${orderId}:`,
            error as any,
        );
        throw new ServiceUnavailableException(
            "Failed to retrieve codes from Reloadly. The codes may not be ready yet.",
        );
    }

    if (codes.length === 0) {
        throw new NotFoundException(
            "Codes not ready yet. Please try again in a few minutes.",
        );
    }

    // Store encrypted codes in database
    for (const code of codes) {
        await prisma.giftcardCodes.create({
            data: {
                transactionId: transaction.id,
                encryptedCode: encrypt(code.cardNumber || code.code),
                encryptedPin: code.pinCode ? encrypt(code.pinCode) : null,
                redemptionUrl: code.redemptionUrl,
                status: "DELIVERED",
                deliveredAt: new Date(),
            },
        });
    }

    await prisma.transaction.update({
        where: { id: transaction.id },
        data: {
            status: "SUCCESS",
            meta: {
                ...((transaction.meta as any) || {}),
                giftcard: {
                    ...gcMeta,
                    orderStatus: "SUCCESS",
                    failureReason: null,
                },
            } as any,
        },
    });

    logger.info(
        `Admin ${adminId} successfully delivered ${codes.length} codes for order ${orderId}`,
    );

    res.status(httpStatus.OK).json({
        success: true,
        message: `Successfully delivered ${codes.length} gift card code(s)`,
        data: {
            orderId: transaction.id,
            orderReference: gcMeta.orderReference || transaction.reference,
            codesDelivered: codes.length,
            status: "SUCCESS",
            retriedBy: adminId,
            retriedAt: new Date().toISOString(),
        },
    });

    //   setImmediate(async () => {
    //     try {
    //       await publishToQueue({
    //         type: "NOTIFICATION_EVENT",
    //         payload: {
    //           userId: transaction.userId,
    //           notificationType: "GIFTCARD",
    //           priority: "high",
    //           title: "Gift Card Codes Ready! 🎁",
    //           message: `Your ${gcMeta.cardType} gift card codes are now available. Check your order for details.`,
    //           metadata: {
    //             orderId: transaction.id,
    //             orderReference: gcMeta.orderReference || transaction.reference,
    //             codesDelivered: codes.length,
    //             action: "giftcard_codes_delivered",
    //           },
    //           deliveryChannels: ["in_app", "push"],
    //         },
    //       });

    //       logger.info(
    //         `Notification queued for user ${transaction.userId} - order ${orderId}`,
    //       );
    //     } catch (error) {
    //       logger.error("Failed to queue notification:", {
    //         error,
    //         orderId,
    //         userId: transaction.userId,
    //       });
    //     }
    //   });
});

const getOrderStatus = Asyncly(async (req: Request, res: Response) => {
    const { orderId } = req.params;
    const adminId = req.currentAdmin!.id;
    logger.info(`Admin ${adminId} requesting order status for ${orderId}`);

    const numericOrderId = parseFloat(orderId);
    const status = await reloadlyService.getOrderStatus(numericOrderId);

    res.status(httpStatus.OK).json({
        success: true,
        message: "Order status retrieved successfully",
        data: status,
    });
});

export const giftcardBuyAdminController = {
    syncProducts,
    getAllProducts,
    getAllOrders,
    getOrder,
    retryOrder,
    //   refundOrder,
    //   getReloadlyTransactions,
    //   getReloadlyTransactionById,
    //   getReloadlyFXRates,
    //   getReloadlyRedeemCode,
    getOrderStatus,
};
