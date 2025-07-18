import { Request, Response } from "express";
import prisma from "../config/db";

export const getUser = async (req: Request, res: Response) => {
  const id = req?.user?.id;
  const user = await prisma.user.findUnique({
    where: {
      id,
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
  if (!user) {
    return res.status(401).json({ error: "Invalid credentials" });
  }
  return res.json({ message: "User Successfully fetched!", user });
};
