import { Response } from "express";

export function ok<T>(res: Response, data: T, message = "success"): Response {
  return res.status(200).json({ success: true, message, data });
}

export function created<T>(res: Response, data: T, message = "created"): Response {
  return res.status(201).json({ success: true, message, data });
}
