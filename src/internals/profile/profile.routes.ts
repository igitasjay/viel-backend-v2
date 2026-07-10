import express from "express";
import { profileController } from "./profile.controller";
import { requireAuth, validate } from "@shared/middlewares";
import { profileValidation } from "./profile.validation";
// import { uploadMiddleware } from "@/middlewares/upload.middleware";

const profileRoutes = express.Router();

profileRoutes.get("/", requireAuth, profileController.getProfile);

profileRoutes.patch(
  "/",
  requireAuth,
  validate(profileValidation.updateProfileSchema),
  profileController.updateProfile,
);

// profileRoutes.post(
//   "/picture",
//   requireAuth,
//   uploadMiddleware.single("profilePicture"),
//   validate(profileValidation.uploadProfilePictureSchema),
//   profileController.uploadProfilePicture,
// );

profileRoutes.delete(
  "/picture",
  requireAuth,
  profileController.removeProfilePicture,
);

profileRoutes.delete(
  "/",
  requireAuth,
  validate(profileValidation.deleteAccountSchema),
  profileController.deleteAccount,
);

// profileRoutes.get("/tagline", requireAuth, profileController.getTagline);
profileRoutes.get("/net-trading-volume", requireAuth, profileController.getNetTradingVolume);

export { profileRoutes };