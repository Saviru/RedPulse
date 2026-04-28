import { NextFunction, Request, Response } from "express";

import { AuthenticatedRequest, Role } from "../types/request.types";
import { ApiError } from "../utils/errors";

export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  const userId = req.header("x-user-id");
  const role = req.header("x-role") as Role | undefined;

  if (!userId || !role) {
    return next(new ApiError(401, "Missing auth headers: x-user-id and x-role"));
  }

  (req as AuthenticatedRequest).user = { id: userId, role };
  next();
}

export function requireRole(...allowed: Role[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const authReq = req as AuthenticatedRequest;
    if (!authReq.user) {
      return next(new ApiError(401, "Unauthenticated"));
    }
    if (!allowed.includes(authReq.user.role)) {
      return next(new ApiError(403, "Forbidden"));
    }
    next();
  };
}
