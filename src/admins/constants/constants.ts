export const RESPONSE_MESSAGES = {
    GIFTCARD: {
        ACCEPTED_CARDS_FETCHED: "Accepted gift cards retrieved successfully",
        CARD_ADDED: "Gift card added to accepted list successfully",
        CARD_UPDATED: "Gift card details updated successfully",
        CARD_DELETED: "Gift card removed from accepted list",
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
        ALREADY_REVIEWED: "This sale has already been reviewed",
        PAYMENT_FAILED: "Payment processing failed",
    },
};

export const GIFTCARD_CONSTRAINTS = {
    MIN_SALE_IMAGES: 1,
    MAX_SALE_IMAGES: 10,
    MAX_IMAGE_SIZE: 5 * 1024 * 1024,
    ALLOWED_IMAGE_TYPES: ["image/jpeg", "image/jpg", "image/png", "image/webp"],
};

// export const RECEIPT_TYPES = {
//   CASH_RECEIPT: "CASH_RECEIPT",
//   DEBIT_RECEIPT: "DEBIT_RECEIPT",
//   NO_RECEIPT: "NO_RECEIPT",
//   E-CODE: "E-CODE",
// };

export const NOTIFICATION_CONSTRAINTS = {
    BATCH_SIZE: 100,
    MAX_BROADCAST_RECIPIENTS: 10000,
    ANALYTICS_DEFAULT_DAYS: 90,
    DAILY_STATS_DAYS: 30,
};
