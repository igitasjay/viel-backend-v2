import { Router } from "express";
import { exchangeRateController } from "../controllers/exchange-rate.controller";

const exchangeRateRoutes = Router();

exchangeRateRoutes.get("/", exchangeRateController.getExchangeRates);
exchangeRateRoutes.post("/", exchangeRateController.createOrUpdateExchangeRate);
exchangeRateRoutes.delete("/:id", exchangeRateController.deleteExchangeRate);

export { exchangeRateRoutes };
