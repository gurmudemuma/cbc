import { Router } from "express";
import { Request, Response } from "express";
const router = Router();

// Placeholder auth routes to keep structure consistent; assumes shared auth is used across services
router.post("/login", (_req: Request, res: Response) => {
  return res
    .status(501)
    .json({ success: false, message: "Not implemented in this service" });
});

router.post("/register", (_req: Request, res: Response) => {
  return res
    .status(501)
    .json({ success: false, message: "Not implemented in this service" });
});

export default router;
