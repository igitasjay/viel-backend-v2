import { prisma } from "@shared/db/prisma";
import { logger } from "@/lib/winston";
import {
    NotFoundException,
    BadRequestException,
    ConflictException,
} from "@shared/exceptions/exceptions";
import {
    CreateAcceptedCardDto,
    UpdateAcceptedCardDto,
    RejectSaleDto,
} from "../validations/giftcard.validation";

import { AcceptedGiftCardDetailDTO, GiftCardSaleDetailDTO } from "../dtos/giftcard.dto";

import { RESPONSE_MESSAGES } from "../../internals/giftcard/constants";
import { updateGiftcardSaleMeta } from "@/internals/giftcard/types/giftcard.type";
// import {
//   emitAcceptedGiftCardCreated,
//   emitAcceptedGiftCardUpdated,
//   emitAcceptedGiftCardDeleted,
// } from "../../internals/giftcard+/giftcard.socket";

class GiftCardSellingService {
    async createAcceptedCard(
        data: CreateAcceptedCardDto,
    ): Promise<AcceptedGiftCardDetailDTO> {
        // const minValue = Number(data.minValue.replace(/,/g, ""));
        // const maxValue = Number(data.maxValue.replace(/,/g, ""));

        // if (Number.isNaN(minValue) || Number.isNaN(maxValue)) {
        //   throw new Error("Min and Max values must be valid numbers");
        // }

        // if (minValue <= 0 || maxValue <= 0) {
        //   throw new Error("Min and Max values must be greater than zero");
        // }

        // if (minValue > maxValue) {
        //   throw new Error("Minimum value cannot exceed maximum value");
        // }

        const existing = await prisma.acceptedGiftCard.findUnique({
            where: {
                cardType_country: {
                    cardType: data.cardType,
                    country: data.country,
                },
            },
        });

        if (existing) {
            throw new ConflictException(
                `${data.cardType} for ${data.country} already exists`,
            );
        }

        const card = await prisma.acceptedGiftCard.create({
            data: {
                cardName: data.cardName,
                cardType: data.cardType,
                country: data.country,
                currency: data.currency,
                availableRanges: data.availableRanges,
                receiptTypes: data.receiptTypes,
                rates: data.rates,
                imageUrl: data.imageUrl || null,
                isActive: data.isActive,
            },
        });

        logger.info("Accepted gift card created:", {
            cardId: card.id,
            cardType: card.cardType,
        });
        // emitAcceptedGiftCardCreated(card);

        return new AcceptedGiftCardDetailDTO(card);
    }

    async getAcceptedCardById(
        cardId: string,
    ): Promise<AcceptedGiftCardDetailDTO> {
        const card = await prisma.acceptedGiftCard.findUnique({
            where: { id: cardId },
        });

        if (!card) {
            throw new NotFoundException(RESPONSE_MESSAGES.ERRORS.CARD_NOT_ACCEPTED);
        }

        return new AcceptedGiftCardDetailDTO(card);
    }

    async updateAcceptedCard(
        cardId: string,
        data: UpdateAcceptedCardDto,
    ): Promise<AcceptedGiftCardDetailDTO> {
        const card = await prisma.acceptedGiftCard.findUnique({
            where: { id: cardId },
        });

        if (!card) {
            throw new NotFoundException(RESPONSE_MESSAGES.ERRORS.CARD_NOT_ACCEPTED);
        }

        const updated = await prisma.acceptedGiftCard.update({
            where: { id: cardId },
            data: {
                ...data,
            },
        });

        logger.info("Accepted gift card updated:", {
            cardId: updated.id,
            cardType: updated.cardType,
        });
        // emitAcceptedGiftCardUpdated(updated);

        return new AcceptedGiftCardDetailDTO(updated);
    }

    async deleteAcceptedCard(cardId: string): Promise<void> {
        const card = await prisma.acceptedGiftCard.findUnique({
            where: { id: cardId },
        });

        if (!card) {
            throw new NotFoundException(RESPONSE_MESSAGES.ERRORS.CARD_NOT_ACCEPTED);
        }

        await prisma.acceptedGiftCard.update({
            where: { id: cardId },
            data: { isActive: false },
        });

        logger.info("Accepted gift card deactivated:", {
            cardId,
            cardType: card.cardType,
        });
        // emitAcceptedGiftCardDeleted(cardId, card);
    }

