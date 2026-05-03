import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';
  let errors: Record<string, string> | undefined;

  if (err instanceof ZodError) {
    statusCode = 400;
    message = 'Validation Error';
    errors = {};
    err.issues.forEach((e: any) => {
      const path = e.path.join('.');
      errors![path] = e.message;
    });
  }
  
  res.status(statusCode).json({
    message,
    errors,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
};
