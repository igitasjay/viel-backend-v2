import { ReferralSource } from "@/shared/types/enums";
import { z } from "zod";

const passwordValidation = z
  .string()
  .min(1, "Password is required")
  .min(8, "Password must be at least 8 characters long")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[0-9]/, "Password must contain at least one number")
  .regex(
    /[^A-Za-z0-9]/,
    "Password must contain at least one special character",
  );

// const phoneNumberValidation = z
//   .string()
//   .min(1, "Phone number is required")
//   .length(10, "Phone number must be exactly 10 digits")
//   .regex(/^\d+$/, "Phone number must contain only digits");

const emailValidation = z
  .email("Invalid email address")
  .transform((email) => email.toLowerCase());

const usernameValidation = z
  .string()
  .regex(
    /^@?(?=[a-zA-Z0-9._]{3,20}$)(?!.*[._]{2})[a-zA-Z0-9](?:[a-zA-Z0-9._]*[a-zA-Z0-9])?$/,
    {
      message:
        "Username must start with @, be 3–20 chars, can include letters, numbers, dot, underscore, but cannot end with dot/underscore or have consecutive ones",
    },
  )
  .transform((val) => (val.startsWith("@") ? val : `@${val}`));

export const registerAccountSchema = z
  .object({
    fullName: z
      .string()
      .min(1, "Full name is required")
      .min(2, "Full name must be at least 2 characters")
      .max(100, "Full name cannot exceed 100 characters"),

    email: emailValidation,

    password: passwordValidation,

    // username: usernameValidation,

    confirmPassword: z.string().min(1, "Please confirm your password"),

    referralCode: z.string().optional(),

    // referralSource: z.enum(Object.values(ReferralSource)).optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

const loginAccountSchema = z.object({
  email: emailValidation,
  password: passwordValidation,
});

const passwordChangeSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),

    newPassword: passwordValidation,

    confirmNewPassword: z.string().min(1, "Please confirm your new password"),
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: "New passwords do not match",
    path: ["confirmNewPassword"],
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: "New password must be different from current password",
    path: ["newPassword"],
  });

const verifyAccountSchema = z.object({
  email: emailValidation,

  verificationCode: z
    .string()
    .min(1, "Verification code is required")
    .length(6, "OTP must be exactly 6 characters")
    .regex(/^\d+$/, "OTP must contain only numbers"),
});

const resendVerificationCodeSchema = z.object({
  email: emailValidation,
});

const forgotPasswordSchema = z.object({
  email: emailValidation,
});

const verifyResetPasswordOTPSchema = z.object({
  email: emailValidation,
  otp: z
    .string()
    .min(1, "Verification code is required")
    .length(6, "OTP must be exactly 6 characters")
    .regex(/^\d+$/, "OTP must contain only numbers"),
});

const resetPasswordSchema = z
  .object({
    email: emailValidation,
    verificationCode: z
      .string()
      .min(1, "Verification code is required")
      .length(6, "OTP must be exactly 6 characters")
      .regex(/^\d+$/, "OTP must contain only numbers"),
    newPassword: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
        "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character",
      ),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

const verifyBiometric = z.object({
  email: emailValidation,
  challenge: z.string(),
  signature: z.string(),
  // privateKey:z.string()
});

const generateChallenge = z.object({
  email: emailValidation,
});

const enableBiometric = z.object({
  publicKey: z.string(),
});

const getUsernameSchema = z.object({
  username: usernameValidation,
});

const reAuthenticateSchema = z
  .object({
    email: emailValidation,
    authMethod: z.enum(["password", "biometric"], {
      message: "Auth method must be either 'password' or 'biometric'",
    }),
    password: passwordValidation.optional(),
    publicKey: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.authMethod === "password") return !!data.password;
      if (data.authMethod === "biometric") return !!data.publicKey;
      return false;
    },
    {
      message:
        "Password is required when authMethod is 'password', key is required when authMethod is 'biometric'",
      path: ["authMethod"],
    },
  );

export const authValidation = {
  registerAccountSchema,
  loginAccountSchema,
  passwordChangeSchema,
  verifyAccountSchema,
  resendVerificationCodeSchema,
  forgotPasswordSchema,
  getUsernameSchema,
  resetPasswordSchema,
  verifyBiometric,
  generateChallenge,
  enableBiometric,
  reAuthenticateSchema,
  verifyResetPasswordOTPSchema,
};

// Types for TypeScript support
export type CreateUserInput = z.infer<typeof registerAccountSchema>;
export type LoginInput = z.infer<typeof loginAccountSchema>;
export type PasswordChangeInput = z.infer<typeof passwordChangeSchema>;
export type VerifyInput = z.infer<typeof verifyAccountSchema>;
