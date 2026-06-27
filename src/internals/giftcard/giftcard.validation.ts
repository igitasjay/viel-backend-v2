import { z } from "zod";
// import { PaymentMethod } from "../../enums";

const calculatePriceSchema = z.object({
    reloadlyId: z.string().min(1, "Product ID is required"),
    value: z.number().positive("Value must be a positive number"),
    quantity: z.number().int().min(1, "Quantity must be at least 1").default(1),
    promoCode: z.string().optional(),
});

// const paymentMethod = z.enum(Object.values(PaymentMethod), {
//   error: "Payment method must be either 'WALLET' or 'VIRTUAL'.",
// });

const placeOrderSchema = z.object({
    quoteId: z.string().min(1, "Quote ID is required"),
    pin: z.string().regex(/^\d{4}$/, "Pin must be exactly 4 digits"),
    paymentMethod: z.enum(["WALLET", "VIRTUAL_ACCOUNT"]).default("WALLET"),
    // paymentMethod: paymentMethod,
    currency: z.string().default("ngn"),
});

const refreshCodesSchema = z.object({
    orderId: z.string().min(1, "Order ID is required"),
});

const cancelOrderSchema = z.object({
    orderId: z.string().min(1, "Order ID is required"),
    reason: z.string().optional(),
});

const placeDirectOrderBodySchema = z.object({
    reloadlyId: z.string().min(1, "Product ID is required"),
    cardValue: z.number().positive("Card value must be positive"),
    quantity: z.number().int().min(1, "Quantity must be at least 1"),
    calculatedSubtotal: z.number().positive("Subtotal must be positive"),
    calculatedFee: z.number().min(0, "Fee must be non-negative"),
    calculatedTotal: z.number().positive("Total must be positive"),
    // pin: z.string().regex(/^\d{4}$/, "Pin must be exactly 4 digits"),
    paymentMethod: z.enum(["WALLET", "VIRTUAL_ACCOUNT"]).default("WALLET"),
    currency: z.string().default("ngn"),
    promoCode: z.string().optional(),
});

const placeDirectOrderSchema = placeDirectOrderBodySchema;

export type PlaceDirectOrderBody = z.infer<typeof placeDirectOrderSchema>;

// GC SELL

const createAcceptedCardSchema = z.object({
    cardName: z.string().min(1, "Card name is required"),
    cardType: z.string().min(1, "Card type is required"),
    country: z.string().min(1, "Country is required (Full Name)"),
    // countryCode: z.string().length(2, 'Country code must be 2 characters'), // Removed
    currency: z.string().length(3, "Currency code must be 3 characters"),
    availableRanges: z.array(z.string()).min(1, "At least one range is required"),
    receiptTypes: z
        .array(z.string())
        .min(1, "At least one receipt type is required"),

    rates: z.record(z.string(), z.any()), // Complex nested structure
    imageUrl: z.string().url().optional(),
    instructions: z.string().optional(),
    isActive: z.boolean().default(true),
});

const updateAcceptedCardSchema = createAcceptedCardSchema.partial();

const calculateRateSchema = z.object({
    acceptedCardId: z
        .string()
        .min(1, "Accepted card ID cannot be empty")
        .describe("Accepted card ID"),

    cardRange: z
        .string()
        .min(1, "Card range cannot be empty")
        .describe("Card range"),

    receiptType: z
        .string()
        .min(1, "Receipt type cannot be empty")
        .describe("Receipt type"),

    cardValue: z
        .number()
        .positive("Card value must be positive")
        .describe("Card value"),
});

const calculateSalePayoutSchema = calculateRateSchema.extend({
    quantity: z
        .number()
        .int("Quantity must be an integer")
        .min(1, "Quantity must be at least 1")
        .describe("Quantity"),

    promoCode: z.string().optional(),
});

const submitSaleSchema = z.object({
    acceptedCardId: z.string().min(1, "Accepted card ID is required"),
    cardRange: z.string().min(1, "Card range is required"),
    receiptType: z.string().min(1, "Receipt type is required"),
    cardValue: z.coerce.number().positive("Card value must be positive"),
    quantity: z.coerce.number().int().min(1, "Quantity must be at least 1"),
    calculatedPayout: z.coerce
        .number()
        .positive("Calculated payout must be positive"),
    cardCode: z.string().optional(),
    cardPin: z.string().optional(),
    userNotes: z
        .string()
        .max(500, "Notes cannot exceed 500 characters")
        .optional(),
    promoCode: z.string().optional(),
});

const reviewSaleSchema = z.object({
    saleId: z.string().min(1, "Sale ID is required"),
});

const approveSaleSchema = z.object({
    saleId: z.string().min(1, "Sale ID is required"),
    reviewNotes: z.string().optional(),
});

const rejectSaleSchema = z.object({
    saleId: z.string().min(1, "Sale ID is required"),
    rejectionReason: z.string().min(1, "Rejection reason is required"),
    reviewNotes: z.string().optional(),
});

// admin
const processSalePayoutSchema = z.object({
    body: z
        .object({
            reviewNotes: z
                .string()
                .max(500, "Review notes cannot exceed 500 characters")
                .optional(),
        })
        .optional(),
});

export type CreateAcceptedCardDto = z.infer<typeof createAcceptedCardSchema>;
export type UpdateAcceptedCardDto = z.infer<typeof updateAcceptedCardSchema>;
export type CalculateSalePayoutDto = z.infer<typeof calculateSalePayoutSchema>;
export type CalculateRateDto = z.infer<typeof calculateRateSchema>;
export type SubmitSaleDto = z.infer<typeof submitSaleSchema>;
export type ApproveSaleDto = z.infer<typeof approveSaleSchema>;
export type RejectSaleDto = z.infer<typeof rejectSaleSchema>;

export const giftCardValidation = {
    calculatePriceSchema,
    placeOrderSchema,
    placeDirectOrderSchema,
    refreshCodesSchema,
    cancelOrderSchema,
    createAcceptedCardSchema,
    updateAcceptedCardSchema,
    calculateSalePayoutSchema,
    calculateRateSchema,
    submitSaleSchema,
    reviewSaleSchema,
    approveSaleSchema,
    rejectSaleSchema,
    processSalePayoutSchema,
};
