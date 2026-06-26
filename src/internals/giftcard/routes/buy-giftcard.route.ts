import express from "express";
import { giftcardController } from "../controllers/buy-giftcard.controller";
import { validate } from "@/shared/middlewares";
import { giftCardValidation } from "../giftcard.validation";
import { requireAuth } from "@shared/middlewares/auth.middleware";

const giftcardRoutes = express.Router();

giftcardRoutes.get("/countries", requireAuth, giftcardController.getCountries);


giftcardRoutes.get("/products", requireAuth, giftcardController.getProducts);


giftcardRoutes.get(
    "/products/:reloadlyId",
    requireAuth,
    giftcardController.getSingleProduct,
);


giftcardRoutes.get(
    "/products/:reloadlyId/exchange-rate",
    requireAuth,
    giftcardController.getExchangeRate,
);


giftcardRoutes.post(
    "/orders/place",
    requireAuth,
    validate(giftCardValidation.placeDirectOrderSchema),
    giftcardController.placeOrder,
);


giftcardRoutes.post(
    "/orders/:orderId/refresh-codes",
    requireAuth,
    giftcardController.refreshOrderCodes,
);

// giftcardRoutes.get(
//     "/accepted-cards",
//     authenticate,
//     giftcardSellController.getAcceptedCards,
// );


// giftcardRoutes.get(
//     "/accepted-cards/:acceptedCardId",
//     requireAuth,
//     giftcardSellController.getAcceptedCardById,
// );


// giftcardRoutes.post(
//     "/submit",
//     requireAuth,
//     handleGiftCardUpload("images", 10),
//     validate(giftCardValidation.submitSaleSchema),
//     giftcardSellController.submitSale,
// );


// giftcardRoutes.post(
//     "/rates",
//     requireAuth,
//     validate(giftCardValidation.calculateRateSchema),
//     giftcardSellController.calculateRates,
// );


// giftcardRoutes.post(
//     "/calculate-payout",
//     requireAuth,
//     validate(giftCardValidation.calculateSalePayoutSchema),
//     giftcardSellController.calculatePayout,
// );

// giftcardRoutes.get("/my-sales", requireAuth, giftcardSellController.getSales);

// giftcardRoutes.get(
//     "/my-sales/:saleId",
//     requireAuth,
//     giftcardSellController.getSale,
// );

// giftcardRoutes.delete(
//     "/my-sales/:saleId",
//     requireAuth,
//     giftcardSellController.cancelSale,
// );

export { giftcardRoutes };
