import authenticate from "@/middlewares/authenticate.middleware";
import { isAdmin } from "@/middlewares/role-check.middleware";
import { Router } from "express";
import { giftcardBuyAdminController } from "../controllers/buy-giftcard.controller.admin";
import { validate } from "@/utils/validate.util";
import { giftCardValidation } from "../validations/giftcard.validation";

const giftcardRoutes = Router();

//  =======BUY========

giftcardRoutes.post(
    "/sync",
    authenticate,
    //   isAdmin,
    giftcardBuyAdminController.syncProducts,
);

giftcardRoutes.get(
    "/products",
    authenticate,
    //   isAdmin,
    giftcardBuyAdminController.getAllProducts,
);

giftcardRoutes.get(
    "/orders",
    authenticate,
    //   isAdmin,
    giftcardBuyAdminController.getAllOrders,
);


giftcardRoutes.get(
    "/orders/:orderId",
    authenticate,
    //   isAdmin,
    giftcardBuyAdminController.getOrder,
);


giftcardRoutes.post(
    "/orders/:orderId/retry",
    authenticate,
    //   isAdmin,
    giftcardBuyAdminController.retryOrder,
);

giftcardRoutes.get(
    "/orders/:orderId/status",
    authenticate,
    //   isAdmin,
    giftcardBuyAdminController.getOrderStatus,
);


// giftcardRoutes.post(
//     "/orders/:orderId/refund",
//     authenticate,
//     //   isAdmin,
//     validate(giftCardValidation.RefundOrderSchema),
//     giftcardBuyAdminController.refundOrder,
// );

//  =======SELL========

// giftcardRoutes.get(
//   "/accepted-cards",
//   requireAdminAuth,
//   requireAdmin,
//   giftcardSellAdminController.getAllAcceptedCards,
// );


// giftcardRoutes.get(
//   "/accepted-cards/:cardId",
//   requireAdminAuth,
//   requireAdmin,
//   giftcardSellAdminController.getAcceptedCard,
// );


// giftcardRoutes.post(
//   "/accepted-card",
//   requireAdminAuth,
//   requireAdmin,
//   uploadMiddleware.single("image"),
//   giftcardSellAdminController.createAcceptedCard,
// );


// giftcardRoutes.patch(
//   "/accepted-cards/:cardId",
//   requireAdminAuth,
//   requireAdmin,
//   uploadMiddleware.single("image"),
//   giftcardSellAdminController.updateAcceptedCard,
// );


// giftcardRoutes.delete(
//   "/accepted-cards/:cardId",
//   requireAdminAuth,
//   requireAdmin,
//   giftcardSellAdminController.deleteAcceptedCard,
// );

// giftcardRoutes.get(
//   "/sales",
//   requireAdminAuth,
//   requireAdmin,
//   giftcardSellAdminController.getAllSales,
// );

// giftcardRoutes.get(
//   "/sales/:saleId",
//   requireAdminAuth,
//   requireAdmin,
//   giftcardSellAdminController.getSale,
// );


// giftcardRoutes.post(
//   "/sales/:saleId/review",
//   requireAdminAuth,
//   requireAdmin,
//   giftcardSellAdminController.reviewSale,
// );

// giftcardRoutes.post(
//   "/sales/process-payout",
//   requireAdminAuth,
//   requireAdmin,
//   validate(giftCardValidation.processSalePayout),
//   giftcardSellAdminController.processSalePayout,
// );


// giftcardRoutes.post(
//   "/sales/reject",
//   requireAdminAuth,
//   requireAdmin,
//   validate(giftCardValidation.rejectSaleSchema),
//   giftcardSellAdminController.rejectSale,
// );

export { giftcardRoutes };
