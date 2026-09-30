import { Router } from "express";

import { appSettingsController } from "../controllers/app-settings.controller.admin";
import { requireAdminAuth } from "@/shared/middlewares/admin.auth.middleware";

const appSettingsRoutes = Router();

appSettingsRoutes.use(requireAdminAuth);

appSettingsRoutes.get("/", appSettingsController.getSettings);
appSettingsRoutes.put("/", appSettingsController.updateSetting);

export { appSettingsRoutes };
