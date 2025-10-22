import { Router } from "express";
import { UsersController } from "../controllers/users.controller";
import { authMiddleware } from "../middleware/auth.middleware";
import { validateRegister } from "../middleware/validation.middleware";

const router = Router();
const controller = new UsersController();

router.use(authMiddleware);

// List users (defaults to exporter org)
router.get("/", controller.getUsers);

// Create exporter portal user
router.post("/", validateRegister, controller.createUser);

// Activate/Deactivate
router.patch("/:id/deactivate", controller.deactivateUser);
router.patch("/:id/activate", controller.activateUser);

export default router;
