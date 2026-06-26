import { z } from "zod";

const createAcceptedCardSchema = z.object({
  cardName: z.string().trim().min(1, "Card name is required"),
  cardType: z.string().trim().min(1, "Card type is required"),
  country: z.string().trim().min(1, "Country is required"),
  currency: z.string().trim().length(3, "Currency code must be 3 characters"),
  availableRanges: z.array(z.string()).min(1, "At least one range is required"),
  receiptTypes: z
    .array(z.string())
    .min(1, "At least one receipt type is required"),
  rates: z.record(z.string(), z.record(z.string(), z.number())),
  imageUrl: z
    .string()
    .trim()
    .url("Image URL must be a valid URL")
    .min(1, "Gift card image is required"),
  instructions: z.string().trim().optional(),
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

const submitSaleSchema = z.object({
  acceptedCardId: z.string().min(1, "Accepted card ID is required"),
  cardRange: z.string().min(1, "Card range is required"),
  receiptType: z.string().min(1, "Receipt type is required"),
  cardValue: z.coerce.number().positive("Card value must be positive"),
  quantity: z.coerce.number().int().min(1, "Quantity must be at least 1"),
  // imageUrls: z.array(z.string().url('Invalid image URL')).min(1, 'At least 1 image is required').max(10, 'Maximum 10 images allowed').optional(),
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

const processSalePayout = z.object({
  saleId: z.string().min(1, "Sale ID is required"),
  reviewNotes: z.string().optional(),
});

const rejectSaleSchema = z.object({
  saleId: z.string().min(1, "Sale ID is required"),
  rejectionReason: z.string().min(1, "Rejection reason is required"),
  reviewNotes: z.string().optional(),
});

const RefundOrderSchema = z.object({
  reason: z.string().min(1),
});

export type CreateAcceptedCardDto = z.infer<typeof createAcceptedCardSchema>;
export type UpdateAcceptedCardDto = z.infer<typeof updateAcceptedCardSchema>;
export type CalculateRateDto = z.infer<typeof calculateRateSchema>;
export type SubmitSaleDto = z.infer<typeof submitSaleSchema>;
export type ApproveSaleDto = z.infer<typeof processSalePayout>;
export type RejectSaleDto = z.infer<typeof rejectSaleSchema>;

export const giftCardValidation = {
  createAcceptedCardSchema,
  updateAcceptedCardSchema,
  processSalePayout,
  reviewSaleSchema,
  rejectSaleSchema,
  RefundOrderSchema,
};
