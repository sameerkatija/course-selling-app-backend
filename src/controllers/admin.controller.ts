import { Request, Response } from "express";
import prisma from "../config/db";
import generateTempPassword from "../utils/generatePassword";
import { SALT_ROUNDS } from "../config/env";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

export const adminDashboard = async (req: Request, res: Response) => {
  try {
    // Total users
    const totalUsers = await prisma.user.count();

    // Count users by roles using array filters
    const studentRole = await prisma.role.findUnique({
      where: { name: "student" },
    });

    const teacherRole = await prisma.role.findUnique({
      where: { name: "teacher" },
    });

    const adminRole = await prisma.role.findUnique({
      where: { name: "admin" },
    });

    // Count courses
    const coursesCount = await prisma.course.count();

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
      coursesCount,
    });
  } catch (err) {
    console.error("Admin dashboard error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getAllStudents = async (req: Request, res: Response) => {
  try {
    // Fetch roleId for 'student'
    const studentRole = await prisma.role.findUnique({
      where: { name: "student" },
    });

    if (!studentRole) {
      return res.status(404).json({ error: "Student role not found" });
    }

    // Fetch all users who have student role
    const students = await prisma.user.findMany({
      where: {
        roles: {
          some: {
            roleId: studentRole.id, // UserRole relation filter
          },
        },
      },
      select: {
        id: true,
        first_name: true,
        last_name: true,
        email: true,
        createdAt: true,
        studentProfile: true, // Include student-specific data
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    res.json({ students });
  } catch (err) {
    console.error("Error fetching students:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getAllTeachers = async (req: Request, res: Response) => {
  try {
    // Fetch roleId for 'student'
    const teacherRole = await prisma.role.findUnique({
      where: { name: "teacher" },
    });

    if (!teacherRole) {
      return res.status(404).json({ error: "Teacher role not found" });
    }

    // Fetch all users who have student role
    const teachers = await prisma.user.findMany({
      where: {
        roles: {
          some: {
            roleId: teacherRole.id, // UserRole relation filter
          },
        },
      },
      select: {
        id: true,
        first_name: true,
        last_name: true,
        email: true,
        createdAt: true,
        teacherProfile: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    res.json({ teachers });
  } catch (err) {
    console.error("Error fetching students:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getAllAdmins = async (req: Request, res: Response) => {
  try {
    // Fetch roleId for 'student'
    const adminRole = await prisma.role.findUnique({
      where: { name: "admin" },
    });

    if (!adminRole) {
      return res.status(404).json({ error: "Admin role not found" });
    }

    // Fetch all users who have student role
    const admins = await prisma.user.findMany({
      where: {
        roles: {
          some: {
            roleId: adminRole.id, // UserRole relation filter
          },
        },
      },
      select: {
        id: true,
        first_name: true,
        last_name: true,
        email: true,
        createdAt: true,
        adminProfile: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    res.json({ admins });
  } catch (err) {
    console.error("Error fetching students:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const createStudent = async (req: Request, res: Response) => {
  try {
    const user = req.user;
    if (!user) {
      return res
        .status(401)
        .json({ error: "Unauthorized: admin identity missing" });
    }

    const { first_name, last_name, email, password } = req.body;

    // Ensure email uniqueness
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res
        .status(409)
        .json({ error: "A user with this email already exists." });
    }

    // Use provided password or generate a temporary one
    const plainPassword = password ?? generateTempPassword();
    const hashedPassword = await bcrypt.hash(plainPassword, SALT_ROUNDS);
    // Ensure student Role exists
    const studentRole = await prisma.role.findUnique({
      where: { name: "student" },
    });
    if (!studentRole) {
      return res
        .status(500)
        .json({ error: "Student role not found. Seed roles first." });
    }
    // Wrap user + role + profile creation in a transaction
    const createdUser = await prisma.$transaction(async (tx) => {
      // 1. Create User
      const user = await tx.user.create({
        data: {
          email,
          password: hashedPassword,
          first_name,
          last_name,
        },
      });

      // 2. Assign student role (assignedBy admin)
      await tx.userRole.create({
        data: {
          userId: user.id,
          roleId: studentRole.id,
          assignedById: user.id,
        },
      });

      // 3. Create empty StudentProfile
      await tx.studentProfile.create({
        data: {
          userId: user.id,
          bio: "",
        },
      });

      return user;
    });

    // Re-fetch user with role + profile info
    const fullUser = await prisma.user.findUnique({
      where: { id: createdUser.id },
      omit: {
        password: true,
      },
      include: {
        roles: { include: { role: true } },
        studentProfile: true,
      },
    });

    res.status(201).json({
      user: fullUser,
      // Return temp password ONLY if admin supplied none.
      // You may want to send this via email instead.
      message: "Student created successfully.",
    });
  } catch (err) {
    console.error("Admin createStudent error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const createTeacher = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    const user = req.user;
    if (!user) {
      return res
        .status(401)
        .json({ error: "Unauthorized: admin identity missing." });
    }

    const teacher = await prisma.user.findUnique({
      where: { email },
      omit: {
        password: true,
      },
      include: {
        studentProfile: true,
        teacherProfile: true,
      },
    });
    if (!teacher) {
      return res.status(404).json({
        error:
          "User not found. Create the user first before promoting to teacher.",
      });
    }

    if (teacher.teacherProfile) {
      return res
        .status(200)
        .json({ message: "User already had teacher role." });
    }

    const teacherRole = await prisma.role.findUnique({
      where: { name: "teacher" },
    });
    if (!teacherRole) {
      return res
        .status(500)
        .json({ error: "Teacher role not found. Seed roles first." });
    }

    const teacherProfile = await prisma.$transaction(async (tx) => {
      // create UserRole
      await tx.userRole.create({
        data: {
          userId: teacher.id,
          roleId: teacherRole.id,
          assignedById: user.id,
        },
      });

      await tx.teacherProfile.create({
        data: {
          userId: teacher.id,
          bio: "",
          status: "APPROVED",
        },
      });
      return "Success";
    });
    if (!(teacherProfile == "Success")) {
      return res.status(500).json({ error: "Internal server error." });
    }
    const updatedTeacher = await prisma.user.findUnique({
      where: { email },
      omit: {
        password: true,
      },
      include: {
        roles: {
          include: { role: true },
        },
        studentProfile: true,
        teacherProfile: true,
      },
    });
    res
      .status(200)
      .json({ message: "User promoted to teacher", teacher: updatedTeacher });
  } catch (error) {
    return res.status(500).json({ error: "Internal server error." });
  }
};

export const createAdmin = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    const user = req.user;
    if (!user) {
      return res
        .status(401)
        .json({ error: "Unauthorized: admin identity missing." });
    }

    const admin = await prisma.user.findUnique({
      where: { email },
      omit: {
        password: true,
      },
      include: {
        studentProfile: true,
        adminProfile: true,
      },
    });
    if (!admin) {
      return res.status(404).json({
        error:
          "User not found. Create the user first before promoting to Admin.",
      });
    }

    if (admin.adminProfile) {
      return res.status(200).json({ message: "User already had admin role." });
    }

    const adminRole = await prisma.role.findUnique({
      where: { name: "admin" },
    });
    if (!adminRole) {
      return res
        .status(500)
        .json({ error: "Admin role not found. Seed roles first." });
    }

    const adminProfile = await prisma.$transaction(async (tx) => {
      // create UserRole
      await tx.userRole.create({
        data: {
          userId: admin.id,
          roleId: adminRole.id,
          assignedById: user.id,
        },
      });

      await tx.adminProfile.create({
        data: {
          userId: admin.id,
        },
      });
      return "Success";
    });
    if (!(adminProfile == "Success")) {
      return res.status(500).json({ error: "Internal server error." });
    }
    const updatedAdmin = await prisma.user.findUnique({
      where: { email },
      omit: {
        password: true,
      },
      include: {
        roles: {
          include: { role: true },
        },
        studentProfile: true,
        teacherProfile: true,
        adminProfile: true,
      },
    });
    res
      .status(200)
      .json({ message: "User promoted to admin", admin: updatedAdmin });
  } catch (error) {
    return res.status(500).json({ error: "Internal server error." });
  }
};

// remove user, admin and teacher
// approve teacher
