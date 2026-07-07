import express from "express";
import { cryptoWalletController } from "./crypto.controller";
import { requireAuth, validate } from "@shared/middlewares";
import { walletValidation } from "./crypto.validation";

const cryptoRoutes = express.Router();

cryptoRoutes.post(
  "/generate",
  requireAuth,
  validate(walletValidation.generateCryptoPairSchema),
  cryptoWalletController.generateCryptoWallet,
);


cryptoRoutes.get("/rate", requireAuth, cryptoWalletController.getCoinRate);

cryptoRoutes.get(
  "/wallets",
  requireAuth,
  cryptoWalletController.getAllUserWallet,
);

cryptoRoutes.get("/", requireAuth, cryptoWalletController.getCryptos);

cryptoRoutes.get(
  "/market-insights",
  // requireAuth,
  cryptoWalletController.getMarketInsights,
);

export { cryptoRoutes };
