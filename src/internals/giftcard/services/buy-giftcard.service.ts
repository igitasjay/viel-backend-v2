import {
    NotFoundException,
    BadRequestException,
    InternalServerErrorException,
} from "@/shared/exceptions/exceptions";
import { logger } from "@/lib/winston";
import { reloadlyService } from "@/externals/reloadly/reloadly";
import { encrypt } from "@/shared/utils/encryption";
import { prisma } from "@/shared/db/prisma";
import { GIFTCARD_CONSTRAINTS, GIFTCARD_FEE_PER_CARD, GIFTCARD_FEE_TYPE, RESPONSE_MESSAGES } from "../constants";
import { PlaceOrderResponseDTO } from "../giftcard.dto";
import * as ref from "@/shared/helpers/references";
import { TransactionCategory, TransactionType } from "@prisma/client";
import { createGiftcardMeta, getGiftcardMeta, updateGiftcardMeta } from "../types/giftcard.type";
import { ReloadlyOrderResponse } from "@/externals/reloadly/interface";
import { initMonnifyBankTransfer, initMonnifyTransaction } from "@/monnify-infra/services/monnify.service";
import config from "@/config/config";
import { useTransactionPin } from "@/internals/account/account.utils";


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

    async placeDirectOrder(
        data: {
            reloadlyId: string;
            cardValue: number;
            quantity: number;
            calculatedSubtotal: number;
            calculatedFee: number;
            calculatedTotal: number;
            pin?: string;
            paymentMethod: "Monnify";
            currency: string;
            promoCode?: string;
        },
        userId: string,
        fullname: string,
        email: string,
        reqToken: string | undefined,
    ): Promise<PlaceOrderResponseDTO> {
        const {
            reloadlyId,
            cardValue,
            quantity,
            calculatedSubtotal,
            calculatedFee,
            calculatedTotal,
            pin,
            paymentMethod,
            currency,
            promoCode,
        } = data;

        const product = await prisma.giftcardProducts.findUnique({
            where: { reloadlyId: reloadlyId },
        });

        if (!product || !product.isActive) {
            throw new BadRequestException(
                RESPONSE_MESSAGES.ERRORS.PRODUCT_UNAVAILABLE,
            );
        }

        let reloadlyData = product.reloadlyData as any;

        const hoursSinceSync =
            (new Date().getTime() - product.updatedAt.getTime()) / (1000 * 60 * 60);

        if (hoursSinceSync > GIFTCARD_CONSTRAINTS.STALENESS_CHECK_HOURS) {
            logger.warn(
                `Product ${reloadlyId} is stale. Fetching fresh rate for verification...`,
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
                logger.info(`Using fresh rate for verification`);
            }
        }

        const denominationType = reloadlyData.denominationType;

        if (denominationType === "FIXED") {
            const fixedDenominations = reloadlyData.fixedRecipientDenominations || [];
            if (!fixedDenominations.includes(cardValue)) {
                throw new BadRequestException(
                    `Invalid card value. Available denominations: ${fixedDenominations.join(", ")}`,
                );
            }
        } else if (denominationType === "RANGE") {
            const minAmount = reloadlyData.minRecipientDenomination;
            const maxAmount = reloadlyData.maxRecipientDenomination;
            if (cardValue < minAmount || cardValue > maxAmount) {
                throw new BadRequestException(
                    `Card value must be between ${minAmount} and ${maxAmount}`,
                );
            }
        }

        let expectedBasePrice: number;
        if (denominationType === "FIXED") {
            const denominationKey = cardValue.toFixed(2);
            const denominationMap =
                reloadlyData.fixedRecipientToSenderDenominationsMap || {};
            expectedBasePrice =
                denominationMap[denominationKey] ||
                denominationMap[cardValue] ||
                denominationMap[cardValue.toString()] ||
                denominationMap[`${cardValue}.0`];

            if (!expectedBasePrice) {
                throw new InternalServerErrorException(
                    `Price mapping not found for denomination ${cardValue}`,
                );
            }
        } else {
            const exchangeRate =
                reloadlyData.recipientCurrencyToSenderCurrencyExchangeRate || 1700;
            expectedBasePrice = cardValue * exchangeRate;
        }

        const feeConfig = await prisma.feeConfiguration.findFirst({
            where: {
                type: "GIFTCARD_BUY",
                isActive: true,
            },
        });

        let expectedFeePerCard = 0;
        if (feeConfig) {
            if (feeConfig.feeType === GIFTCARD_FEE_TYPE.PERCENTAGE) {
                const feePercentage = Number(feeConfig.feeValue);
                expectedFeePerCard = (expectedBasePrice * feePercentage) / 100;
            } else if (feeConfig.feeType === GIFTCARD_FEE_TYPE.FIXED) {
                expectedFeePerCard = Number(feeConfig.feeValue);
            }
        } else {
            expectedFeePerCard = GIFTCARD_FEE_PER_CARD.VALUE;
        }

        const expectedSubtotal = expectedBasePrice * quantity;
        const expectedTotalFee = expectedFeePerCard * quantity;

        // PROMO CODE DISABLED FOR GIFTCARD BUY
        // Promo codes are now only available for giftcard sell
        let promoDiscount = 0;
        let promoCodeId: string | undefined;
        // if (promoCode) {
        //   const promo = await prisma.promoCode.findUnique({
        //     where: { code: promoCode },
        //   });
        //   if (!promo || !promo.isActive) {
        //     throw new BadRequestException(
        //       RESPONSE_MESSAGES.ERRORS.INVALID_PROMO_CODE
        //     );
        //   }

        //   const now = new Date();
        //   if (promo.validUntil && now > promo.validUntil) {
        //     throw new BadRequestException(
        //       RESPONSE_MESSAGES.ERRORS.INVALID_PROMO_CODE
        //     );
        //   }

        //   if (now < promo.validFrom) {
        //     throw new BadRequestException("Promo code is not yet valid");
        //   }

        //   if (promo.maxUses && promo.currentUses >= promo.maxUses) {
        //     throw new BadRequestException(
        //       RESPONSE_MESSAGES.ERRORS.PROMO_CODE_LIMIT_REACHED
        //     );
        //   }

        //   if (promo.bonusType === "PERCENTAGE") {
        //     promoDiscount = (expectedSubtotal * Number(promo.bonusAmount)) / 100;
        //   } else {
        //     promoDiscount = Number(promo.bonusAmount);
        //   }

        //   promoCodeId = promo.id;
        // }

        const expectedTotal = expectedSubtotal + expectedTotalFee - promoDiscount;

        const tolerance = 1;
        const subtotalMatch =
            Math.abs(calculatedSubtotal - expectedSubtotal) <= tolerance;
        const feeMatch = Math.abs(calculatedFee - expectedTotalFee) <= tolerance;
        const totalMatch = Math.abs(calculatedTotal - expectedTotal) <= tolerance;

        if (!subtotalMatch || !feeMatch || !totalMatch) {
            logger.error("Price calculation mismatch:", {
                client: { calculatedSubtotal, calculatedFee, calculatedTotal },
                server: {
                    expectedSubtotal,
                    expectedTotalFee,
                    expectedTotal,
                    promoDiscount,
                },
            });
            throw new BadRequestException(
                "Price calculation mismatch. Please refresh and try again.",
            );
        }

        // await useTransactionPin(userId, pin ?? '', reqToken);
        // logger.info("Transaction PIN verified");

        // await checkTransactionLimits(userId, expectedTotal);
        // logger.info("Transaction limits verified");

        const requestId = ref.generateRequestRef();
        const orderReference = `GCP|${ref.generateTransactionReference()}`;
        const sessionId = ref.generateSessionId();



        const initTxResponse = await initMonnifyTransaction({
            amount: expectedTotal,
            customerName: fullname.trim() || 'User',
            customerEmail: email,
            paymentReference: orderReference,
            paymentDescription: `Giftcard Purchase - ${quantity}x ${product.name} (${product.currency}${Number(cardValue)})`,
            currencyCode: 'NGN',
            contractCode: config.MONNIFY_CONTRACT_CODE!,
            redirectUrl: 'https://MyViel.com', // Optional redirect
            paymentMethods: ['ACCOUNT_TRANSFER'],
        });

        const monnifyRef = initTxResponse.responseBody.transactionReference;

        // Initialize Monnify Bank Transfer
        await initMonnifyBankTransfer({
            transactionReference: monnifyRef,
            amount: expectedTotal,
            customerName: fullname,
            customerEmail: email,
            paymentDescription: `Giftcard Purchase - ${quantity}x ${product.name} (${product.currency}${Number(cardValue)})`,
            currencyCode: 'NGN',
            contractCode: config.MONNIFY_CONTRACT_CODE!,
        }).then((result) => {
            logger.info("Monnify bank transfer initiated successfully");
            return { ...result.responseBody };
        });



        // const paymentResult = await initMonnifyBankTransfer({
        //     transactionReference: monnifyRef,
        //     amount: expectedTotal,
        //     customerName: fullname,
        //     customerEmail: email,
        //     paymentDescription: `Giftcard Purchase - ${quantity}x ${product.name} (${product.currency}${Number(cardValue)})`,
        //     currencyCode: 'NGN',
        //     contractCode: "",
        // }).then((result) => {
        //     logger.info("Monnify bank transfer initiated successfully");
        //     return { ...result.responseBody };
        // })


        const transaction = await prisma.transaction.create({
            data: {
                userId,
                // ...monnifyResponse,
                category: TransactionCategory.GIFTCARDS,
                type: TransactionType.DEBIT,
                amount: expectedTotal,
                currency: "NGN",
                fee: Number(expectedTotalFee),
                reference: orderReference,
                narration: `Purchase of ${quantity}x ${product.name} (${product.currency}${Number(cardValue)})`,
                status: "PENDING",
                sessionId,
                giftCardQuantity: quantity,
                giftCardType: product.name,
                giftCardValue: cardValue,
                giftCardReceipt: orderReference,
                provider: "Trade Aviator",
                providerRef: null,
                externalRef: null,
                internalRef: requestId,
                channel: paymentMethod,
                imageUrl: product.imageUrl,
                meta: {
                    ...createGiftcardMeta({
                        orderReference,
                        productId: product.reloadlyId,
                        cardType: product.name,
                        country: product.country,
                        denomination: cardValue,
                        quantity: quantity,
                        rate:
                            reloadlyData.recipientCurrencyToSenderCurrencyExchangeRate ||
                            1700,
                        cardTotal: expectedSubtotal,
                        fee: expectedTotalFee,
                        promoDiscount: promoDiscount,
                        nairaValue: expectedTotal,
                        paymentMethod: paymentMethod,
                        promoCodeUsed: promoCode,
                        promoCodeId: promoCodeId,
                    }),
                    countryCode: product.countryCode,
                    cardCurrency: product.currency,
                    promoCode: promoCode,
                } as any,
            },
        });

        logger.info("Placing Reloadly order (direct):", {
            userId,
            transactionId: transaction.id,
            productId: product.reloadlyId,
            cardValue: Number(cardValue),
            quantity: quantity,
            orderReference,
        });

        let reloadlyOrder: ReloadlyOrderResponse;
        try {
            reloadlyOrder = await reloadlyService.placeOrder({
                productId: parseInt(product.reloadlyId),
                countryCode: product.countryCode,
                quantity: quantity,
                unitPrice: Number(cardValue),
                customIdentifier: orderReference,
            });

            await prisma.transaction.update({
                where: { id: transaction.id },
                data: {
                    providerRef: reloadlyOrder.transactionId?.toString(),
                    externalRef: reloadlyOrder.transactionId?.toString(),
                    meta: updateGiftcardMeta(transaction.meta, {
                        reloadlyOrderId: reloadlyOrder.transactionId?.toString(),
                        reloadlyData: reloadlyOrder as any,
                    }),
                },
            });

            await prisma.platformRevenue.create({
                data: {
                    source: "GIFTCARD_FEE",
                    amount: Number(expectedTotalFee),
                    currency: "NGN",
                    transactionId: transaction.id,
                    userId,
                    description: `Fee from gift card order - ${requestId}`,
                },
            });

            logger.info("Platform fee recorded:", {
                amount: Number(expectedTotalFee),
                transactionId: transaction.id,
            });

            logger.info("Reloadly order ID saved to transaction:", {
                transactionId: transaction.id,
                reloadlyOrderId: reloadlyOrder.transactionId,
            });
        } catch (error: any) {
            logger.error("Reloadly order failed:", {
                error: error.message,
                stack: error.stack,
                response: error.response?.data,
                userId,
                productId: product.reloadlyId,
                cardValue: Number(cardValue),
                quantity: quantity,
            });

            await prisma.transaction.update({
                where: { id: transaction.id },
                data: {
                    status: "FAILED",
                    meta: updateGiftcardMeta(transaction.meta, {
                        orderStatus: "FAILED",
                        failureReason: error.message || "Reloadly order failed",
                    }),
                },
            });

            // try {
            //   await processRefund(
            //     userId,
            //     paymentResult,
            //     expectedTotal,
            //     currency,
            //     orderReference,
            //     `Refund for failed gift card order - ${error.message}`,
            //   );

            //   logger.info(`Refunded ${expectedTotal} to user ${userId}`);
            // } catch (refundError) {
            //   logger.error("Critical: Refund failed after order failure", {
            //     error: refundError,
            //     userId,
            //     transactionId: transaction.id,
            //     amount: expectedTotal,
            //   });
            // }

            // try {
            //     await publishToQueue({
            //         type: "NOTIFICATION_EVENT",
            //         payload: {
            //             userId,
            //             notificationType: "GIFTCARD",
            //             priority: "high",
            //             title: "Order Failed",
            //             message: `Your gift card order couldn't be completed. ₦${Number(
            //                 expectedTotal,
            //             ).toLocaleString()} has been refunded.`,
            //             metadata: {
            //                 transactionId: transaction.id,
            //                 orderReference: orderReference,
            //                 refundAmount: expectedTotal,
            //                 failureReason: error.message,
            //                 action: "giftcard_order_failed",
            //             },
            //             deliveryChannels: ["in_app", "push"],
            //         },
            //     });
            // } catch (error) {
            //     logger.error("Failed to send failure notification:", { error });
            // }

            throw new BadRequestException(
                error.message || RESPONSE_MESSAGES.ERRORS.ORDER_FAILED,
            );
        }

        let codes: any[] = [];
        try {
            const reloadlyOrderId = reloadlyOrder.transactionId;
            await new Promise((resolve) =>
                setTimeout(resolve, GIFTCARD_CONSTRAINTS.CODE_FETCH_DELAY_MS),
            );
            const codesResponse =
                await reloadlyService.getRedeemCodes(reloadlyOrderId);
            if (codesResponse && Array.isArray(codesResponse)) {
                codes = codesResponse;
            }
        } catch (error) {
            logger.error("Failed to fetch codes immediately:", error as any);
        }

        if (codes.length > 0) {
            const giftcardPurchaseCodes = codes.map((code) => ({
                codeId: `${transaction.id}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                code: encrypt(code.cardNumber || code.code),
                pin: code.pinCode ? encrypt(code.pinCode) : null,
                redemptionUrl: code.redemptionUrl,
                status: "DELIVERED",
                deliveredAt: new Date().toISOString(),
            }));

            await prisma.transaction.update({
                where: { id: transaction.id },
                data: {
                    status: "SUCCESS",
                    meta: updateGiftcardMeta(transaction.meta, {
                        orderStatus: "SUCCESS",
                        giftcardPurchaseCodes,
                    }),
                },
            });
        } else {
            await prisma.transaction.update({
                where: { id: transaction.id },
                data: {
                    status: "PROCESSING",
                    meta: updateGiftcardMeta(transaction.meta, {
                        orderStatus: "PROCESSING",
                    }),
                },
            });
            logger.info(
                `Transaction ${transaction.id} marked as PROCESSING - codes not yet available`,
            );
        }

        // PROMO CODE DISABLED FOR GIFTCARD BUY
        // if (promoCodeId) {
        //   await prisma.promoCode.update({
        //     where: { id: promoCodeId },
        //     data: {
        //       currentUses: {
        //         increment: 1,
        //       },
        //     },
        //   });
        // }

        const finalTransaction = await prisma.transaction.findUnique({
            where: { id: transaction.id },
        });

        const giftcardMeta = getGiftcardMeta(finalTransaction);

        logger.info("Gift card order completed (direct):", {
            transactionId: transaction.id,
            userId,
            amount: expectedTotal,
            status: finalTransaction?.status,
            codesDelivered: codes.length,
            paymentMethod: paymentMethod,
        });

        const message =
            codes.length > 0
                ? RESPONSE_MESSAGES.GIFTCARD.ORDER_COMPLETED
                : RESPONSE_MESSAGES.GIFTCARD.ORDER_PENDING;

        return new PlaceOrderResponseDTO({
            orderId: transaction.id,
            orderReference: orderReference,
            productName: product.name,
            cardValue: Number(cardValue),
            quantity: quantity,
            totalAmount: expectedTotal,
            paymentMethod: paymentMethod,
            status:
                giftcardMeta?.orderStatus || finalTransaction?.status || "PROCESSING",
            transactionId: transaction.id,
            message,
            createdAt: finalTransaction?.createdAt || new Date(),
        });
    }

    async refreshCodes(
        transactionId: string,
        userId: string,
    ): Promise<{ message: string; codesDelivered: number }> {
        const transaction = await prisma.transaction.findFirst({
            where: {
                id: transactionId,
                userId,
                category: "GIFTCARDS",
            },
        });

        if (!transaction) {
            throw new NotFoundException(RESPONSE_MESSAGES.ERRORS.ORDER_NOT_FOUND);
        }
        const giftcardMeta = getGiftcardMeta(transaction);
        if (!giftcardMeta) {
            throw new NotFoundException("Giftcard metadata not found");
        }
        if (transaction.status !== "PROCESSING") {
            throw new BadRequestException(
                RESPONSE_MESSAGES.ERRORS.CANNOT_REFRESH_CODES,
            );
        }

        const existingCodes = await prisma.giftcardCodes.findMany({
            where: { transactionId: transaction.id },
        });

        if (existingCodes.length > 0) {
            throw new BadRequestException(
                RESPONSE_MESSAGES.ERRORS.CODES_ALREADY_DELIVERED,
            );
        }

        if (!giftcardMeta.reloadlyOrderId) {
            throw new BadRequestException(
                "No Reloadly order ID found for this transaction",
            );
        }

        let codes: any[] = [];

        try {
            const codesResponse = await reloadlyService.getRedeemCodes(
                parseInt(giftcardMeta.reloadlyOrderId),
            );

            if (codesResponse && Array.isArray(codesResponse)) {
                codes = codesResponse;
            }
        } catch (error) {
            logger.error(
                `Failed to refresh codes for transaction ${transactionId}:`,
                error as any,
            );
            throw new InternalServerErrorException(
                RESPONSE_MESSAGES.GIFTCARD.CODES_NOT_READY,
            );
        }

        if (codes.length === 0) {
            throw new NotFoundException(RESPONSE_MESSAGES.GIFTCARD.CODES_NOT_READY);
        }

        // Store codes in meta JSON instead of separate table to avoid JOINs
        const giftcardPurchaseCodes = codes.map((code) => ({
            codeId: `${transaction.id}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            code: encrypt(code.cardNumber || code.code),
            pin: code.pinCode ? encrypt(code.pinCode) : null,
            redemptionUrl: code.redemptionUrl,
            status: "DELIVERED",
            deliveredAt: new Date().toISOString(),
        }));

        await prisma.transaction.update({
            where: { id: transaction.id },
            data: {
                status: "SUCCESS",
                meta: updateGiftcardMeta(transaction.meta, {
                    orderStatus: "SUCCESS",
                    giftcardPurchaseCodes,
                }),
            },
        });

        logger.info(`Codes refreshed for transaction ${transactionId}:`, {
            userId,
            codesDelivered: codes.length,
        });

        return {
            message: RESPONSE_MESSAGES.GIFTCARD.CODES_REFRESHED,
            codesDelivered: codes.length,
        };
    }
}

export const giftCardService = new GiftCardService();