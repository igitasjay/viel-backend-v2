import { Router } from "express";
import { exchangeRateController } from "../controllers/exchange-rate.controller";
import { requireAdmin, requireAdminAuth } from "@/shared/middlewares";

const exchangeRateRoutes = Router();

exchangeRateRoutes.get("/", requireAdminAuth, requireAdmin, exchangeRateController.getExchangeRates);
exchangeRateRoutes.post("/", requireAdminAuth, requireAdmin, exchangeRateController.createOrUpdateExchangeRate);
exchangeRateRoutes.delete("/:id", requireAdminAuth, requireAdmin, exchangeRateController.deleteExchangeRate);

export { exchangeRateRoutes };
