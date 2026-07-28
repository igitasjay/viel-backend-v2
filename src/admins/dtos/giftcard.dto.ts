// import { z } from "zod";
// import { giftCardValidation } from "../validations/giftcard.validation"
import Decimal from "decimal.js";

// export type CalculatePriceDto = z.infer<typeof giftCardValidation.calculatePriceSchema>;
// export type PlaceOrderDto = z.infer<typeof giftCardValidation.placeOrderSchema>;

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
        this.createdAt = data.createdAt.toISOString();
    }
}

export class OrderHistoryItemDTO {
    id: string;
    userId: string;
    productName: string;
    country: string;
    category: string;
    channel: string;
    cardType: string;
    cardValue: number;
    quantity: number;
    totalAmount: number;
    //   paymentMethod: string;
    status: string;
    createdAt: string;

    constructor(order: any) {
        this.id = order.id;
        this.userId = order.userId;
        this.productName = order.cardType;
        this.country = order.country;
        this.category = order.category;
        this.channel = order.channel;
        this.cardValue = order.giftCardValue;
        this.cardType = order.giftCardType;
        this.quantity = order.giftCardQuantity;
        this.totalAmount = Number(order.nairaValue);
        this.status = order.status;
        this.createdAt = order.createdAt.toISOString();
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
        this.orderId = order.id;
        this.orderReference = order.orderReference;
        this.productName = order.cardType;
        this.country = order.country;
        this.currency = order.product?.currency || "USD";
        this.cardValue = Number(order.denomination);
        this.quantity = order.quantity;
        this.rate = Number(order.rate);
        this.cardTotal = Number(order.cardTotal);
        this.fee = Number(order.fee);
        this.promoDiscount = Number(order.promoDiscount);
        this.totalAmount = Number(order.nairaValue);
        this.paymentMethod = order.paymentMethod;
        this.status = order.status;
        this.transactionId = order.transactionId || "";
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

export class AcceptedGiftCardDTO {
    id: string;
    cardName: string;
    cardType: string;
    country: string;
    currency: string;
    availableRanges: string[];
    receiptTypes: string[];

    imageUrl: string | null;
    instructions: string | null;
    isActive: boolean;

    constructor(card: any) {
        this.id = card.id;
        this.cardName = card.cardName;
        this.cardType = card.cardType;
        this.country = card.country;
        this.currency = card.currency;
        this.availableRanges = card.availableRanges as string[];
        this.receiptTypes = card.receiptTypes as string[];

        this.imageUrl = card.imageUrl;
        this.instructions = card.instructions;
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
    cardType: string;
    cardRange: string;
    cardValue: number;
    quantity: number;
    receiptType: string;
    buyingRate: number;
    totalCardValue: number;
    payoutAmount: number;
    currency: string;
    breakdown: {
        baseRate: number;
        // appliedRate: number;
        receiptModifier?: number;
        promoDiscount?: number;
    };
}

export class GiftCardSaleListItemDTO {
    id: string;
    userid: string;
    cardType: string;
    country: string;
    cardRange: string;
    cardValue: number;
    quantity: number;
    payoutAmount: number;
    reviewedBy: string | null;
    reviewedAt: string | null;
    reviewNotes: string | null;
    rejectionReason: string | null;
    images: string[];
    status: string;
    createdAt: string;

    constructor(sale: any) {
        this.id = sale.id;
        this.userid = sale.userId;
        this.cardType = sale.giftCardType;
        this.country = sale.gcCountry;
        this.cardRange = sale.gcCardRange;
        this.cardValue = Number(sale.giftCardValue);
        this.quantity = sale.giftCardQuantity;
        this.payoutAmount = Number(sale.amount);
        this.images = (sale.meta as any)?.cardImages || [];
        this.reviewedBy = sale.reviewedBy;
        this.reviewedAt = sale.reviewedAt?.toISOString() || null;
        this.reviewNotes = sale.reviewNotes;
        this.rejectionReason = sale.rejectionReason;
        this.status = sale.status;
        this.createdAt = sale.createdAt.toISOString();
    }
}

export class GiftCardSaleDetailDTO {
    id: string;
    userid: string;
    cardType: string;
    country: string;
    cardRange: string;
    cardValue: number;
    quantity: number;
    payoutAmount: number;
    reviewedBy: string | null;
    reviewedAt: string | null;
    reviewNotes: string | null;
    rejectionReason: string | null;
    images: string[];
    decryptedCode: string | null;
    decryptedPin: string | null;
    status: string;
    createdAt: string;

    constructor(
        sale: any,
        decryptedCode?: string | any,
        decryptedPin?: string | any,
    ) {
        this.id = sale.id;
        this.userid = sale.userId;
        this.cardType = sale.giftCardType;
        this.country = sale.gcCountry;
        this.cardRange = sale.gcCardRange;
        this.cardValue = Number(sale.giftCardValue);
        this.quantity = sale.giftCardQuantity;
        this.payoutAmount = Number(sale.amount);
        this.images = (sale.meta as any)?.cardImages || [];
        this.reviewedBy = sale.reviewedBy;
        this.reviewedAt = sale.reviewedAt?.toISOString() || null;
        this.reviewNotes = sale.reviewNotes;
        this.rejectionReason = sale.rejectionReason;
        this.decryptedCode = decryptedCode || null;
        this.decryptedPin = decryptedPin || null;
        this.status = sale.status;
        this.createdAt = sale.createdAt.toISOString();
    }
}
