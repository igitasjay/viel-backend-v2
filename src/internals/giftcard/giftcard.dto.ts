import { z } from "zod";
import { giftCardValidation } from "./giftcard.validation";
import Decimal from "decimal.js";

export type CalculatePriceDto = z.infer<
    typeof giftCardValidation.calculatePriceSchema
>;
export type PlaceOrderDto = z.infer<typeof giftCardValidation.placeOrderSchema>;

export interface CalculatePriceResponse {
    productName: string;
    reloadlyId: string;
    cardValue: number;
    cardCurrency: string;
    quantity: number;
    basePrice: number;
    fee: number;
    promoDiscount: number;
    totalAmount: number;
    breakdown: {
        exchangeRate: number;
        feePercentage: number;
        promoApplied: boolean;
        promoCode?: string;
    };
    quoteId: string;
    expiresAt: Date;
    expiresInMinutes: number;
}

export class PlaceOrderResponseDTO {
    orderId: string;
    orderReference: string;
    productName: string;
    cardValue: number;
    quantity: number;
    totalAmount: number | Decimal;
    paymentMethod: string;
    status: string;
    transactionId: string;
    message: string;
    paymentDetails?: any;
    createdAt: string;

    constructor(data: {
        orderId: string;
        orderReference: string;
        productName: string;
        cardValue: number;
        quantity: number;
        totalAmount: number | Decimal;
        paymentMethod: string;
        status: string;
        transactionId: string;
        message: string;
        paymentDetails?: any;
        createdAt: Date;
    }) {
        this.orderId = data.orderId;
        this.orderReference = data.orderReference;
        this.productName = data.productName;
        this.cardValue = data.cardValue;
        this.quantity = data.quantity;
        this.totalAmount = data.totalAmount;
        this.paymentMethod = data.paymentMethod;
        this.status = data.status;
        this.transactionId = data.transactionId;
        this.message = data.message;
        this.paymentDetails = data.paymentDetails;
        this.createdAt = data.createdAt.toISOString();
    }
}

export class OrderHistoryItemDTO {
    orderId: string;
    orderReference: string;
    productName: string;
    country: string;
    cardValue: number;
    quantity: number;
    totalAmount: number;
    paymentMethod: string;
    status: string;
    createdAt: string;
    codes?: Array<{
        code: string;
        pin: string | null;
        redemptionUrl: string | null;
    }>;

    constructor(
        order: any,
        codes?: Array<{
            code: string;
            pin: string | null;
            redemptionUrl: string | null;
        }>,
    ) {
        // Extract giftcard metadata from transaction.meta.giftcard
        const gcMeta = order.meta?.giftcard || order;

        this.orderId = order.id;
        this.orderReference = gcMeta.orderReference || order.reference;
        this.productName = gcMeta.cardType;
        this.country = gcMeta.country;
        this.cardValue = Number(gcMeta.denomination);
        this.quantity = gcMeta.quantity;
        this.totalAmount = Number(gcMeta.nairaValue);
        this.paymentMethod = gcMeta.paymentMethod;
        this.status = order.status;
        this.createdAt = order.createdAt.toISOString();
        if (codes && codes.length > 0) {
            this.codes = codes;
        }
    }
}

export class OrderDetailsDTO {
    orderId: string;
    orderReference: string;
    productName: string;
    country: string;
    currency: string;
    cardValue: number;
    quantity: number;
    rate: number;
    cardTotal: number;
    fee: number;
    promoDiscount: number;
    totalAmount: number;
    paymentMethod: string;
    status: string;
    transactionId: string;
    codes: GiftCardCodeDTO[];
    createdAt: string;
    updatedAt: string;

    constructor(order: any, decryptedCodes: GiftCardCodeDTO[]) {
        // Extract giftcard metadata from transaction.meta.giftcard
        const gcMeta = order.meta?.giftcard || order;

        this.orderId = order.id;
        this.orderReference = gcMeta.orderReference || order.reference;
        this.productName = gcMeta.cardType;
        this.country = gcMeta.country;
        this.currency =
            order.product?.currency || order.meta?.cardCurrency || "USD";
        this.cardValue = Number(gcMeta.denomination);
        this.quantity = gcMeta.quantity;
        this.rate = Number(gcMeta.rate);
        this.cardTotal = Number(gcMeta.cardTotal);
        this.fee = Number(gcMeta.fee);
        this.promoDiscount = Number(gcMeta.promoDiscount);
        this.totalAmount = Number(gcMeta.nairaValue);
        this.paymentMethod = gcMeta.paymentMethod;
        this.status = order.status;
        this.transactionId = order.id;
        this.codes = decryptedCodes;
        this.createdAt = order.createdAt.toISOString();
        this.updatedAt = order.updatedAt.toISOString();
    }
}

