export interface ReloadlyTokenResponse {
    access_token: string;
    expires_in: number;
    token_type: string;
}

export interface ReloadlyProduct {
    productId: number;
    productName: string;
    countryCode: string;
    denominationType: string;
    senderCurrencyCode: string;
    senderCurrencySymbol: string;
    recipientCurrencyCode: string;
    minRecipientDenomination: number | null;
    maxRecipientDenomination: number | null;
    fixedRecipientDenominations: number[];
    senderFee: number;
    discountPercentage: number;
    logoUrls: string[];
    brand: {
        brandId: number;
        brandName: string;
    };
    country: {
        isoName: string;
        name: string;
        flagUrl: string;
    };
}

export interface ReloadlyOrderRequest {
    productId: number;
    countryCode: string;
    quantity: number;
    unitPrice: number;
    customIdentifier: string;
    senderName?: string;
    recipientEmail?: string;
    recipientPhoneDetails?: {
        countryCode: string;
        phoneNumber: string;
    };
}

export interface ReloadlyOrderResponse {
    transactionId: number;
    amount: number;
    discount: number;
    currencyCode: string;
    fee: number;
    smsFee: number;
    recipientEmail: string;
    customIdentifier: string;
    status: string;
    product: any;
    transactionCreatedTime: string;
    pinDetail?: {
        serial: string;
        code: string;
        validity: string;
    };
}
