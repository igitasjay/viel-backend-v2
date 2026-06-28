import { prisma } from "@shared/db/prisma";
import {
  InternalServerErrorException,
  NotFoundException,
  BadRequestException,
} from "@shared/exceptions/exceptions";
import { encrypt } from "@shared/utils/encryption";
import { logger } from "@/lib/winston";
import {
  CalculateRateDto,
  CalculateSalePayoutDto,
  SubmitSaleDto,
} from "../giftcard.validation";

import {
  AcceptedGiftCardDetailDTO,
  CalculateSalePayoutResponse,
  GiftCardSaleDetailDTO,
} from "../giftcard.dto";
import {
  generateTransactionReference,
  generateSessionId,
} from "@shared/helpers/references";
import { RESPONSE_MESSAGES, GIFTCARD_CONSTRAINTS } from "../constants";
import { TransactionCategory, TransactionType } from "@prisma/client";
import { createGiftcardSaleMeta } from "../types/giftcard.type";
import { AdminNotificationService } from "@/admins/services/admin-notification.service";

class GiftCardSellingService {
  async getAcceptedCards(): Promise<any[]> {
    const getCardCountriesOrder = [
      "United States",
      "Canada",
      "United Kingdom",
      "Switzerland",
      "Netherlands",
      "Ireland",
      "Australia",
      "Italy",
      "Finland",
      "Spain",
      "Greece",
      "France",
      "Germany",
      "Austria",
      "Portugal",
      "New Zealand",
    ];

    const cards = await prisma.acceptedGiftCard.findMany({
      where: { isActive: true },
      orderBy: { cardName: "asc" },
    });

    const grouped: Record<string, any> = {};

    for (const card of cards) {
      if (!grouped[card.cardType]) {
        grouped[card.cardType] = {
          cardType: card.cardType,
          cardName: card.cardName,
          imageUrl: card.imageUrl,
          countries: [],
        };
      }

      grouped[card.cardType].countries.push({
        acceptedCardId: card.id,
        country: card.country,
        currency: card.currency,
        availableRanges: card.availableRanges,
        receiptTypes: card.receiptTypes,
        rates: card.rates,
      });
    }

    for (const cardType in grouped) {
      grouped[cardType].countries.sort((a: any, b: any) => {
        const aIndex = getCardCountriesOrder.indexOf(a.country);
        const bIndex = getCardCountriesOrder.indexOf(b.country);

        return (
          (aIndex === -1 ? Infinity : aIndex) -
          (bIndex === -1 ? Infinity : bIndex)
        );
      });
    }

    return Object.values(grouped);
  }

  async getAcceptedCardByIdForUser(
    acceptedCardId: string,
  ): Promise<AcceptedGiftCardDetailDTO> {
    const card = await prisma.acceptedGiftCard.findUnique({
      where: { id: acceptedCardId },
    });

    if (!card) {
      throw new NotFoundException(RESPONSE_MESSAGES.ERRORS.CARD_NOT_ACCEPTED);
    }

    if (!card.isActive) {
      throw new BadRequestException(RESPONSE_MESSAGES.ERRORS.CARD_INACTIVE);
    }

    return new AcceptedGiftCardDetailDTO(card);
  }

  async getSellExchangeRate(acceptedCardId: string): Promise<{
    acceptedCardId: string;
    cardName: string;
    cardType: string;
    currency: string;
    availableRanges: string[];
    receiptTypes: string[];
    rates: Record<string, any>;
  }> {
    const card = await prisma.acceptedGiftCard.findUnique({
      where: { id: acceptedCardId },
    });

    if (!card) {
      throw new NotFoundException(RESPONSE_MESSAGES.ERRORS.CARD_NOT_ACCEPTED);
    }

    if (!card.isActive) {
      throw new BadRequestException(RESPONSE_MESSAGES.ERRORS.CARD_INACTIVE);
    }

    logger.info(`Exchange rate fetched for accepted card ${acceptedCardId}:`, {
      cardType: card.cardType,
      currency: card.currency,
    });

    return {
      acceptedCardId: card.id,
      cardName: card.cardName,
      cardType: card.cardType,
      currency: card.currency,
      availableRanges: card.availableRanges as string[],
      receiptTypes: card.receiptTypes as string[],
      rates: card.rates as Record<string, any>,
    };
  }

