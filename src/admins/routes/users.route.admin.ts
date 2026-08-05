import express from "express";
import { adminUsersController } from "../controllers/users.controller.admin";
import { requireAdmin, requireAdminAuth } from "@/shared/middlewares";

const router = express.Router();

router.use(requireAdminAuth, requireAdmin);

router.get("/", adminUsersController.getUsers);
router.patch("/:userId/status", adminUsersController.updateUserStatus);

export { router as usersRoutesAdmin };
