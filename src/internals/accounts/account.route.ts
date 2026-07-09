import express from "express";
import { accountController } from "./account.controller";
import { requireAuth, validate } from "@shared/middlewares";
import { accountValidation } from "./account.validation";

const accountRoutes = express.Router();

accountRoutes.post(
  "/set-pin",
  requireAuth,
  validate(accountValidation.SetAccountPinSchema),
  accountController.setAccountPin,
);

accountRoutes.patch(
  "/change-pin",
  requireAuth,
  validate(accountValidation.ChangeAccountPinSchema),
  accountController.changeAccountPin,
);

accountRoutes.post(
  "/forgot-pin",
  requireAuth,
  validate(accountValidation.ForgotAccountPinSchema),
  accountController.forgotAccountPin,
);

accountRoutes.post(
  "/resend",
  requireAuth,
  validate(accountValidation.ResendPinOtpSchema),
  accountController.resendAccountPinOtp,
);

accountRoutes.post(
  "/verify-code",
  requireAuth,
  validate(accountValidation.ResetAccountPinOtpSchema),
  accountController.verifyAccountPinRequest,
);

export { accountRoutes };
