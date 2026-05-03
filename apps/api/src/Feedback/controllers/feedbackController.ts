import type { Request, Response, NextFunction } from "express";

import { feedbackService, type FeedbackFilters } from "../services/feedbackService";
import type {
  CreateFeedbackInput,
  CreateReplyInput,
  UpdateFeedbackInput,
  UpdateComplaintInput,
  FeedbackTargetType,
  FeedbackCategory,
  ComplaintCategory,
  ComplaintStatus,
  ComplaintPriority,
  ReplierRole,
} from "../types/feedback";

// ---------------------------------------------------------------------------
// Type guards
// ---------------------------------------------------------------------------
const FEEDBACK_TARGET_TYPES = ["hospital", "organization"] as const;
const FEEDBACK_CATEGORIES = [
  "suggestion",
  "compliment",
  "general",
  "feature_request",
] as const;
const COMPLAINT_CATEGORIES = [
  "technical",
  "service",
  "donation",
  "staff",
  "emergency",
  "other",
] as const;
const COMPLAINT_STATUSES = ["pending", "in_progress", "resolved", "rejected"] as const;
const COMPLAINT_PRIORITIES = ["low", "medium", "high", "critical"] as const;
const REPLIER_ROLES = ["user", "hospital", "organization"] as const;

const oneOf = <T extends string>(allowed: readonly T[]) =>
  (value: unknown): value is T =>
    typeof value === "string" && (allowed as readonly string[]).includes(value);

const isFeedbackTargetType = oneOf<FeedbackTargetType>(FEEDBACK_TARGET_TYPES);
const isFeedbackCategory = oneOf<FeedbackCategory>(FEEDBACK_CATEGORIES);
const isComplaintCategory = oneOf<ComplaintCategory>(COMPLAINT_CATEGORIES);
const isComplaintStatus = oneOf<ComplaintStatus>(COMPLAINT_STATUSES);
const isComplaintPriority = oneOf<ComplaintPriority>(COMPLAINT_PRIORITIES);
const isReplierRole = oneOf<ReplierRole>(REPLIER_ROLES);

// ---------------------------------------------------------------------------
// Parsing / sanitization helpers
// ---------------------------------------------------------------------------
const TITLE_MAX = 200;
const DESCRIPTION_MAX = 5000;
const REPLY_MAX = 2000;
const ID_MAX = 100;
const NAME_MAX = 200;

function asString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function asTrimmed(value: unknown, max: number): string {
  if (typeof value !== "string") return "";
  const trimmed = value.trim();
  return trimmed.length > max ? trimmed.slice(0, max) : trimmed;
}

function parseRating(value: unknown): number | undefined {
  if (typeof value === "number") return value;
  if (typeof value === "string" && value.trim()) {
    const n = Number(value);
    return Number.isFinite(n) ? n : undefined;
  }
  return undefined;
}

function parseBoolean(value: unknown, fallback = false): boolean {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") return value === "true";
  return fallback;
}

class ValidationError extends Error {
  status = 400;
  constructor(message: string) {
    super(message);
  }
}

