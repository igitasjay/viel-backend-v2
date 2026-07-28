import express from "express";
import { authController } from "./auth.controller";
import { authValidation } from "./auth.validation";
import { authBiometrics } from "./auth.biometrics";
import { validate } from "@/shared/middlewares/validate";
import { requireAuth } from "@/shared/middlewares";

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

// authRoutes.post(
//   "/resend",
//   validate(authValidation.resendVerificationCodeSchema),
//   authController.resendOtp,
// );


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


authRoutes.post(
  "/verify-reset-password-otp",
  validate(authValidation.verifyResetPasswordOTPSchema),
  authController.verifyResetPasswordOTP,
);


authRoutes.patch(
  "/reset-password",
  validate(authValidation.resetPasswordSchema),
  authController.resetPasswordUser,
);

authRoutes.patch(
  "/change-password",
  requireAuth,
  validate(authValidation.passwordChangeSchema),
  authController.changePasswordUser,
);

authRoutes.post("/logout", requireAuth, authController.logout);

authRoutes.post("/refresh-token", authController.refreshToken);

authRoutes.post(
  "/re-authenticate",
  validate(authValidation.reAuthenticateSchema),
  authBiometrics.reAuthenticateUser,
);


authRoutes.post(
  "/enable-biometric",
  requireAuth,
  validate(authValidation.enableBiometric),
  authBiometrics.enableBiometric,
);

authRoutes.delete(
  "/disable-biometric",
  requireAuth,
  authBiometrics.disableBiometrics,
);

// authRoutes.get("/:username", authController.checkUsername);

export { authRoutes };
