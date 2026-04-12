import type { Request, Response, NextFunction } from "express";

import { feedbackService } from "../services/feedbackService";
import type {
  CreateFeedbackInput,
  CreateReplyInput,
  UpdateFeedbackInput,
} from "../types/feedback";

function asString(value: unknown): string {
  if (typeof value !== "string") return "";
  return value;
}

function isFeedbackTargetType(value: unknown): value is "hospital" | "organization" {
  return value === "hospital" || value === "organization";
}

function isFeedbackCategory(value: unknown): value is "suggestion" | "compliment" | "general" | "feature_request" {
  return value === "suggestion" || value === "compliment" || value === "general" || value === "feature_request";
}

function isComplaintCategory(value: unknown): value is "technical" | "service" | "donation" | "staff" | "emergency" | "other" {
  return value === "technical" || value === "service" || value === "donation" || value === "staff" || value === "emergency" || value === "other";
}

function isComplaintStatus(value: unknown): value is "pending" | "in_progress" | "resolved" | "rejected" {
  return value === "pending" || value === "in_progress" || value === "resolved" || value === "rejected";
}

function isComplaintPriority(value: unknown): value is "low" | "medium" | "high" | "critical" {
  return value === "low" || value === "medium" || value === "high" || value === "critical";
}

export const feedbackController = {
  getAll(req: Request, res: Response) {
    const targetType = asString(req.query.targetType);
    const targetId = asString(req.query.targetId);
    const userRole = asString(req.query.userRole);
    const userId = asString(req.query.userId);
    const filters: any = {};
    if (targetType && targetId) {
      filters.targetType = targetType;
      filters.targetId = targetId;
    }
    if (userRole && userId) {
      filters.userRole = userRole;
      filters.userId = userId;
    }
    res.json({ data: feedbackService.getAll(filters) });
  },

  create(req: Request, res: Response, next: NextFunction) {
    try {
      const body = req.body as Partial<CreateFeedbackInput>;
      const targetId = asString(body.targetId);
      const targetName = asString(body.targetName);

      // Convert isAnonymous from string to boolean if it came from FormData, default to false
      let isAnonymous = false;
      if (typeof body.isAnonymous === "boolean") {
        isAnonymous = body.isAnonymous;
      } else if (typeof body.isAnonymous === "string") {
        isAnonymous = body.isAnonymous === "true";
      }

      // Basic required fields with explicit errors
      if (!body.type || (body.type !== "feedback" && body.type !== "complaint")) {
        return res.status(400).json({ error: "Missing or invalid field: type" });
      }
      if (!body.title || typeof body.title !== "string" || body.title.trim().length === 0) {
        return res.status(400).json({ error: "Missing or invalid field: title" });
      }
      if (!body.description || typeof body.description !== "string" || body.description.trim().length === 0) {
        return res.status(400).json({ error: "Missing or invalid field: description" });
      }

      if (!body.userId || typeof body.userId !== "string" || body.userId.trim().length === 0) {
        return res.status(400).json({ error: "Missing or invalid field: userId" });
      }
      if (!body.userName || typeof body.userName !== "string" || body.userName.trim().length === 0) {
        return res.status(400).json({ error: "Missing or invalid field: userName" });
      }
      if (!body.userRole || typeof body.userRole !== "string" || body.userRole.trim().length === 0) {
        return res.status(400).json({ error: "Missing or invalid field: userRole" });
      }

      if (!isFeedbackTargetType(body.targetType)) {
        return res.status(400).json({ error: "Missing or invalid field: targetType" });
      }
      if (!targetId || targetId.trim().length === 0) {
        return res.status(400).json({ error: "Missing or invalid field: targetId" });
      }
      if (!targetName || targetName.trim().length === 0) {
        return res.status(400).json({ error: "Missing or invalid field: targetName" });
      }

      // Complaint-specific required fields
      if (body.type === "complaint") {
        if (!body.priority || !isComplaintPriority(body.priority)) {
          return res.status(400).json({ error: "Missing or invalid field: priority" });
        }

        // ✅ AUTO SET DEFAULT STATUS
        if (!body.status || !isComplaintStatus(body.status)) {
          body.status = "pending";
        }
        // Complaints should not have rating on creation; ignore if provided
        if (body.rating !== undefined) {
          delete (body as any).rating;
        }
      }

      // Rating is required ONLY for feedback, not for complaints
      if (body.type === "feedback") {
        let rating: number | undefined;
        if (typeof body.rating === "number") {
          rating = body.rating;
        } else if (typeof body.rating === "string") {
          rating = parseFloat(body.rating);
        }

        if (typeof rating !== "number" || rating < 1 || rating > 5) {
          return res.status(400).json({ error: "Rating is required for feedback (1-5)." });
        }
        // Update body with parsed rating
        (body as any).rating = rating;
      }

      if (body.type === "feedback" && body.category && !isFeedbackCategory(body.category)) {
        return res.status(400).json({ error: "Invalid feedback category." });
      }
      if (body.type === "complaint" && body.category && !isComplaintCategory(body.category)) {
        return res.status(400).json({ error: "Invalid complaint category." });
      }

      // Handle file attachments
      const attachments: string[] = [];
      if (req.files && Array.isArray(req.files)) {
        req.files.forEach((file: any) => {
          // Store the relative path to the file
          attachments.push(`/uploads/${file.filename}`);
        });
      }

      const created = feedbackService.create({
        ...body as CreateFeedbackInput,
        isAnonymous,
        attachments: attachments.length > 0 ? attachments : body.attachments,
      });
      return res.status(201).json({ data: created });
    } catch (e) {
      return next(e);
    }
  },


  update(req: Request, res: Response, next: NextFunction) {
    try {
      const id = asString(req.params.id);
      const body = req.body as Partial<UpdateFeedbackInput>;
      if (!body.type || !body.title || !body.description) {
        return res.status(400).json({ error: "Missing required fields." });
      }
      const updated = feedbackService.update(id, body as UpdateFeedbackInput);
      return res.json({ data: updated });
    } catch (e) {
      return next(e);
    }
  },

  remove(req: Request, res: Response, next: NextFunction) {
    try {
      const id = asString(req.params.id);
      feedbackService.remove(id);
      return res.status(204).send();
    } catch (e) {
      return next(e);
    }
  },

  addReply(req: Request, res: Response, next: NextFunction) {
    try {
      const feedbackId = asString(req.params.id);
      const body = req.body as Partial<CreateReplyInput>;
      if (!body.replierId || !body.replierName || !body.replierRole || !body.content) {
        return res.status(400).json({ error: "Missing required fields." });
      }
      const created = feedbackService.addReply(feedbackId, body as CreateReplyInput);
      return res.status(201).json({ data: created });
    } catch (e) {
      return next(e);
    }
  },

  updateReply(req: Request, res: Response, next: NextFunction) {
    try {
      const feedbackId = asString(req.params.id);
      const replyId = asString(req.params.replyId);
      const content = (req.body as { content?: unknown } | undefined)?.content;
      if (typeof content !== "string" || content.trim().length === 0) {
        return res.status(400).json({ error: "Missing required fields." });
      }
      const updated = feedbackService.updateReply(feedbackId, replyId, content);
      return res.json({ data: updated });
    } catch (e) {
      return next(e);
    }
  },

  updateComplaint(req: Request, res: Response, next: NextFunction) {
    try {
      const id = asString(req.params.id);
      const body = req.body as any;
      const updateData: any = {};
      if (body.status && !isComplaintStatus(body.status)) {
        return res.status(400).json({ error: "Invalid status." });
      }
      if (body.priority && !isComplaintPriority(body.priority)) {
        return res.status(400).json({ error: "Invalid priority." });
      }
      // Ignore rating field for complaints - only allow for resolution feedback
      if (body.rating !== undefined) {
        delete body.rating;
      }
      if (body.status) updateData.status = body.status;
      if (body.priority) updateData.priority = body.priority;
      if (body.assignToId) updateData.assignToId = body.assignToId;
      if (body.resolutionFeedback) updateData.resolutionFeedback = body.resolutionFeedback;
      const updated = feedbackService.updateComplaint(id, updateData);
      return res.json({ data: updated });
    } catch (e) {
      return next(e);
    }
  },

  analytics(req: Request, res: Response) {
    res.json(feedbackService.analytics());
  },

  deleteReply(req: Request, res: Response, next: NextFunction) {
    try {
      const feedbackId = asString(req.params.id);
      const replyId = asString(req.params.replyId);
      feedbackService.deleteReply(feedbackId, replyId);
      return res.status(204).send();
    } catch (e) {
      return next(e);
    }
  },
};