  async _validateAndGetRate(data: {
    acceptedCardId: string;
    cardRange: string;
    receiptType: string;
    cardValue: number;
  }): Promise<{
    acceptedCard: any;
    buyingRate: number;
  }> {
    const acceptedCard = await prisma.acceptedGiftCard.findUnique({
      where: { id: data.acceptedCardId },
    });

    if (!acceptedCard) {
      throw new NotFoundException(RESPONSE_MESSAGES.ERRORS.CARD_NOT_ACCEPTED);
    }

    if (!acceptedCard.isActive) {
      throw new BadRequestException(RESPONSE_MESSAGES.ERRORS.CARD_INACTIVE);
    }

    const availableRanges = acceptedCard.availableRanges as string[];

    const normalizeRangeForComparison = (range: string): string => {
      let normalized = range.trim().replace(/\s+/g, "");

      normalized = normalized.replace(/[$€£¥CHF]/g, "");

      return normalized.toLowerCase();
    };

    const normalizedInput = normalizeRangeForComparison(data.cardRange);

    const matchIndex = availableRanges.findIndex((availableRange) => {
      const normalizedAvailable = normalizeRangeForComparison(availableRange);
      return normalizedAvailable === normalizedInput;
    });

    if (matchIndex === -1) {
      logger.error("Card range validation failed:", {
        acceptedCardId: data.acceptedCardId,
        cardType: acceptedCard.cardType,
        currency: acceptedCard.currency,
        providedRange: data.cardRange,
        normalizedInput,
        availableRanges,
        normalizedAvailable: availableRanges.map((r) =>
          normalizeRangeForComparison(r),
        ),
      });
      throw new BadRequestException(
        `Invalid card range "${data.cardRange
        }". Available ranges: ${availableRanges.join(", ")}`,
      );
    }

    const matchedRange = availableRanges[matchIndex];
    data.cardRange = matchedRange;

    logger.info("Card range matched successfully:", {
      providedRange: data.cardRange,
      matchedRange,
      cardType: acceptedCard.cardType,
    });

    const receiptTypes = acceptedCard.receiptTypes as string[];

    const normalizeReceiptType = (type: string): string => {
      return type.trim().toUpperCase().replace(/\s+/g, "_");
    };

    const normalizedInputReceipt = normalizeReceiptType(data.receiptType);
    const normalizedReceiptTypes = receiptTypes.map((r) =>
      normalizeReceiptType(r),
    );

    const receiptMatchIndex = normalizedReceiptTypes.findIndex(
      (type) => type === normalizedInputReceipt,
    );

    if (receiptMatchIndex === -1) {
      logger.error("Receipt type validation failed:", {
        acceptedCardId: data.acceptedCardId,
        cardType: acceptedCard.cardType,
        providedReceiptType: data.receiptType,
        normalizedInput: normalizedInputReceipt,
        availableReceiptTypes: receiptTypes,
        normalizedAvailable: normalizedReceiptTypes,
      });
      throw new BadRequestException(
        `Invalid receipt type "${data.receiptType
        }". Available types: ${receiptTypes.join(", ")}`,
      );
    }

    const matchedReceiptType = receiptTypes[receiptMatchIndex];
    data.receiptType = matchedReceiptType;

    logger.info("Receipt type matched successfully:", {
      providedReceiptType: data.receiptType,
      matchedReceiptType,
      cardType: acceptedCard.cardType,
    });

    const rates = acceptedCard.rates as any;
    const rangeRate = rates[data.cardRange];

    if (!rangeRate) {
      throw new InternalServerErrorException(
        `No rate configured for range ${data.cardRange}`,
      );
    }

    let buyingRate: number;

    if (data.receiptType === "E-CODE" && rangeRate["E-CODE"]) {
      buyingRate = rangeRate["E-CODE"];
    } else if (data.receiptType === "PHYSICAL" && rangeRate["PHYSICAL"]) {
      buyingRate = rangeRate["PHYSICAL"];
    } else {
      logger.error("Rate lookup failed:", {
        receiptType: data.receiptType,
        eCodeValue: rangeRate["E-CODE"],
        physicalValue: rangeRate["PHYSICAL"],
        rangeRateKeys: Object.keys(rangeRate),
      });
      throw new BadRequestException(
        `No rate found for receipt type "${data.receiptType
        }". Available types: ${Object.keys(rangeRate).join(", ")}`,
      );
    }

    return {
      acceptedCard,
      buyingRate,
    };
  }

