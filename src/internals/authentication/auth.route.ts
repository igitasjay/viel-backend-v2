import express from "express";
import { authController } from "./auth.controller";
import { authValidation } from "./auth.validation";
import { authBiometrics } from "./auth.biometrics";
import authenticate from "@/middlewares/authenticate.middleware";
import { validate } from "@/shared/middlewares/validate";

const authRoutes = express.Router();


authRoutes.post(
  "/register",
  validate(authValidation.registerAccountSchema),
  authController.registerUser,
);

authRoutes.post(
  "/verify-account",
  validate(authValidation.verifyAccountSchema),
  authController.verifyAccount,
);

authRoutes.post(
  "/resend",
  validate(authValidation.resendVerificationCodeSchema),
  authController.resendOtp,
);


authRoutes.post(
  "/login",
  validate(authValidation.loginAccountSchema),
  authController.loginUser,
);

authRoutes.post(
  "/forgot-password",
  validate(authValidation.forgotPasswordSchema),
  authController.forgotPasswordUser,
);

authRoutes.patch(
  "/reset-password",
  validate(authValidation.resetPasswordSchema),
  authController.resetPasswordUser,
);

authRoutes.patch(
  "/change-password",
  authenticate,
  validate(authValidation.passwordChangeSchema),
  authController.changePasswordUser,
);

authRoutes.post("/logout", authenticate, authController.logout);

authRoutes.post("/refresh-token", authController.refreshToken);

authRoutes.post(
  "/re-authenticate",
  validate(authValidation.reAuthenticateSchema),
  authBiometrics.reAuthenticateUser,
);


authRoutes.post(
  "/enable-biometric",
  authenticate,
  validate(authValidation.enableBiometric),
  authBiometrics.enableBiometric,
);

authRoutes.delete(
  "/disable-biometric",
  authenticate,
  authBiometrics.disableBiometrics,
);

// authRoutes.get("/:username", authController.checkUsername);

export { authRoutes };
