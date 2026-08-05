import express from "express";
import { adminAuthController } from "../controllers/auth.controller";
import { adminAuthValidation } from "../validations/auth.validation";
import {
    requireAdminAuth,
    requireSuperAdmin,
    validate,
} from "@shared/middlewares";

const authRoutes = express.Router();

authRoutes.post(
    "/create",
    requireAdminAuth,
    requireSuperAdmin,
    validate(adminAuthValidation.createAdminUserSchema),
    adminAuthController.createAdminUser,
);

authRoutes.post(
    "/login",
    validate(adminAuthValidation.loginSchema),
    adminAuthController.login,
);

authRoutes.post("/logout", requireAdminAuth, adminAuthController.adminLogout);

authRoutes.post(
    "/change-password",
    requireAdminAuth,
    validate(adminAuthValidation.passwordChangeSchema),
    adminAuthController.changePasswordAdmin,
);

authRoutes.get(
    "/profile",
    requireAdminAuth,
    adminAuthController.getAdminProfile,
);

authRoutes.get("/", requireAdminAuth, adminAuthController.getAllAdmin);

authRoutes.post("/refresh-token", adminAuthController.refreshAdminToken);

authRoutes.patch(
    "/suspend/:adminId",
    requireAdminAuth,
    requireSuperAdmin,
    validate(adminAuthValidation.suspendAdminSchema),
    adminAuthController.suspendAdmin,
);

authRoutes.delete(
    "/delete/:adminId",
    requireAdminAuth,
    requireSuperAdmin,
    adminAuthController.deleteAdmin,
);

authRoutes.patch(
    "/reset-password/:adminId",
    requireAdminAuth,
    requireSuperAdmin,
    validate(adminAuthValidation.superAdminResetPasswordSchema),
    adminAuthController.resetAdminPassword,
);

export { authRoutes };
