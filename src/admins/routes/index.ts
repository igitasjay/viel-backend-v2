import express from "express";
import { authRoutes } from "./auth.routes";
import { giftcardRoutes as adminGiftcardRoutes } from "./giftcard.route.admin";
import { exchangeRateRoutes as adminExchangeRateRoutes } from "./exchange-rate.route.admin";
import { bannerRoutesAdmin } from "./banner.route.admin";
import { analyticsRoutesAdmin } from "./analytics.route.admin";
import { usersRoutesAdmin } from "./users.route.admin";

const adminRouter = express.Router();

adminRouter.use("/auth", authRoutes);
adminRouter.use('/giftcards', adminGiftcardRoutes)
adminRouter.use('/exchange-rates', adminExchangeRateRoutes)
adminRouter.use('/banners', bannerRoutesAdmin)
adminRouter.use('/analytics', analyticsRoutesAdmin)
adminRouter.use('/users', usersRoutesAdmin)

export default adminRouter;