import { Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import prisma from "../config/db";
import { JWT_SECRET, SALT_ROUNDS } from "../config/env";
// POST /signup
export const signup = async (req: Request, res: Response) => {
  try {
    const { email, password, first_name, last_name } = req.body;

    // 1. Check if user already exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: "User already exists" });
    }

    // 2. Hash the password
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    // 3. Get student role
    const studentRole = await prisma.role.findUnique({
      where: { name: "student" },
    });
    if (!studentRole) {
      return res.status(500).json({ error: "Student role not found" });
    }

    // 4. Create user first
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        first_name,
        last_name,
      },
    });

    // 5. Create userRole record (self-assigned)
    const userRole = await prisma.userRole.create({
      data: {
        userId: user.id,
        roleId: studentRole.id,
        assignedById: user.id, // self-assigned
      },
    });

    // 6. Create student profile (optional)
    const student = await prisma.studentProfile.create({
      data: {
        userId: user.id,
        bio: "",
      },
    });
    const safeUser = await prisma.user.findUnique({
      where: {
        id: user.id,
      },
      omit: {
        password: true,
      },
      include: {
        roles: {
          include: {
            role: true,
          },
        },
        studentProfile: true,
        teacherProfile: true,
        adminProfile: true,
      },
    });
    // 7. Generate JWT token
    const token = jwt.sign(
      {
        id: user.id,
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
      },
      JWT_SECRET,
      {
        expiresIn: "7d",
      }
    );
    res.header("Authorization", `Bearer ${token}`);
    res.status(201).json({ user: safeUser, token });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

// POST /login
export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        roles: {
          include: {
            role: true,
          },
        },
        studentProfile: true,
        teacherProfile: true,
        adminProfile: true,
      },
    });

    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(401).json({ error: "Invalid credentials" });
    }
    const { password: String, ...safeuser } = user;
    const token = jwt.sign(
      {
        id: user.id,
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
      },
      JWT_SECRET,
      {
        expiresIn: "7d",
      }
    );
    res.header("Authorization", `Bearer ${token}`);
    res.status(200).json({ user: safeuser, token });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};
