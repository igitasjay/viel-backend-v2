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

const createAdminUserSchema = z.object({
    name: z.string().min(1, "Name is required"),
    email: emailValidation,
    password: passwordValidation,
});

const loginSchema = z.object({
    email: emailValidation,
    password: passwordValidation,
});

const passwordChangeSchema = z
    .object({
        currentPassword: passwordValidation,
        newPassword: passwordValidation,
        confirmNewPassword: passwordValidation,
    })
    .refine((data) => data.newPassword === data.confirmNewPassword, {
        message: "Passwords do not match",
        path: ["confirmNewPassword"],
    });

const suspendAdminSchema = z.object({
    isActive: z.boolean(),
});

const superAdminResetPasswordSchema = z.object({
    newPassword: passwordValidation,
});

export const adminAuthValidation = {
    createAdminUserSchema,
    loginSchema,
    passwordChangeSchema,
    suspendAdminSchema,
    superAdminResetPasswordSchema,
};
