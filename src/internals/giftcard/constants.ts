export const RESPONSE_MESSAGES = {
    GIFTCARD: {
        PRODUCTS_FETCHED: "Gift card products retrieved successfully",
        PRICE_CALCULATED: "Price calculated successfully",
        ORDER_PLACED: "Order placed successfully",
        ORDER_COMPLETED: "Order completed successfully. Gift card codes are ready.",
        ORDER_PENDING: "Order placed. Gift card codes will be available shortly.",
        SYNC_COMPLETED: "Product sync completed successfully",
        SYNC_WITH_ERRORS: "Product sync completed with warnings",
        SYNC_FAILED: "Product sync failed",
        CODES_REFRESHED: "Gift card codes retrieved successfully",
        CODES_NOT_READY: "Codes are not ready yet. Please try again in a moment.",
        ORDER_CANCELLED: "Order cancelled and refunded successfully",
        ACCEPTED_CARDS_FETCHED: "Accepted gift cards retrieved successfully",
        CARD_ADDED: "Gift card added to accepted list successfully",
        CARD_UPDATED: "Gift card details updated successfully",
        CARD_DELETED: "Gift card removed from accepted list",
        RATE_CALCULATED: "Gift Card rate calculated",
        SALE_CALCULATED: "Payout amount calculated successfully",
        SALE_SUBMITTED: "Gift card submitted for review successfully",
        SALES_FETCHED: "Gift card sales retrieved successfully",
        SALE_FETCHED: "Sale details retrieved successfully",
        SALE_CANCELLED: "Sale cancelled successfully",
        SALE_REVIEWED: "Sale moved to review",
        SALE_APPROVED: "Sale approved and payment processed",
        SALE_REJECTED: "Sale rejected",
    },
    ERRORS: {
        PRODUCT_NOT_FOUND: "Gift card product not found",
        PRODUCT_UNAVAILABLE: "This gift card is currently unavailable",
        INVALID_QUOTE: "Invalid or already used quote",
        QUOTE_EXPIRED: "Price quote has expired. Please recalculate the price.",
        INVALID_PIN: "Invalid transaction PIN",
        INSUFFICIENT_BALANCE: "Insufficient balance",
        WALLET_NOT_FOUND: "Wallet not found",
        VIRTUAL_ACCOUNT_NOT_FOUND: "Virtual account not found",
        SECURITY_NOT_FOUND: "User security settings not found",
        CURRENCY_MISMATCH:
            "Payment source currency does not match transaction currency",
        ORDER_FAILED: "Failed to process gift card order",
        ORDER_NOT_FOUND: "Order not found",
        INVALID_PROMO_CODE: "Invalid or expired promo code",
        PROMO_CODE_LIMIT_REACHED: "Promo code usage limit reached",
        CODES_ALREADY_DELIVERED: "Codes have already been delivered for this order",
        CANNOT_REFRESH_CODES:
            "Cannot refresh codes for orders not in PROCESSING status",
        CANNOT_CANCEL_ORDER:
            "Cannot cancel order. Only PENDING orders can be cancelled",
        REFUND_FAILED: "Order cancelled but refund failed. Please contact support.",
        CARD_NOT_ACCEPTED: "This gift card type is not currently accepted",
        CARD_INACTIVE: "This gift card is temporarily not being accepted",
        INVALID_CARD_RANGE: "Invalid card range for this card type",
        INVALID_RECEIPT_TYPE: "Invalid receipt type for this card type",
        VALUE_OUT_OF_RANGE: "Card value must be within acceptable range",
        MIN_IMAGES_REQUIRED: "At least 1 image is required",
        MAX_IMAGES_EXCEEDED: "Maximum 10 images allowed",
        IMAGE_UPLOAD_FAILED: "Failed to upload profile picture",
        SALE_NOT_FOUND: "Sale submission not found",
        CANNOT_CANCEL: "Only SUBMITTED sales can be cancelled",
        ALREADY_PAID: "This sale has already been paid",
        ALREADY_REJECTED: "This sale has already been rejected",
        ALREADY_CANCELLED: "This sale has already been cancelled",
        PAYMENT_FAILED: "Payment processing failed",
    },
};

export const GIFTCARD_FEE_TYPE = {
    FIXED: "FIXED",
    PERCENTAGE: "PERCENTAGE",
};

export const GIFTCARD_FEE_PER_CARD = {
    TYPE: GIFTCARD_FEE_TYPE.FIXED,
    VALUE: 150,
};

export const GIFTCARD_CONSTRAINTS = {
    QUOTE_EXPIRY_MINUTES: 5,
    STALENESS_CHECK_HOURS: 12,
    CODE_FETCH_DELAY_MS: 2000,
    MAX_CODE_REFRESH_ATTEMPTS: 5,
    MIN_SALE_IMAGES: 1,
    MAX_SALE_IMAGES: 10,
    MAX_IMAGE_SIZE: 5 * 1024 * 1024,
    ALLOWED_IMAGE_TYPES: ["image/jpeg", "image/jpg", "image/png", "image/webp"],
};

export const RECEIPT_TYPES = {
    E_CODE: "E-CODE",
    PHYSICAL: "PHYSICAL",
};
