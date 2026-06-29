import express from "express";
import { giftcardController } from "../controllers/buy-giftcard.controller";
import { validate } from "@/shared/middlewares";
import { giftCardValidation } from "../giftcard.validation";
import { requireAuth } from "@shared/middlewares/auth.middleware";

const buyGiftcardRoutes = express.Router();

buyGiftcardRoutes.get("/countries", giftcardController.getCountries);


buyGiftcardRoutes.get("/products", giftcardController.getProducts);


buyGiftcardRoutes.get(
    "/products/:reloadlyId",
    giftcardController.getSingleProduct,
);


buyGiftcardRoutes.get(
    "/products/:reloadlyId/exchange-rate",
    giftcardController.getExchangeRate,
);


buyGiftcardRoutes.post(
    "/orders/place",
    validate(giftCardValidation.placeDirectOrderSchema),
    giftcardController.placeOrder,
);


buyGiftcardRoutes.post(
    "/orders/:orderId/refresh-codes",
    giftcardController.refreshOrderCodes,
);


export { buyGiftcardRoutes };