    async reviewSale(
        saleId: string,
        adminId: string,
    ): Promise<GiftCardSaleDetailDTO> {
        const sale = await prisma.transaction.findUnique({
            where: { id: saleId },
        });

        if (!sale) {
            throw new NotFoundException(RESPONSE_MESSAGES.ERRORS.SALE_NOT_FOUND);
        }

        if (sale.status === "UNDER_REVIEW") {
            throw new BadRequestException("This sale is already under REVIEW");
        }

        if (sale.status !== "PENDING") {
            throw new BadRequestException("Only PENDING sales can be reviewed");
        }

        const result = await prisma.transaction.update({
            where: { id: saleId },
            data: {
                status: "UNDER_REVIEW",
                reviewedBy: adminId,
                reviewedAt: new Date(),
            },
        });

        logger.info("Gift card sale under review:", {
            saleId,
            adminId,
            transactionUpdated: !!saleId,
        });

        return new GiftCardSaleDetailDTO(result);
    }

    async processSalePayout(
        saleId: string,
        AdminId: string,
        reviewNotes?: string,
    ): Promise<{
        sale: GiftCardSaleDetailDTO;
        transaction: any;
        payoutAmount: number;
    }> {
        const transaction = await prisma.transaction.findUnique({
            where: { id: saleId },
        });

        if (!transaction) {
            throw new NotFoundException(RESPONSE_MESSAGES.ERRORS.SALE_NOT_FOUND);
        }

        if (transaction.status !== "UNDER_REVIEW") {
            throw new BadRequestException(
                `Cannot process payout for sale with status: ${transaction.status}`,
            );
        }

        const payoutAmount = Number(transaction.amount);

        logger.info("Processing sale payout:", {
            saleId,
            userId: transaction.userId,
            payoutAmount,
            AdminId,
        });

        const wallet = await prisma.wallet.findUnique({
            where: {
                userId_currency: {
                    userId: transaction.userId,
                    currency: "NGN",
                },
            },
        });

        if (!wallet) {
            throw new NotFoundException("User wallet not found");
        }

        const result = await prisma.$transaction(async (tx) => {
            await tx.wallet.update({
                where: { id: wallet.id },
                data: {
                    buyVolume: {
                        increment: payoutAmount,
                    },
                },
            });

            const updatedTransaction = await tx.transaction.update({
                where: { id: saleId },
                data: {
                    walletId: wallet.id,
                    status: "SUCCESS",
                    narration: `Payout for gift card sale`,
                    reviewedBy: AdminId,
                    reviewedAt: new Date(),
                    reviewNotes: reviewNotes || null,
                    meta: updateGiftcardSaleMeta(transaction.meta, {
                        saleStatus: "PAID",
                        reviewNotes: reviewNotes,
                    }),
                },
            });

            logger.info("Sale payout completed:", {
                saleId,
                userId: transaction.userId,
                payoutAmount,
                walletId: wallet.id,
            });

            return updatedTransaction;
        });

        // Award spin if giftcard is in USD and value >= threshold
        // if (
        //     result.gcCardCurrency === "USD" &&
        //     result.giftCardValue &&
        //     result.giftCardQuantity
        // ) {
        //     const usdValue = Number(result.giftCardValue) * result.giftCardQuantity;
        //     setImmediate(async () => {
        //         try {
        //             await spinService.updateSpinEligibility(result.userId, usdValue);
        //         } catch (error) {
        //             logger.error("Error awarding spin for giftcard payout:", { error });
        //         }
        //     });
        // }

        return {
            sale: new GiftCardSaleDetailDTO(result),
            transaction: result,
            payoutAmount,
        };
    }

    async rejectSale(
        data: RejectSaleDto,
        adminId: string,
    ): Promise<GiftCardSaleDetailDTO> {
        const transaction = await prisma.transaction.findUnique({
            where: { id: data.saleId },
        });

        if (!transaction) {
            throw new NotFoundException(RESPONSE_MESSAGES.ERRORS.SALE_NOT_FOUND);
        }

        if (transaction.status === "SUCCESS") {
            throw new BadRequestException(RESPONSE_MESSAGES.ERRORS.ALREADY_PAID);
        }

        if (transaction.status === "FAILED") {
            throw new BadRequestException(RESPONSE_MESSAGES.ERRORS.ALREADY_REJECTED);
        }

        const result = await prisma.transaction.update({
            where: { id: data.saleId },
            data: {
                status: "FAILED",
                narration: `Gift card sale rejected`,
                reviewedBy: adminId,
                reviewedAt: new Date(),
                reviewNotes: data.reviewNotes || null,
                rejectionReason: data.rejectionReason,
                meta: updateGiftcardSaleMeta(transaction.meta, {
                    saleStatus: "REJECTED",
                    rejectionReason: data.rejectionReason,
                    reviewNotes: data.reviewNotes,
                }),
            },
        });

        logger.info("Gift card sale rejected:", {
            saleId: data.saleId,
            reason: data.rejectionReason,
            adminId,
        });

        return new GiftCardSaleDetailDTO(result);
    }
}

export const giftCardSellingService = new GiftCardSellingService();
