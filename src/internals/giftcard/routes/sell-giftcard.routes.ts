import express from "express";
import { handleGiftCardUpload, validate } from "@/shared/middlewares";
import { giftCardValidation } from "../giftcard.validation";
import { requireAuth } from "@shared/middlewares/auth.middleware";
import { giftcardSellController } from "../controllers/sell-giftcard.controller";

const sellGiftcardRoutes = express.Router();

sellGiftcardRoutes.get(
    "/accepted-cards",
    requireAuth,
    giftcardSellController.getAcceptedCards,
);


sellGiftcardRoutes.get(
    "/accepted-cards/:acceptedCardId",
    requireAuth,
    giftcardSellController.getAcceptedCardById,
);


sellGiftcardRoutes.post(
    "/submit",
    requireAuth,
    handleGiftCardUpload("images", 10),
    validate(giftCardValidation.submitSaleSchema),
    giftcardSellController.submitSale,
);


sellGiftcardRoutes.post(
    "/rates",
    requireAuth,
    validate(giftCardValidation.calculateRateSchema),
    giftcardSellController.calculateRates,
);


sellGiftcardRoutes.post(
    "/calculate-payout",
    requireAuth,
    validate(giftCardValidation.calculateSalePayoutSchema),
    giftcardSellController.calculatePayout,
);

sellGiftcardRoutes.get("/my-sales", requireAuth, giftcardSellController.getSales);

sellGiftcardRoutes.get(
    "/my-sales/:saleId",
    requireAuth,
    giftcardSellController.getSale,
);

sellGiftcardRoutes.delete(
    "/my-sales/:saleId",
    requireAuth,
    giftcardSellController.cancelSale,
);

export { sellGiftcardRoutes };