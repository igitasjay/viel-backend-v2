import express from "express";
import { profileController } from "./profile.controller";
import { requireAuth, validate } from "@shared/middlewares";
import { profileValidation } from "./profile.validation";
// import { uploadMiddleware } from "@/middlewares/upload.middleware";

const profileRoutes = express.Router();

/**
 * @swagger
 * /profile:
 *   get:
 *     tags:
 *       - Profile
 *     summary: Get user profile
 *     description: Retrieves the authenticated user's profile information including personal details, verification status, and profile picture.
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Profile retrieved successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Profile retrieved successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       example: clx1234567890abcdef
 *                     fullName:
 *                       type: string
 *                       example: John Doe
 *                     email:
 *                       type: string
 *                       example: john.doe@example.com
 *                     username:
 *                       type: string
 *                       example: "@johndoe"
 *                     phone:
 *                       type: string
 *                       example: "08012345678"
 *                     profilePicture:
 *                       type: string
 *                       nullable: true
 *                       example: https://res.cloudinary.com/demo/image/upload/profile.jpg
 *                     dateOfBirth:
 *                       type: string
 *                       format: date-time
 *                       nullable: true
 *                       example: 1990-01-15T00:00:00.000Z
 *                     isActive:
 *                       type: boolean
 *                       example: true
 *                     isVerified:
 *                       type: boolean
 *                       example: true
 *                     isKycVerified:
 *                       type: boolean
 *                       example: false
 *                     tier:
 *                       type: string
 *                       example: BASIC
 *                     referralCode:
 *                       type: string
 *                       example: REF123ABC
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                       example: 2024-01-01T10:30:00.000Z
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 *                       example: 2024-01-15T14:22:00.000Z
 *       401:
 *         description: Unauthorized - Invalid or missing authentication token.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: User not found.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: User not found
 *       500:
 *         description: Internal Server Error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
profileRoutes.get("/", requireAuth, profileController.getProfile);

/**
 * @swagger
 * /profile:
 *   patch:
 *     tags:
 *       - Profile
 *     summary: Update user profile
 *     description: Updates the authenticated user's profile information. At least one field must be provided. Email cannot be changed after account verification. Phone and username must be unique.
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             minProperties: 1
 *             properties:
 *               fullName:
 *                 type: string
 *                 description: User's full name. Must be 2-100 characters and contain only letters, spaces, hyphens, and apostrophes.
 *                 minLength: 2
 *                 maxLength: 100
 *                 pattern: '^[a-zA-Z\s''-]+$'
 *                 example: Jane Smith
 *               phone:
 *                 type: string
 *                 description: Phone number. Must be exactly 11 digits starting with 0.
 *                 pattern: '^0\d{10}$'
 *                 minLength: 11
 *                 maxLength: 11
 *                 example: "08087654321"
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Email address. Cannot be changed after account verification. Will be converted to lowercase.
 *                 example: jane.smith@example.com
 *               username:
 *                 type: string
 *                 description: Username. Must be 3-20 characters, start with @ (auto-added if missing), and contain only letters, numbers, dots, or underscores. Cannot have consecutive dots/underscores or end with them.
 *                 pattern: '^@?(?=[a-zA-Z0-9._]{3,20}$)(?!.*[._]{2})[a-zA-Z0-9](?:[a-zA-Z0-9._]*[a-zA-Z0-9])?$'
 *                 minLength: 3
 *                 maxLength: 20
 *                 example: "@janesmith"
 *               countryOfResidence:
 *                 type: string
 *                 description: Two-letter country code (ISO 3166-1 alpha-2).
 *                 minLength: 2
 *                 maxLength: 2
 *                 example: NG
 *             example:
 *               fullName: Jane Smith
 *               phone: "08087654321"
 *               username: "@janesmith"
 *     responses:
 *       200:
 *         description: Profile updated successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Profile updated successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       example: clx1234567890abcdef
 *                     fullName:
 *                       type: string
 *                       example: Jane Smith
 *                     email:
 *                       type: string
 *                       example: jane.smith@example.com
 *                     username:
 *                       type: string
 *                       example: "@janesmith"
 *                     phone:
 *                       type: string
 *                       example: "08087654321"
 *                     profilePicture:
 *                       type: string
 *                       nullable: true
 *                     dateOfBirth:
 *                       type: string
 *                       format: date-time
 *                       nullable: true
 *                     isActive:
 *                       type: boolean
 *                       example: true
 *                     isVerified:
 *                       type: boolean
 *                       example: true
 *                     isKycVerified:
 *                       type: boolean
 *                       example: false
 *                     tier:
 *                       type: string
 *                       example: BASIC
 *                     referralCode:
 *                       type: string
 *                       example: REF123ABC
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 *                 updatedFields:
 *                   type: array
 *                   items:
 *                     type: string
 *                   example: ["fullName", "phone"]
 *       400:
 *         description: Bad Request - Validation error, email change not allowed after verification, or at least one field required.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Email cannot be changed after account verification
 *                 errors:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       path:
 *                         type: string
 *                       message:
 *                         type: string
 *       401:
 *         description: Unauthorized - Invalid or missing authentication token.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: User not found.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: User not found
 *       409:
 *         description: Conflict - Phone number or username already in use by another account.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Phone number is already in use by another account
 *       500:
 *         description: Internal Server Error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
profileRoutes.patch(
  "/",
  requireAuth,
  validate(profileValidation.updateProfileSchema),
  profileController.updateProfile,
);

/**
 * @swagger
 * /profile/picture:
 *   post:
 *     tags:
 *       - Profile
 *     summary: Upload profile picture
 *     description: Uploads a new profile picture for the authenticated user. The image will be automatically cropped to 400x400px, optimized for quality, and converted to JPG format. If a previous profile picture exists, it will be replaced.
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - profilePicture
 *             properties:
 *               profilePicture:
 *                 type: string
 *                 format: binary
 *                 description: Image file for profile picture. Must be JPG, PNG, or WebP format. Maximum size 5MB.
 *           encoding:
 *             profilePicture:
 *               contentType: image/jpeg, image/jpg, image/png, image/webp
 *     responses:
 *       200:
 *         description: Profile picture uploaded successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Profile picture uploaded successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       example: clx1234567890abcdef
 *                     profilePicture:
 *                       type: string
 *                       example: https://res.cloudinary.com/demo/image/upload/v1234567890/trade-aviator/profile-pictures/profile_clx123_1234567890.jpg
 *                     cloudinaryId:
 *                       type: string
 *                       example: trade-aviator/profile-pictures/profile_clx123_1234567890
 *                     uploadedAt:
 *                       type: string
 *                       format: date-time
 *                       example: 2024-01-15T14:30:00.000Z
 *       400:
 *         description: Bad Request - No file provided, invalid file type, or file too large.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Only image files are allowed
 *             examples:
 *               noFile:
 *                 value:
 *                   message: No image file provided
 *               invalidType:
 *                 value:
 *                   message: Only image files are allowed
 *               tooLarge:
 *                 value:
 *                   message: File size must be less than 5MB
 *       401:
 *         description: Unauthorized - Invalid or missing authentication token.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: User not found.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: User not found
 *       500:
 *         description: Internal Server Error - Failed to upload to Cloudinary.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Failed to upload profile picture
 */
