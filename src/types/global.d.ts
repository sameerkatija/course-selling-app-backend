import { Request } from "express";

declare global {
  namespace Express {
    export interface Request {
      user?: User | null;
    }
  }
}

export type User = {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
};
