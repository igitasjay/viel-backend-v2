import express from "express";
import { giftcardController } from "../controllers/buy-giftcard.controller";
import authenticate from "@/middlewares/authenticate.middleware";
import { validate } from "@/utils/validate.util";
import { giftCardValidation } from "../giftcard.validation";

const giftcardRoutes = express.Router();

giftcardRoutes.get("/countries", authenticate, giftcardController.getCountries);


giftcardRoutes.get("/products", authenticate, giftcardController.getProducts);


giftcardRoutes.get(
    "/products/:reloadlyId",
    authenticate,
    giftcardController.getSingleProduct,
);


giftcardRoutes.get(
    "/products/:reloadlyId/exchange-rate",
    authenticate,
    giftcardController.getExchangeRate,
);

giftcardRoutes.post(
    "/orders/place",
    authenticate,
    validate(giftCardValidation.placeDirectOrderSchema),
    giftcardController.placeOrder,
);


giftcardRoutes.post(
    "/orders/:orderId/refresh-codes",
    authenticate,
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