// profileRoutes.post(
//   "/picture",
//   requireAuth,
//   uploadMiddleware.single("profilePicture"),
//   validate(profileValidation.uploadProfilePictureSchema),
//   profileController.uploadProfilePicture,
// );

/**
 * @swagger
 * /profile/picture:
 *   delete:
 *     tags:
 *       - Profile
 *     summary: Remove profile picture
 *     description: Removes the authenticated user's profile picture. If the picture is stored on Cloudinary, it will also be deleted from there. The profile picture field will be set to null.
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Profile picture removed successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Profile picture removed successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       example: clx1234567890abcdef
 *                     fullName:
 *                       type: string
 *                       example: John Doe
 *                     email:
 *                       type: string
 *                       example: john.doe@example.com
 *                     username:
 *                       type: string
 *                       example: "@johndoe"
 *                     phone:
 *                       type: string
 *                       example: "08012345678"
 *                     profilePicture:
 *                       type: string
 *                       nullable: true
 *                       example: null
 *                     dateOfBirth:
 *                       type: string
 *                       format: date-time
 *                       nullable: true
 *                     isActive:
 *                       type: boolean
 *                       example: true
 *                     isVerified:
 *                       type: boolean
 *                       example: true
 *                     isKycVerified:
 *                       type: boolean
 *                       example: false
 *                     tier:
 *                       type: string
 *                       example: BASIC
 *                     referralCode:
 *                       type: string
 *                       example: REF123ABC
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: Bad Request - No profile picture to remove.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: No profile picture to remove
 *       401:
 *         description: Unauthorized - Invalid or missing authentication token.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: User not found.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: User not found
 *       500:
 *         description: Internal Server Error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
profileRoutes.delete(
  "/picture",
  requireAuth,
  profileController.removeProfilePicture,
);

/**
 * @swagger
 * /profile:
 *   delete:
 *     tags:
 *       - Profile
 *     summary: Delete user account
 *     description: Permanently deletes the authenticated user's account and all associated data. This action is irreversible. Users must provide their password and type "DELETE" to confirm. Account cannot be deleted if there are active balances in wallets or virtual accounts.
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - password
 *               - confirmation
 *             properties:
 *               password:
 *                 type: string
 *                 format: password
 *                 description: User's account password for verification
 *                 example: "MySecurePassword123!"
 *               confirmation:
 *                 type: string
 *                 description: Must be exactly "DELETE" to confirm account deletion
 *                 example: "DELETE"
 *     responses:
 *       200:
 *         description: Account deleted successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Account deleted successfully. We're sorry to see you go."
 *                 data:
 *                   type: object
 *                   properties:
 *                     deletedAt:
 *                       type: string
 *                       format: date-time
 *                       example: "2024-01-15T14:30:00.000Z"
 *                     email:
 *                       type: string
 *                       example: "user@example.com"
 *       400:
 *         description: Bad Request - Active balance exists or confirmation string incorrect.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Cannot delete account with active balance. Please withdraw all funds first."
 *             examples:
 *               activeBalance:
 *                 value:
 *                   message: "Cannot delete account with active balance. Please withdraw all funds first."
 *               invalidConfirmation:
 *                 value:
 *                   message: 'You must type "DELETE" to confirm'
 *       401:
 *         description: Unauthorized - Invalid password or missing authentication token.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Invalid password"
 *       404:
 *         description: User not found.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "User not found"
 *       500:
 *         description: Internal Server Error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
profileRoutes.delete(
  "/",
  requireAuth,
  validate(profileValidation.deleteAccountSchema),
  profileController.deleteAccount,
);

// /**
//  * @swagger
//  * /profile/tagline:
//  *   get:
//  *     tags:
//  *       - Profile
//  *     summary: Get homepage tagline
//  *     description: Retrieves the current homepage tagline to be displayed under the user's name on the mobile app homepage. Returns a default tagline if none has been set by admins.
//  *     security:
//  *       - BearerAuth: []
//  *     responses:
//  *       200:
//  *         description: Tagline retrieved successfully.
//  *         content:
//  *           application/json:
//  *             schema:
//  *               type: object
//  *               properties:
//  *                 success:
//  *                   type: boolean
//  *                   example: true
//  *                 message:
//  *                   type: string
//  *                   example: Tagline retrieved successfully
//  *                 data:
//  *                   type: object
//  *                   properties:
//  *                     tagline:
//  *                       type: string
//  *                       description: The homepage tagline text to display under "Hello {username}"
//  *                       example: "Let's get it"
//  *             examples:
//  *               withCustomTagline:
//  *                 summary: Custom tagline set by admin
//  *                 value:
//  *                   success: true
//  *                   message: Tagline retrieved successfully
//  *                   data:
//  *                     tagline: "Let's get it"
//  *               withDefaultTagline:
//  *                 summary: Default tagline (when not set)
//  *                 value:
//  *                   success: true
//  *                   message: Tagline retrieved successfully
//  *                   data:
//  *                     tagline: "Trade smarter, earn faster!"
//  *       401:
//  *         description: Unauthorized - Invalid or missing authentication token.
//  *         content:
//  *           application/json:
//  *             schema:
//  *               $ref: '#/components/schemas/ErrorResponse'
//  *       500:
//  *         description: Internal Server Error
//  *         content:
//  *           application/json:
//  *             schema:
//  *               $ref: '#/components/schemas/ErrorResponse'
//  */
// profileRoutes.get("/tagline", requireAuth, profileController.getTagline);

export { profileRoutes };

// import express from 'express';
// import { profileController } from './profile.controller';
// import { requireAuth, validate, uploadMiddleware } from '../../middlewares';
// import { profileValidation } from './profile.validation';

// const profileRoutes = express.Router();

// profileRoutes.get(
//   '/',
//   requireAuth,
//   // validate(profileValidation.getProfileSchema),
//   profileController.getProfile

// );
// profileRoutes.patch(
//   '/',
//   requireAuth,
//   validate(profileValidation.updateProfileSchema),
//   profileController.updateProfile
// );

// profileRoutes.post(
//   '/picture',
//   requireAuth,
//   uploadMiddleware.single('profilePicture'),
//   validate(profileValidation.uploadProfilePictureSchema),
//   profileController.uploadProfilePicture
// );

// profileRoutes.delete(
//   '/picture',
//   requireAuth,
//   profileController.removeProfilePicture
// );

// export { profileRoutes };
