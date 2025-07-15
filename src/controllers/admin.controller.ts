import { Request, Response } from "express";
import prisma from "../config/db";

export const adminDashboard = async (req: Request, res: Response) => {
  try {
    const totalUsers = await prisma.user.count();

    const studentRole = await prisma.role.findUnique({
      where: { name: "student" },
    });

    const teacherRole = await prisma.role.findUnique({
      where: { name: "teacher" },
    });

    const adminRole = await prisma.role.findUnique({
      where: { name: "admin" },
    });

    const [studentsCount, teachersCount, adminsCount] = await Promise.all([
      prisma.userRole.count({ where: { roleId: studentRole?.id } }),
      prisma.userRole.count({ where: { roleId: teacherRole?.id } }),
      prisma.userRole.count({ where: { roleId: adminRole?.id } }),
      // prisma.courses.count(),
    ]);

    res.json({
      totalUsers,
      studentsCount,
      teachersCount,
      adminsCount,
      coursesCount: 0,
    });
  } catch (err) {
    console.error("Admin dashboard error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};
