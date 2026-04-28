import { Request } from "express";

export type Role = "ORGANIZATION" | "HOSPITAL" | "USER";

export interface AuthUser {
  id: string;
  role: Role;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthUser;
}
