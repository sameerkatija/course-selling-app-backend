import { Request, Response, Router } from "express";
import authRoutes from "./auth.routes";
import adminRoutes from "./admin.routes";
import { authenticate } from "../middlewares/auth";
import { requireAdmin } from "../middlewares/requireAdmin";
const router = Router();

router.get("/test", (req: Request, res: Response) => {
  res.json({ message: "working fine" });
});

router.get("/auth-test", authenticate, (req: Request, res: Response) => {
  res.json({ message: "Auth working fine", user: req?.user });
});

router.get("/auth-admin", requireAdmin, (req: Request, res: Response) => {
  res.json({ message: "Admin is working", user: req?.user });
});

router.use("/auth", authRoutes);
router.use("/admin", adminRoutes);
export default router;