export class GiftCardCodeDTO {
    codeId: string;
    code: string;
    pin: string | null;
    status: string;
    deliveredAt: string | null;

    constructor(
        codeData: any,
        decryptedCode: string,
        decryptedPin: string | null,
    ) {
        this.codeId = codeData.id;
        this.code = decryptedCode;
        this.pin = decryptedPin;
        this.status = codeData.status;
        this.deliveredAt = codeData.deliveredAt?.toISOString() || null;
    }
}

export class AcceptedCardBrandDTO {
    cardType: string;
    cardName: string;
    imageUrl: string | null;

    constructor(card: any) {
        this.cardType = card.cardType;
        this.cardName = card.cardName;
        this.imageUrl = card.imageUrl ?? null;
    }
}
export class AcceptedGiftCardDTO {
    id: string;
    cardName: string;
    cardType: string;
    country: string;
    currency: string;
    availableRanges: string[];
    receiptTypes: string[];
    rates: Record<string, any>;
    imageUrl: string | null;
    isActive: boolean;

    constructor(card: any) {
        this.id = card.id;
        this.cardName = card.cardName;
        this.cardType = card.cardType;
        this.country = card.country;
        this.currency = card.currency;
        this.availableRanges = card.availableRanges as string[];
        this.receiptTypes = card.receiptTypes as string[];
        this.rates = card.rates as Record<string, any>;
        this.imageUrl = card.imageUrl;
        this.isActive = card.isActive;
    }
}

export class AcceptedGiftCardDetailDTO extends AcceptedGiftCardDTO {
    rates: any;
    createdAt: string;
    updatedAt: string;

    constructor(card: any) {
        super(card);
        this.rates = card.rates;
        this.createdAt = card.createdAt.toISOString();
        this.updatedAt = card.updatedAt.toISOString();
    }
}

export interface CalculateSalePayoutResponse {
    acceptedCardId: string;
    cardType: string;
    cardRange: string;
    cardValue: number;
    quantity: number;
    receiptType: string;
    buyingRate: number;
    totalCardValue: number;
    payoutAmount: number;
    currency: string;
    // breakdown: {
    //     promoDiscount?: number;
    // };
    promoCodeId?: string;
}

export class GiftCardSaleListItemDTO {
    id: string;
    cardType: string;
    country: string;
    cardRange: string;
    cardValue: number;
    quantity: number;
    payoutAmount: number;
    status: string;
    createdAt: string;

    constructor(sale: any) {
        this.id = sale.id;
        this.cardType = sale.cardType;
        this.country = sale.country;
        this.cardRange = sale.cardRange;
        this.cardValue = Number(sale.cardValue);
        this.quantity = sale.quantity;
        this.payoutAmount = Number(sale.payoutAmount);
        this.status = sale.status;
        this.createdAt = sale.createdAt.toISOString();
    }
}

export class GiftCardSaleDetailDTO {
    id: string;
    userId: string;
    cardType: string;
    country: string;
    cardRange: string;
    cardValue: number;
    cardCurrency: string;
    quantity: number;
    receiptType: string;
    cardImages: string[];
    userNotes: string | null;
    buyingRate: number;
    totalCardValue: number;
    payoutAmount: number;
    promoCode: string | null;
    promoDiscount: number;
    status: string;
    reviewedBy: string | null;
    reviewedAt: string | null;
    reviewNotes: string | null;
    rejectionReason: string | null;
    paymentMethod: string;
    transactionId: string | null;
    paidAt: string | null;
    createdAt: string;
    updatedAt: string;

    constructor(sale: any) {
        this.id = sale.id;
        this.userId = sale.userId;
        this.cardType = sale.cardType;
        this.country = sale.country;
        this.cardRange = sale.cardRange;
        this.cardValue = Number(sale.cardValue);
        this.cardCurrency = sale.cardCurrency;
        this.quantity = sale.quantity;
        this.receiptType = sale.receiptType;
        this.cardImages = sale.cardImages;
        this.userNotes = sale.userNotes;
        this.buyingRate = Number(sale.buyingRate);
        this.totalCardValue = Number(sale.totalCardValue);
        this.payoutAmount = Number(sale.payoutAmount);
        this.promoCode = sale.promoCode;
        this.promoDiscount = Number(sale.promoDiscount);
        this.status = sale.status;
        this.reviewedBy = sale.reviewedBy;
        this.reviewedAt = sale.reviewedAt?.toISOString() || null;
        this.reviewNotes = sale.reviewNotes;
        this.rejectionReason = sale.rejectionReason;
        this.paymentMethod = sale.paymentMethod;
        this.transactionId = sale.transactionId;
        this.paidAt = sale.paidAt?.toISOString() || null;
        this.createdAt = sale.createdAt.toISOString();
        this.updatedAt = sale.updatedAt.toISOString();
    }
}
