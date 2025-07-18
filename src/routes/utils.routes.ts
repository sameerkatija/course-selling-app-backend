import { Router } from "express";
import { getUser } from "../controllers/utils.controller";
import { authenticate } from "../middlewares/auth";

const router = Router();

router.get("/me", authenticate, getUser);

export default router;