  async calculateRates(data: CalculateRateDto) {
    const { acceptedCard, buyingRate } = await this._validateAndGetRate(data);

    const totalEarning = buyingRate * data.cardValue;

    return {
      acceptedCardId: acceptedCard.id,
      cardType: acceptedCard.cardType,
      buyingRate,
      totalEarning: Math.round(totalEarning),
      currency: acceptedCard.currency,
    };
  }

  async calculateSalePayout(
    data: CalculateSalePayoutDto,
  ): Promise<CalculateSalePayoutResponse> {
    const { acceptedCard, buyingRate } = await this._validateAndGetRate(data);

    const totalCardValue = data.cardValue * data.quantity;
    let basePayoutAmount = totalCardValue * buyingRate;

    // let promoBonus = 0;
    // let promoCodeId: string | undefined;
    // if (data.promoCode) {
    //   const promo = await prisma.promoCode.findUnique({
    //     where: { code: data.promoCode.toUpperCase() },
    //   });

    //   if (!promo || !promo.isActive) {
    //     throw new BadRequestException("Invalid or inactive promo code");
    //   }

    //   const now = new Date();
    //   if (promo.validUntil && now > promo.validUntil) {
    //     throw new BadRequestException("Promo code has expired");
    //   }

    //   if (now < promo.validFrom) {
    //     throw new BadRequestException("Promo code is not yet valid");
    //   }

    //   if (promo.maxUses && promo.currentUses >= promo.maxUses) {
    //     throw new BadRequestException("Promo code usage limit reached");
    //   }

    //   // Check if promo is applicable for giftcard sell
    //   if (promo.applicableFor !== "GIFTCARD_SELL") {
    //     throw new BadRequestException(
    //       "This promo code is not applicable for giftcard sales",
    //     );
    //   }

    //   // Check minimum sale amount requirement
    //   if (
    //     promo.minSaleAmount &&
    //     basePayoutAmount < Number(promo.minSaleAmount)
    //   ) {
    //     throw new BadRequestException(
    //       `This promo code requires a minimum payout of ₦${Number(
    //         promo.minSaleAmount,
    //       ).toLocaleString()}`,
    //     );
    //   }

    //   // Calculate promo bonus (adds to payout)
    //   if (promo.bonusType === "PERCENTAGE") {
    //     promoBonus = (basePayoutAmount * Number(promo.bonusAmount)) / 100;
    //   } else {
    //     // FIXED
    //     promoBonus = Number(promo.bonusAmount);
    //   }

    //   promoCodeId = promo.id;

    //   logger.info("Promo code applied to sale:", {
    //     code: promo.code,
    //     bonusType: promo.bonusType,
    //     bonusAmount: promo.bonusAmount,
    //     promoBonus,
    //     basePayoutAmount,
    //   });
    // }

    const finalPayoutAmount = basePayoutAmount;

    logger.info("Sale payout calculated:", {
      cardType: acceptedCard.cardType,
      cardValue: data.cardValue,
      quantity: data.quantity,
      buyingRate,
      basePayoutAmount,
      // promoBonus,
      finalPayoutAmount,
    });

    return {
      acceptedCardId: acceptedCard.id,
      cardType: acceptedCard.cardType,
      cardRange: data.cardRange,
      cardValue: data.cardValue,
      quantity: data.quantity,
      receiptType: data.receiptType,
      buyingRate,
      totalCardValue,
      payoutAmount: Math.round(finalPayoutAmount),
      currency: acceptedCard.currency,
      // breakdown: {
      //   promoDiscount: promoBonus > 0 ? promoBonus : undefined,
      // },
      // promoCodeId,
    };
  }