// ---------------------------------------------------------------------------
// Controller — all handlers are async to await Mongo I/O
// ---------------------------------------------------------------------------
export const feedbackController = {
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const filters: FeedbackFilters = {};

      const targetType = asString(req.query.targetType);
      const targetId = asString(req.query.targetId);
      if (targetType && targetId) {
        filters.targetType = targetType;
        filters.targetId = targetId;
      }

      const userRole = asString(req.query.userRole);
      const username = asString(req.query.username);
      if (userRole && username) {
        filters.userRole = userRole;
        filters.username = username;
      }

      const data = await feedbackService.getAll(filters);
      return res.json({ data });
    } catch (e) {
      return next(e);
    }
  },

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const body = (req.body ?? {}) as Record<string, unknown>;

      const title = asTrimmed(body.title, TITLE_MAX);
      const description = asTrimmed(body.description, DESCRIPTION_MAX);
      const username = asTrimmed(body.username, ID_MAX);
      const userName = asTrimmed(body.userName, NAME_MAX);
      const userRole = asTrimmed(body.userRole, ID_MAX);
      const targetId = asTrimmed(body.targetId, ID_MAX);
      const targetName = asTrimmed(body.targetName, NAME_MAX);

      if (body.type !== "feedback" && body.type !== "complaint") {
        throw new ValidationError("Missing or invalid field: type");
      }
      if (!title) throw new ValidationError("Missing or invalid field: title");
      if (!description) throw new ValidationError("Missing or invalid field: description");
      if (!username) throw new ValidationError("Missing or invalid field: username");
      if (!userName) throw new ValidationError("Missing or invalid field: userName");
      if (!userRole) throw new ValidationError("Missing or invalid field: userRole");
      if (!isFeedbackTargetType(body.targetType)) {
        throw new ValidationError("Missing or invalid field: targetType");
      }
      if (!targetId) throw new ValidationError("Missing or invalid field: targetId");
      if (!targetName) throw new ValidationError("Missing or invalid field: targetName");

      const isAnonymous = parseBoolean(body.isAnonymous, false);

      let category: FeedbackCategory | ComplaintCategory | undefined;
      let priority: ComplaintPriority | undefined;
      let rating: number | undefined;

      if (body.type === "feedback") {
        if (body.category !== undefined && !isFeedbackCategory(body.category)) {
          throw new ValidationError("Invalid feedback category.");
        }
        category = body.category as FeedbackCategory | undefined;

        const parsedRating = parseRating(body.rating);
        if (typeof parsedRating !== "number" || parsedRating < 1 || parsedRating > 5) {
          throw new ValidationError("Rating is required for feedback (1-5).");
        }
        rating = parsedRating;
      } else {
        if (body.category !== undefined && !isComplaintCategory(body.category)) {
          throw new ValidationError("Invalid complaint category.");
        }
        category = body.category as ComplaintCategory | undefined;

        if (!isComplaintPriority(body.priority)) {
          throw new ValidationError("Missing or invalid field: priority");
        }
        priority = body.priority;
      }

      let attachments: string[] | undefined;
      if (Array.isArray(req.files)) {
        const filenames = (req.files as Express.Multer.File[]).map(
          f => `/uploads/${f.filename}`,
        );
        if (filenames.length > 0) attachments = filenames;
      } else if (Array.isArray(body.attachments)) {
        attachments = body.attachments.filter((a): a is string => typeof a === "string");
      }

      const input: CreateFeedbackInput = {
        username,
        userName,
        userRole: userRole as ReplierRole,
        targetType: body.targetType,
        targetId,
        targetName,
        type: body.type,
        title,
        description,
        category,
        priority,
        attachments,
        isAnonymous,
        rating,
      };

      const created = await feedbackService.create(input);
      return res.status(201).json({ data: created });
    } catch (e) {
      return next(e);
    }
  },

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const id = asString(req.params.id);
      const body = (req.body ?? {}) as Record<string, unknown>;

      if (body.type !== "feedback" && body.type !== "complaint") {
        throw new ValidationError("Missing or invalid field: type");
      }

      const title = asTrimmed(body.title, TITLE_MAX);
      const description = asTrimmed(body.description, DESCRIPTION_MAX);
      if (!title) throw new ValidationError("Missing or invalid field: title");
      if (!description) throw new ValidationError("Missing or invalid field: description");

      let category: FeedbackCategory | ComplaintCategory | undefined;
      if (body.type === "feedback") {
        if (body.category !== undefined && !isFeedbackCategory(body.category)) {
          throw new ValidationError("Invalid feedback category.");
        }
        category = body.category as FeedbackCategory | undefined;
      } else {
        if (body.category !== undefined && !isComplaintCategory(body.category)) {
          throw new ValidationError("Invalid complaint category.");
        }
        category = body.category as ComplaintCategory | undefined;
      }

      const attachments = Array.isArray(body.attachments)
        ? body.attachments.filter((a): a is string => typeof a === "string")
        : undefined;

      const input: UpdateFeedbackInput = {
        type: body.type,
        title,
        description,
        category,
        attachments,
      };

      const updated = await feedbackService.update(id, input);
      return res.json({ data: updated });
    } catch (e) {
      return next(e);
    }
  },

  async remove(req: Request, res: Response, next: NextFunction) {
    try {
      const id = asString(req.params.id);
      await feedbackService.remove(id);
      return res.status(204).send();
    } catch (e) {
      return next(e);
    }
  },

  async addReply(req: Request, res: Response, next: NextFunction) {
    try {
      const feedbackId = asString(req.params.id);
      const body = (req.body ?? {}) as Record<string, unknown>;

      const replierUsername = asTrimmed(body.replierUsername, ID_MAX);
      const replierName = asTrimmed(body.replierName, NAME_MAX);
      const content = asTrimmed(body.content, REPLY_MAX);

      if (!replierUsername) throw new ValidationError("Missing or invalid field: replierUsername");
      if (!replierName) throw new ValidationError("Missing or invalid field: replierName");
      if (!isReplierRole(body.replierRole)) {
        throw new ValidationError("Missing or invalid field: replierRole");
      }
      if (!content) throw new ValidationError("Missing or invalid field: content");

      const input: CreateReplyInput = {
        replierUsername,
        replierName,
        replierRole: body.replierRole,
        content,
      };

      const created = await feedbackService.addReply(feedbackId, input);

      // Create notification for the original poster
      const originalFeedback = await feedbackService.getAll({ username: undefined }); // Need to find the specific one
      const targetFeedback = await (require("../models/Feedback").FeedbackModel.findOne({ id: feedbackId }));
      if (targetFeedback) {
        const recipient = await (require("../models/User").UserModel.findOne({ username: targetFeedback.username }));
        if (recipient) {
          await (require("../models/Notification").NotificationModel.create({
            actorType: "USER",
            actorId: recipient._id,
            type: "FEEDBACK_REPLY",
            title: "New Reply to your Feedback",
            message: `${replierName} replied to your feedback: ${targetFeedback.title}`,
            meta: { feedbackId, replyId: created.id }
          }));
        }
      }

      return res.status(201).json({ data: created });
    } catch (e) {
      return next(e);
    }
  },

  async updateReply(req: Request, res: Response, next: NextFunction) {
    try {
      const feedbackId = asString(req.params.id);
      const replyId = asString(req.params.replyId);
      const body = (req.body ?? {}) as Record<string, unknown>;
      const content = asTrimmed(body.content, REPLY_MAX);
      if (!content) throw new ValidationError("Missing or invalid field: content");

      const updated = await feedbackService.updateReply(feedbackId, replyId, content);
      return res.json({ data: updated });
    } catch (e) {
      return next(e);
    }
  },

  async deleteReply(req: Request, res: Response, next: NextFunction) {
    try {
      const feedbackId = asString(req.params.id);
      const replyId = asString(req.params.replyId);
      await feedbackService.deleteReply(feedbackId, replyId);
      return res.status(204).send();
    } catch (e) {
      return next(e);
    }
  },

  async updateComplaint(req: Request, res: Response, next: NextFunction) {
    try {
      const id = asString(req.params.id);
      const body = (req.body ?? {}) as Record<string, unknown>;

      const input: UpdateComplaintInput = {};

      if (body.status !== undefined) {
        if (!isComplaintStatus(body.status)) {
          throw new ValidationError("Invalid status.");
        }
        input.status = body.status;
      }

      if (body.priority !== undefined) {
        if (!isComplaintPriority(body.priority)) {
          throw new ValidationError("Invalid priority.");
        }
        input.priority = body.priority;
      }

      if (typeof body.assignToUsername === "string" && body.assignToUsername.trim()) {
        input.assignToUsername = body.assignToUsername.trim().slice(0, ID_MAX);
      }

      if (typeof body.resolutionFeedback === "string") {
        input.resolutionFeedback = body.resolutionFeedback.trim().slice(0, DESCRIPTION_MAX);
      }

      if (body.rating !== undefined && input.status === "resolved") {
        const parsed = parseRating(body.rating);
        if (typeof parsed === "number" && parsed >= 1 && parsed <= 5) {
          input.rating = parsed;
        }
      }

      const updated = await feedbackService.updateComplaint(id, input);

      // Create notification for the user
      const targetFeedback = await (require("../models/Feedback").FeedbackModel.findOne({ id }));
      if (targetFeedback) {
        const recipient = await (require("../models/User").UserModel.findOne({ username: targetFeedback.username }));
        if (recipient) {
          let message = `Your complaint "${targetFeedback.title}" was updated.`;
          if (input.status) message = `Your complaint "${targetFeedback.title}" is now ${input.status}.`;
          
          await (require("../models/Notification").NotificationModel.create({
            actorType: "USER",
            actorId: recipient._id,
            type: "COMPLAINT_UPDATE",
            title: "Complaint Updated",
            message,
            meta: { feedbackId: id, status: input.status }
          }));
        }
      }

      return res.json({ data: updated });
    } catch (e) {
      return next(e);
    }
  },

  async analytics(_req: Request, res: Response, next: NextFunction) {
    try {
      const data = await feedbackService.analytics();
      return res.json(data);
    } catch (e) {
      return next(e);
    }
  },
};
