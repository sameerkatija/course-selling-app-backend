import { error } from "console";
import { NextFunction, Request, Response } from "express";
import { ZodSchema, ZodIssue } from "zod";

const validateRequest = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const data = { ...req.body };
    if (typeof data?.date === "string") {
      data.date = new Date(data.date);
    }
    if (typeof data?.createdAt === "string") {
      data.createdAt = new Date(data.createdAt);
    }
    try {
      const result = schema.safeParse(data);
      if (!result.success) {
        const first = result.error.issues[0];
        return res.status(400).json({
          message: "Please Input correctly",
          error: `${first.path} => ${first.message}`,
        });
      }
      return next();
    } catch (e: any) {
      return res.status(400).json({ message: "Something went wrong!" });
    }
  };
};

export default validateRequest;
