import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import prisma from "../config/db";
import { JWT_SECRET } from "../config/env";
import { User } from "../types/global";

export const requireAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res
        .status(401)
        .json({ message: "Unauthorized: No token provided" });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as User;

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      include: {
        roles: {
          include: { role: true },
        },
      },
    });
    if (!user) {
      return res.status(401).json({ message: "Unauthorized: User not found" });
    }

    const hasAdminRole = user.roles.some(
      (userRole) => userRole.role.name === "admin"
    );
    if (!hasAdminRole) {
      return res.status(403).json({ message: "Forbidden: Admins only" });
    }

    req.user = user; // Optional: Attach full user to request
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid token" });
  }
};
