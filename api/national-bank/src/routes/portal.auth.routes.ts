import { Router } from "express";
import { PortalAuthController } from "../controllers/portal.auth.controller";

const router = Router();
const controller = new PortalAuthController();

// Public login for exporter portal users
router.post("/login", controller.login);

export default router;
