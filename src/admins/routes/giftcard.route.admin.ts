import { Router } from "express";
import { giftcardBuyAdminController } from "../controllers/buy-giftcard.controller.admin";
import { validate } from "@/utils/validate.util";
import { giftCardValidation } from "../validations/giftcard.validation";
import { requireAdmin, requireAdminAuth, uploadMiddleware } from "@/shared/middlewares";
import { giftcardSellAdminController } from "../controllers/sell-giftcard.controller";

const giftcardRoutes = Router();

//  =======BUY========

giftcardRoutes.post(
    "/sync",
    requireAdminAuth,
    requireAdmin,
    giftcardBuyAdminController.syncProducts,
);

giftcardRoutes.get(
    "/products",
    requireAdminAuth,
    requireAdmin,
    giftcardBuyAdminController.getAllProducts,
);

giftcardRoutes.get(
    "/orders",
    requireAdminAuth,
    requireAdmin,
    giftcardBuyAdminController.getAllOrders,
);


giftcardRoutes.get(
    "/orders/:orderId",
    requireAdminAuth,
    requireAdmin,
    giftcardBuyAdminController.getOrder,
);


giftcardRoutes.post(
    "/orders/:orderId/retry",
    requireAdminAuth,
    requireAdmin,
    giftcardBuyAdminController.retryOrder,
);

giftcardRoutes.get(
    "/orders/:orderId/status",
    requireAdminAuth,
    requireAdmin,
    giftcardBuyAdminController.getOrderStatus,
);


// giftcardRoutes.post(
//     "/orders/:orderId/refund",
//     requireAuth,
//     isAdmin,
//     validate(giftCardValidation.RefundOrderSchema),
//     giftcardBuyAdminController.refundOrder,
// );

//  =======SELL========

giftcardRoutes.get(
    "/accepted-cards",
    requireAdminAuth,
    requireAdmin,
    giftcardSellAdminController.getAllAcceptedCards,
);


giftcardRoutes.get(
    "/accepted-cards/:cardId",
    requireAdminAuth,
    requireAdmin,
    giftcardSellAdminController.getAcceptedCard,
);


giftcardRoutes.post(
    "/accepted-card",
    requireAdminAuth,
    requireAdmin,
    uploadMiddleware.single("image"),
    giftcardSellAdminController.createAcceptedCard,
);


giftcardRoutes.patch(
    "/accepted-cards/:cardId",
    requireAdminAuth,
    requireAdmin,
    uploadMiddleware.single("image"),
    giftcardSellAdminController.updateAcceptedCard,
);


giftcardRoutes.delete(
    "/accepted-cards/:cardId",
    requireAdminAuth,
    requireAdmin,
    giftcardSellAdminController.deleteAcceptedCard,
);

giftcardRoutes.get(
    "/sales",
    requireAdminAuth,
    requireAdmin,
    giftcardSellAdminController.getAllSales,
);

giftcardRoutes.get(
    "/sales/:saleId",
    requireAdminAuth,
    requireAdmin,
    giftcardSellAdminController.getSale,
);


giftcardRoutes.post(
    "/sales/:saleId/review",
    requireAdminAuth,
    requireAdmin,
    giftcardSellAdminController.reviewSale,
);

giftcardRoutes.post(
    "/sales/process-payout",
    requireAdminAuth,
    requireAdmin,
    validate(giftCardValidation.processSalePayout),
    giftcardSellAdminController.processSalePayout,
);


giftcardRoutes.post(
    "/sales/reject",
    requireAdminAuth,
    requireAdmin,
    validate(giftCardValidation.rejectSaleSchema),
    giftcardSellAdminController.rejectSale,
);

export { giftcardRoutes };