  async submitSale(
    data: SubmitSaleDto,
    userId: string,
    imageUrls: string[],
  ): Promise<GiftCardSaleDetailDTO> {
    if (imageUrls.length < GIFTCARD_CONSTRAINTS.MIN_SALE_IMAGES) {
      throw new BadRequestException(
        RESPONSE_MESSAGES.ERRORS.MIN_IMAGES_REQUIRED,
      );
    }

    if (imageUrls.length > GIFTCARD_CONSTRAINTS.MAX_SALE_IMAGES) {
      throw new BadRequestException(
        RESPONSE_MESSAGES.ERRORS.MAX_IMAGES_EXCEEDED,
      );
    }

    logger.info("Calculating payout with input data:", {
      acceptedCardId: data.acceptedCardId,
      inputCardRange: data.cardRange,
      inputReceiptType: data.receiptType,
      cardValue: data.cardValue,
      quantity: data.quantity,
    });

    const calculation = await this.calculateSalePayout({
      acceptedCardId: data.acceptedCardId,
      cardRange: data.cardRange,
      receiptType: data.receiptType,
      cardValue: data.cardValue,
      quantity: data.quantity,
      promoCode: data.promoCode,
    });

    logger.info("Payout calculated with matched values:", {
      matchedCardRange: calculation.cardRange,
      matchedReceiptType: calculation.receiptType,
      cardValue: calculation.cardValue,
      quantity: calculation.quantity,
      payoutAmount: calculation.payoutAmount,
    });

    const tolerance = 1;
    const payoutMatch =
      Math.abs(data.calculatedPayout - calculation.payoutAmount) <= tolerance;

    if (!payoutMatch) {
      logger.error("Payout calculation mismatch:", {
        client: {
          calculatedPayout: data.calculatedPayout,
          inputCardRange: data.cardRange,
          inputReceiptType: data.receiptType,
          cardValue: data.cardValue,
          quantity: data.quantity,
        },
        server: {
          expectedPayout: calculation.payoutAmount,
          matchedCardRange: calculation.cardRange,
          matchedReceiptType: calculation.receiptType,
          buyingRate: calculation.buyingRate,
          totalCardValue: calculation.totalCardValue,
          // breakdown: calculation.breakdown,
        },
        difference: Math.abs(data.calculatedPayout - calculation.payoutAmount),
      });
      throw new BadRequestException(
        "Payout calculation mismatch. Please refresh and try again.",
      );
    }

    const acceptedCard = await prisma.acceptedGiftCard.findUnique({
      where: { id: data.acceptedCardId },
    });

    if (!acceptedCard) {
      throw new NotFoundException("Accepted card not found");
    }

    const encryptedCode = data.cardCode ? encrypt(data.cardCode) : null;
    const encryptedPin = data.cardPin ? encrypt(data.cardPin) : null;

    const saleReference = `GCS|${generateTransactionReference()}`;
    const sessionId = generateSessionId();

    logger.info("Creating giftcard sale with data:", {
      userId,
      acceptedCardId: data.acceptedCardId,
      cardType: calculation.cardType,
      country: acceptedCard.country,
      cardRange: calculation.cardRange,
      cardValue: calculation.cardValue,
      cardCurrency: calculation.currency,
      quantity: calculation.quantity,
      receiptType: calculation.receiptType,
      imageCount: imageUrls.length,
      // hasCode: !!encryptedCode,
      // hasPin: !!encryptedPin,
    });

    const result = await prisma.$transaction(async (tx) => {
      const sale = await tx.giftcardSales.create({
        data: {
          userId,
          acceptedCardId: data.acceptedCardId,
          cardType: calculation.cardType,
          country: acceptedCard.country,
          cardRange: calculation.cardRange,
          cardValue: calculation.cardValue,
          cardCurrency: calculation.currency,
          quantity: calculation.quantity,
          receiptType: calculation.receiptType,
          cardImages: imageUrls,
          encryptedCardCode: encryptedCode,
          encryptedCardPin: encryptedPin,
          userNotes: data.userNotes || null,
          buyingRate: calculation.buyingRate,
          totalCardValue: calculation.totalCardValue,
          payoutAmount: calculation.payoutAmount,
          promoCode: data.promoCode || null,
          // promoDiscount: calculation.breakdown.promoDiscount || 0,
          status: "SUBMITTED",
        },
      });

      const transaction = await tx.transaction.create({
        data: {
          userId,
          category: TransactionCategory.GIFTCARDS,
          type: TransactionType.CREDIT,
          status: "PENDING",
          amount: calculation.payoutAmount,
          currency: "NGN",
          reference: saleReference,
          sessionId,
          narration:
            data.userNotes ||
            `Gift card sale - ${sale.cardType} (${sale.quantity}x ${sale.cardCurrency}${sale.cardValue}) - Pending Review`,
          provider: "Trade Aviator",
          internalRef: `GCSALE-${sale.id.slice(-8).toUpperCase()}`,
          giftcardSaleId: sale.id,
          channel: sale.paymentMethod,

          giftCardQuantity: sale.quantity,
          giftCardType: sale.cardType,
          giftCardValue: sale.cardValue,
          giftCardReceipt: sale.receiptType,
          rate: sale.buyingRate.toString(),

          gcCountry: acceptedCard!.country,
          gcCardRange: calculation.cardRange,
          gcCardCurrency: calculation.currency,
          gcEncryptedCode: encryptedCode,
          gcEncryptedPin: encryptedPin,
          gcAcceptedCardId: data.acceptedCardId,

          meta: {
            ...createGiftcardSaleMeta({
              saleId: sale.id,
              saleReference,
              acceptedCardId: data.acceptedCardId,
              cardType: calculation.cardType,
              country: acceptedCard!.country,
              cardRange: calculation.cardRange,
              cardValue: calculation.cardValue,
              cardCurrency: calculation.currency,
              quantity: calculation.quantity,
              receiptType: calculation.receiptType,
              buyingRate: calculation.buyingRate,
              totalCardValue: calculation.totalCardValue,
              payoutAmount: calculation.payoutAmount,
              promoCodeUsed: data.promoCode,
              // promoDiscount: calculation.breakdown.promoDiscount || 0,
              saleStatus: "SUBMITTED",
            }),
            cardImages: imageUrls,
            promoCode: data.promoCode,
            // promoDiscount:
            //   calculation.breakdown.promoDiscount?.toString() || "0",
          } as any,
        },
      });

      await tx.giftcardSales.update({
        where: { id: sale.id },
        data: { transactionId: transaction.id },
      });

      // Increment promo code usage count if promo code was used
      // if (calculation.promoCodeId) {
      //   await tx.promoCode.update({
      //     where: { id: calculation.promoCodeId },
      //     data: {
      //       currentUses: {
      //         increment: 1,
      //       },
      //     },
      //   });
      // }

      return { sale, transaction };
    });

    logger.info("Gift card sale submitted with transaction:", {
      saleId: result.sale.id,
      transactionId: result.transaction.id,
      userId,
      cardType: result.sale.cardType,
      payoutAmount: result.sale.payoutAmount,
    });

    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { fullname: true, email: true },
      });

      await AdminNotificationService.createNotification({
        type: "GIFTCARD",
        priority: calculation.payoutAmount >= 50000 ? "high" : "medium",
        title: "New Gift Card Sale Submitted",
        message: `${user?.fullname || "User"} submitted a ${calculation.cardType} sale worth ₦${calculation.payoutAmount.toLocaleString()}`,
        metadata: {
          saleId: result.sale.id,
          transactionId: result.transaction.id,
          userId,
          userName: user?.fullname,
          userEmail: user?.email,
          cardType: calculation.cardType,
          country: acceptedCard.country,
          cardRange: calculation.cardRange,
          cardValue: calculation.cardValue,
          quantity: calculation.quantity,
          receiptType: calculation.receiptType,
          payoutAmount: calculation.payoutAmount,
          currency: calculation.currency,
          action: "new_giftcard_sale",
        },
      });

      logger.info(
        `Admin notification created for gift card sale ${result.sale.id}`,
      );
    } catch (error) {
      logger.error("Failed to create admin notification for gift card sale:", {
        error,
      });
    }

    return new GiftCardSaleDetailDTO(result.sale);
  }

  async getUserSaleById(
    saleId: string,
    userId: string,
  ): Promise<GiftCardSaleDetailDTO> {
    const sale = await prisma.giftcardSales.findFirst({
      where: {
        id: saleId,
        userId,
      },
    });

    if (!sale) {
      throw new NotFoundException(RESPONSE_MESSAGES.ERRORS.SALE_NOT_FOUND);
    }

    return new GiftCardSaleDetailDTO(sale);
  }

  async cancelSale(saleId: string, userId: string): Promise<void> {
    const sale = await prisma.giftcardSales.findFirst({
      where: {
        id: saleId,
        userId,
      },
    });

    if (!sale) {
      throw new NotFoundException(RESPONSE_MESSAGES.ERRORS.SALE_NOT_FOUND);
    }

    if (sale.status !== "SUBMITTED") {
      throw new BadRequestException(RESPONSE_MESSAGES.ERRORS.CANNOT_CANCEL);
    }

    await prisma.giftcardSales.update({
      where: { id: saleId },
      data: { status: "CANCELLED" },
    });

    logger.info("Gift card sale cancelled:", {
      saleId,
      userId,
    });
  }
}

export const giftCardSellingService = new GiftCardSellingService();
