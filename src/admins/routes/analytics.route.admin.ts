import express from "express";
import { adminAnalyticsController } from "../controllers/analytics.controller.admin";
import { requireAdmin, requireAdminAuth } from "@/shared/middlewares";

const router = express.Router();

router.get("/", requireAdminAuth, requireAdmin, adminAnalyticsController.getAnalytics);

export { router as analyticsRoutesAdmin };
