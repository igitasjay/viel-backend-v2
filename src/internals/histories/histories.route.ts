import express from "express";
import { historyController } from "./histories.controller";
import { requireAuth } from "@shared/middlewares";

const historyRoutes = express.Router();

historyRoutes.get(
  "/list",
  requireAuth,
  historyController.listTransactionHistory,
);

historyRoutes.get(
  "/rewards",
  requireAuth,
  historyController.listRewardsHistory,
);

export { historyRoutes };
