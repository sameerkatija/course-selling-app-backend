import { Router } from "express";
import { requireAdmin } from "../middlewares/requireAdmin";
import {
  adminDashboard,
  createAdmin,
  createStudent,
  createTeacher,
  getAllAdmins,
  getAllStudents,
  getAllTeachers,
} from "../controllers/admin.controller";
import validateRequest from "../middlewares/validateZodSchema";
import { addTeacher, userSchema } from "../utils/zodSchema";

const router = Router();
router.use(requireAdmin);

router.get("/dashboard", adminDashboard);
router.get("/students", getAllStudents);
router.get("/teachers", getAllTeachers);
router.get("/admins", getAllAdmins);
router.post("/create-student", validateRequest(userSchema), createStudent);
router.post("/create-teacher", validateRequest(addTeacher), createTeacher);
router.post("/create-admin", validateRequest(addTeacher), createAdmin);

export default router;

// /admin/users

// /admin/approve-teacher

// /admin/courses

// /admin/analytics (optional)
