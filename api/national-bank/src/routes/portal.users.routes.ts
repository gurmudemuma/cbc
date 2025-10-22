import { Router } from "express";
import { PortalUsersController } from "../controllers/portal.users.controller";
import { authMiddleware } from "../middleware/auth.middleware";
import { validateRegister } from "../middleware/validation.middleware";

const router = Router();
const controller = new PortalUsersController();

// National Bank protected
router.use(authMiddleware);

router.get("/", controller.getUsers);
router.post("/", validateRegister, controller.createUser);
router.patch("/:id/deactivate", controller.deactivateUser);
router.patch("/:id/activate", controller.activateUser);

export default router;
