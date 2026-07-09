import { z } from "zod";
import { VALIDATION_PATTERNS } from "./constants";

// Full name validation
const fullNameValidation = z
  .string()
  .min(1, "Full name is required")
  .min(2, "Full name must be at least 2 characters")
  .max(100, "Full name cannot exceed 100 characters")
  .regex(
    /^[a-zA-Z\s'-]+$/,
    "Full name can only contain letters, spaces, hyphens, and apostrophes",
  );

// Phone number validation
const phoneNumberValidation = z
  .string()
  .min(1, "Phone number is required")
  .length(11, "Phone number must be exactly 11 digits")
  .regex(
    VALIDATION_PATTERNS.PHONE_NUMBER,
    "Phone number must start with 0 and be 11 digits",
  );

// Email validation
const emailValidation = z
  .string()
  .email("Invalid email address")
  .transform((email) => email.toLowerCase());

// Username validation
const userNameValidation = z
  .string()
  .regex(
    /^@?(?=[a-zA-Z0-9._]{3,20}$)(?!.*[._]{2})[a-zA-Z0-9](?:[a-zA-Z0-9._]*[a-zA-Z0-9])?$/,
    {
      message:
        "Username must start with @, be 3-20 chars, can include letters, numbers, dot, underscore, but cannot end with dot/underscore or have consecutive ones",
    },
  )
  .transform((val) => (val.startsWith("@") ? val : `@${val}`));

// Date of birth validation
// const dateOfBirthValidation = z
//   .string()
//   .datetime("Invalid date format")
//   .refine((date) => {
//     const dob = new Date(date);
//     const today = new Date();
//     const age = today.getFullYear() - dob.getFullYear();
//     return age >= 13 && age <= 120;
//   }, "Age must be between 13 and 120 years");

// export const updateProfileSchema = z
// .object({
//   fullName: fullNameValidation.optional(),

//   phone: phoneNumberValidation.optional(),

//   email: emailValidation.optional(),

//   username: userNameValidation.optional(),

//   // Optional metadata fields
//   countryOfResidence: z
//     .string()
//     .length(2, "Country code must be 2 characters")
//     .optional(),

//   dateOfBirth: z.preprocess(
//     () => undefined,
//     z.undefined({
//       required_error: "Date of Birth cannot be changed",
//       invalid_type_error: "Date of Birth cannot be changed",
//     })
//   ),
// })
// .refine((data) => {
//   return Object.values(data).some((value) => value !== undefined);
// }, "At least one field must be provided for update");

// export const profilePictureUploadSchema = z.object({
//   // File validation will be handled in middleware, this validates metadata
//   filename: z
//     .string()
//     .min(1, "Filename is required")
//     .max(255, "Filename too long")
//     .refine((filename) => {
//       const ext = filename.toLowerCase().substring(filename.lastIndexOf('.'));
//       return ['.jpg', '.jpeg', '.png', '.webp'].includes(ext);
//     }, "Invalid file type. Only JPG, PNG, and WebP files are allowed"),

//   contentType: z
//     .string()
//     .refine((type) => {
//       return ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(type);
//     }, "Invalid content type")
// });

export const updateProfileSchema = z
  .object({
    fullName: fullNameValidation.optional(),
    phone: phoneNumberValidation.optional(),
    email: emailValidation.optional(),
    username: userNameValidation.optional(),
    countryOfResidence: z
      .string()
      .length(2, "Country code must be 2 characters")
      .optional(),
    dateOfBirth: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format, expected YYYY-MM-DD")
      .optional(),
  })
  .superRefine((data, ctx) => {
    const hasValidField = Object.entries(data).some(
      ([_key, value]) => value !== undefined,
    );

    if (!hasValidField) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "At least one valid field must be provided for update",
      });
    }
  });

export const uploadProfilePictureSchema = z.object({
  body: z.object({}).optional(),
});

export const deleteAccountSchema = z.object({
  password: z
    .string()
    .min(1, "Password is required to confirm account deletion"),
});

export const profileValidation = {
  updateProfileSchema,
  uploadProfilePictureSchema,
  deleteAccountSchema,
};
