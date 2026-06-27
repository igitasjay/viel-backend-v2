import { Decimal } from "@prisma/client/runtime/client";

export interface GiftcardMetadata {
    orderId?: string;
    orderReference: string;
    productId: string;
    cardType: string;
    country: string;

    denomination: number | Decimal;
    quantity: number;
    rate: number | Decimal;
    cardTotal: number | Decimal;
    fee: number | Decimal;
    promoDiscount: number | Decimal;
    nairaValue: number | Decimal;

    paymentMethod: string;

    reloadlyOrderId?: string;
    reloadlyData?: any;

    externalRef?: string;

    promoCodeId?: string;
    promoCodeUsed?: string;

    orderStatus?: string;
    failureReason?: string;

    giftcardPurchaseCodes?: Array<{
        codeId: string;
        code: string;
        pin: string | null;
        redemptionUrl: string | null;
        status: string;
        deliveredAt: string;
    }>;
}

export function getGiftcardMeta(transaction: any): GiftcardMetadata | null {
    const meta = transaction?.meta as any;
    return meta?.giftcard || null;
}

export function createGiftcardMeta(data: Partial<GiftcardMetadata>): {
    giftcard: GiftcardMetadata;
} {
    return {
        giftcard: {
            orderReference: data.orderReference!,
            productId: data.productId!,
            cardType: data.cardType!,
            country: data.country!,
            denomination: data.denomination!,
            quantity: data.quantity!,
            rate: data.rate!,
            cardTotal: data.cardTotal!,
            fee: data.fee!,
            promoDiscount: data.promoDiscount || 0,
            nairaValue: data.nairaValue!,
            paymentMethod: data.paymentMethod!,
            reloadlyOrderId: data.reloadlyOrderId,
            reloadlyData: data.reloadlyData,
            promoCodeId: data.promoCodeId,
            promoCodeUsed: data.promoCodeUsed,
            orderStatus: data.orderStatus,
            failureReason: data.failureReason,
        },
    };
}

export function updateGiftcardMeta(
    existingMeta: any,
    updates: Partial<GiftcardMetadata>,
): any {
    const currentGiftcard = (existingMeta?.giftcard || {}) as GiftcardMetadata;

    return {
        ...existingMeta,
        giftcard: {
            ...currentGiftcard,
            ...updates,
        },
    };
}

export function isGiftcardTransaction(transaction: any): boolean {
    return (
        transaction?.category === "GIFTCARDS" || !!getGiftcardMeta(transaction)
    );
}

export interface GiftcardSaleMetadata {
    saleId: string;
    saleReference: string;
    acceptedCardId: string;
    cardType: string;
    country: string;

    cardRange: string;
    cardValue: number | Decimal;
    cardCurrency: string;
    quantity: number;
    receiptType: string;

    buyingRate: number | Decimal;
    totalCardValue: number | Decimal;
    payoutAmount: number | Decimal;

    promoCodeUsed?: string;
    promoDiscount: number | Decimal;

    saleStatus?: string;
    reviewNotes?: string;
    rejectionReason?: string;
}

export function getGiftcardSaleMeta(
    transaction: any,
): GiftcardSaleMetadata | null {
    const meta = transaction?.meta as any;
    return meta?.giftcardSale || null;
}

export function createGiftcardSaleMeta(data: Partial<GiftcardSaleMetadata>): {
    giftcardSale: GiftcardSaleMetadata;
} {
    return {
        giftcardSale: {
            saleId: data.saleId!,
            saleReference: data.saleReference!,
            acceptedCardId: data.acceptedCardId!,
            cardType: data.cardType!,
            country: data.country!,
            cardRange: data.cardRange!,
            cardValue: data.cardValue!,
            cardCurrency: data.cardCurrency!,
            quantity: data.quantity!,
            receiptType: data.receiptType!,
            buyingRate: data.buyingRate!,
            totalCardValue: data.totalCardValue!,
            payoutAmount: data.payoutAmount!,
            promoCodeUsed: data.promoCodeUsed,
            promoDiscount: data.promoDiscount || 0,
            saleStatus: data.saleStatus,
            reviewNotes: data.reviewNotes,
            rejectionReason: data.rejectionReason,
        },
    };
}

export function updateGiftcardSaleMeta(
    existingMeta: any,
    updates: Partial<GiftcardSaleMetadata>,
): any {
    const currentGiftcardSale = (existingMeta?.giftcardSale ||
        {}) as GiftcardSaleMetadata;

    return {
        ...existingMeta,
        giftcardSale: {
            ...currentGiftcardSale,
            ...updates,
        },
    };
}
