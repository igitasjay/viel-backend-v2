import express from "express";
import { accountController } from "./account.controller";
import { requireAuth, validate } from "@shared/middlewares";
import { accountValidation } from "./account.validation";

const accountRoutes = express.Router();

/**
 * @swagger
 * /account/set-pin:
 *   post:
 *     tags:
 *       - Account
 *     summary: Set Account Transaction PIN
 *     description: Sets a new 4-digit transaction PIN for the authenticated user's account.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - accountPin
 *               - confirmAccountPin
 *             properties:
 *               accountPin:
 *                 type: string
 *                 description: The 4-digit new transaction PIN.
 *                 pattern: '^\d{4}$'
 *                 example: "1234"
 *               confirmAccountPin:
 *                 type: string
 *                 description: Confirmation of the new 4-digit transaction PIN. Must match 'accountPin'.
 *                 pattern: '^\d{4}$'
 *                 example: "1234"
 *     responses:
 *       200:
 *         description: Account PIN set successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Account PIN set successfully."
 *       400:
 *         description: Bad Request - Invalid PIN format or PINs do not match.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Account pin do not match"
 *       401:
 *         description: Unauthorized - Authentication required.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Unauthorized"
 *       500:
 *         description: Internal Server Error.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Internal Server Error"
 */
accountRoutes.post(
  "/set-pin",
  requireAuth,
  validate(accountValidation.SetAccountPinSchema),
  accountController.setAccountPin,
);

/**
 * @swagger
 * /account/change-pin:
 *   patch:
 *     tags:
 *       - Account
 *     summary: Change Account Transaction PIN
 *     description: Changes the existing 4-digit transaction PIN for the authenticated user's account. Requires the old PIN and current user password for verification.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - oldPin
 *               - newPin
 *               - currentPassword
 *             properties:
 *               oldPin:
 *                 type: string
 *                 description: The current 4-digit transaction PIN.
 *                 pattern: '^\d{4}$'
 *                 example: "1234"
 *               newPin:
 *                 type: string
 *                 description: The new 4-digit transaction PIN.
 *                 pattern: '^\d{4}$'
 *                 example: "5678"
 *               currentPassword:
 *                 type: string
 *                 description: The user's current account password for authentication.
 *                 format: password
 *                 example: "Password123!"
 *     responses:
 *       200:
 *         description: Account PIN changed successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Account PIN changed successfully."
 *       400:
 *         description: Bad Request - Invalid input, incorrect old PIN, or password mismatch.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Old PIN is incorrect"
 *       401:
 *         description: Unauthorized - Authentication required or invalid credentials.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Unauthorized"
 *       500:
 *         description: Internal Server Error.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Internal Server Error"
 */
accountRoutes.patch(
  "/change-pin",
  requireAuth,
  validate(accountValidation.ChangeAccountPinSchema),
  accountController.changeAccountPin,
);

/**
 * @swagger
 * /account/forgot-pin:
 *   post:
 *     tags:
 *       - Account
 *     summary: Request Account PIN Reset
 *     description: Initiates the process to reset the account transaction PIN. Requires user's registered email and current password for verification, then sends an OTP to the email.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: The user's registered email address associated with the account.
 *                 example: "user@example.com"
 *               password:
 *                 type: string
 *                 format: password
 *                 description: The user's current account password for authentication.
 *                 example: "Password123!"
 *     responses:
 *       200:
 *         description: PIN reset request initiated successfully. OTP sent to email.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "PIN reset initiated. OTP sent to your email."
 *       400:
 *         description: Bad Request - Invalid input, email not found, or incorrect password.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Invalid email or password"
 *       401:
 *         description: Unauthorized - Authentication required.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Unauthorized"
 *       500:
 *         description: Internal Server Error.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Internal Server Error"
 */
accountRoutes.post(
  "/forgot-pin",
  requireAuth,
  validate(accountValidation.ForgotAccountPinSchema),
  accountController.forgotAccountPin,
);

/**
 * @swagger
 * /account/resend:
 *   post:
 *     tags:
 *       - Account
 *     summary: Resend Account PIN Reset OTP
 *     description: Resends the One-Time Password (OTP) for account transaction PIN reset to the user's registered email. Requires the user's email to identify the account.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: The user's registered email address to which the OTP should be resent.
 *                 example: "user@example.com"
 *     responses:
 *       200:
 *         description: OTP for PIN reset resent successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "OTP for PIN reset resent successfully."
 *       400:
 *         description: Bad Request - Invalid email format or user not found.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "User with this email not found or OTP request not initiated."
 *       401:
 *         description: Unauthorized - Authentication required.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Unauthorized"
 *       500:
 *         description: Internal Server Error.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Internal Server Error"
 */
accountRoutes.post(
  "/resend",
  requireAuth,
  validate(accountValidation.ResendPinOtpSchema),
  accountController.resendAccountPinOtp,
);

/**
 * @swagger
 * /account/verify-code:
 *   post:
 *     tags:
 *       - Account
 *     summary: Verify Account PIN Reset OTP
 *     description: Verifies the One-Time Password (OTP) sent to the user's email to proceed with setting a new account transaction PIN.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - verificationCode
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: The user's registered email address.
 *                 example: "user@example.com"
 *               verificationCode:
 *                 type: string
 *                 description: The 6-digit OTP received via email.
 *                 pattern: '^\d{6}$'
 *                 example: "123456"
 *     responses:
 *       200:
 *         description: OTP verified successfully. User can now set a new PIN.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "OTP verified successfully. You can now set a new PIN."
 *       400:
 *         description: Bad Request - Invalid OTP, email not found, or OTP expired.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Invalid or expired OTP."
 *       401:
 *         description: Unauthorized - Authentication required.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Unauthorized"
 *       500:
 *         description: Internal Server Error.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Internal Server Error"
 */
accountRoutes.post(
  "/verify-code",
  requireAuth,
  validate(accountValidation.ResetAccountPinOtpSchema),
  accountController.verifyAccountPinRequest,
);

export { accountRoutes };
