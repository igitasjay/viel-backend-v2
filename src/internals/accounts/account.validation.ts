import { z } from "zod";

const passwordValidation = z
  .string()
  .min(8, "Password must be at least 8 characters long")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[0-9]/, "Password must contain at least one number")
  .regex(
    /[^A-Za-z0-9]/,
    "Password must contain at least one special character",
  );

const emailValidation = z
  .email("Invalid email address")
  .transform((email) => email.toLowerCase());

const SetAccountPinSchema = z
  .object({
    accountPin: z
      .string()
      .regex(/^\d{4}$/, "Transaction PIN must be exactly 4 digits"),
    confirmAccountPin: z
      .string()
      .regex(/^\d{4}$/, "Transaction PIN must be exactly 4 digits"),
  })
  .refine((data) => data.accountPin === data.confirmAccountPin, {
    message: "Account pin do not match",
    path: ["confirmAccountPin"],
  });

const ChangeAccountPinSchema = z.object({
  oldPin: z.string().regex(/^\d{4}$/, "Pin must be exactly 4 digits"),
  newPin: z.string().regex(/^\d{4}$/, "Pin must be exactly 4 digits"),
  currentPassword: passwordValidation,
});

const ResetAccountPinOtpSchema = z.object({
  email: emailValidation,
  verificationCode: z
    .string()
    .min(1, "Verification code is required")
    .length(6, "OTP must be exactly 6 characters")
    .regex(/^\d+$/, "OTP must contain only numbers"),
});

const ResendPinOtpSchema = z.object({
  email: emailValidation,
});

// const NewPinRequestSchema   = z.object({
//       newAccountPin: z
//         .string()
//         .regex(/^\d{4}$/, "Pin must be exactly 4 digits"),
//       confirmNewAccountPin: z
//         .string()
//         .regex(/^\d{4}$/, "Pin must be exactly 4 digits"),
//     })
//     .refine((data) => data.newAccountPin === data.confirmNewAccountPin, {
//       message: "Pins do not match",
//       path: ["confirmNewPin"],
// });

const ForgotAccountPinSchema = z.object({
  email: emailValidation,
  password: passwordValidation,
});

export const accountValidation = {
  SetAccountPinSchema,
  ChangeAccountPinSchema,
  ResetAccountPinOtpSchema,
  ResendPinOtpSchema,
  // NewPinRequestSchema,
  ForgotAccountPinSchema,
};
