import { Router } from "express";
import { requireAdmin } from "../middlewares/requireAdmin";
import { adminDashboard } from "../controllers/admin.controller";

const router = Router();
router.use(requireAdmin);

router.get("/dashboard", adminDashboard);

export default router;

// /admin/dashboard

// /admin/users

// /admin/approve-teacher

// /admin/courses

// /admin/analytics (optional)
