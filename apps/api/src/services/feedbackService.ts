import { randomUUID } from "crypto";

import { FeedbackModel } from "../models/Feedback";
import type {
  CreateFeedbackInput,
  CreateReplyInput,
  FeedbackItem,
  FeedbackReply,
  UpdateFeedbackInput,
  UpdateComplaintInput,
} from "../types/feedback";

// ---------------------------------------------------------------------------
// Error helpers
// ---------------------------------------------------------------------------
class HttpError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

const notFound = (msg: string) => new HttpError(404, msg);
const forbidden = (msg: string) => new HttpError(403, msg);

// ---------------------------------------------------------------------------
// Filter shape
// ---------------------------------------------------------------------------
export interface FeedbackFilters {
  targetType?: string;
  targetId?: string;
  userRole?: string;
  username?: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
/**
 * Strip Mongo's internal _id and __v from a returned document so the API
 * shape matches FeedbackItem exactly. Accepts `unknown` so callers don't
 * have to cast — Mongoose lean docs and toObject() docs both flow through
 * cleanly.
 */
function stripMongoMeta(doc: unknown): FeedbackItem {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { _id, __v, ...rest } = doc as {
    _id?: unknown;
    __v?: unknown;
  } & FeedbackItem;
  return rest as FeedbackItem;
}

// ---------------------------------------------------------------------------
// Public API — every method is async (Mongo I/O)
// ---------------------------------------------------------------------------
export const feedbackService = {
  async getAll(filters?: FeedbackFilters): Promise<FeedbackItem[]> {
    const query: Record<string, unknown> = {};

    if (filters?.targetType && filters?.targetId) {
      query.targetType = filters.targetType;
      query.targetId = filters.targetId;
    }

    if (filters?.userRole && filters?.username) {
      if (filters.userRole === "user") {
        query.username = filters.username;
      } else if (
        filters.userRole === "hospital" ||
        filters.userRole === "organization"
      ) {
        query.targetType = filters.userRole;
        // Hospital/org sees feedback assigned to them OR unassigned at their target.
        query.$or = [
          { assignToUsername: filters.username },
          { assignToUsername: { $exists: false } },
          { assignToUsername: null },
        ];
      }
    }

    const docs = await FeedbackModel.find(query).sort({ createdAt: -1 }).lean();
    return docs.map(d => stripMongoMeta(d));
  },

  async create(input: CreateFeedbackInput): Promise<FeedbackItem> {
    // Server-assigned fields go AFTER ...input so a malicious client can't
    // override id, createdAt, or replies by sending those keys in the body.
    const data = {
      ...input,
      id: `f_${randomUUID()}`,
      createdAt: new Date().toISOString(),
      replies: [],
      // Complaints always start in "pending"; default priority to "medium"
      // if the client didn't pick one.
      ...(input.type === "complaint"
        ? {
            status: "pending" as const,
            priority: input.priority ?? ("medium" as const),
          }
        : {}),
    };

    const doc = await FeedbackModel.create(data);
    return stripMongoMeta(doc.toObject());
  },

  async update(id: string, input: UpdateFeedbackInput): Promise<FeedbackItem> {
    // Only $set the whitelisted fields. Everything else (id, username, type,
    // createdAt, replies, ...) is preserved.
    const updates: Record<string, unknown> = {
      type: input.type,
      title: input.title,
      description: input.description,
    };
    if (input.category !== undefined) updates.category = input.category;
    if (input.attachments !== undefined) updates.attachments = input.attachments;

    const updated = await FeedbackModel.findOneAndUpdate(
      { id },
      { $set: updates },
      { new: true },
    ).lean();

    if (!updated) throw notFound("Feedback not found.");
    return stripMongoMeta(updated);
  },

  async remove(id: string): Promise<void> {
    const res = await FeedbackModel.deleteOne({ id });
    if (res.deletedCount === 0) throw notFound("Feedback not found.");
  },

  async addReply(
    feedbackId: string,
    input: CreateReplyInput,
  ): Promise<FeedbackReply> {
    if (
      input.replierRole !== "hospital" &&
      input.replierRole !== "organization"
    ) {
      throw forbidden("Invalid replier role.");
    }

    const feedback = await FeedbackModel.findOne({ id: feedbackId });
    if (!feedback) throw notFound("Feedback not found.");
    if (feedback.targetType !== input.replierRole) {
      throw forbidden("Only the assigned entity can reply to this feedback.");
    }

    const reply: FeedbackReply = {
      ...input,
      id: `r_${randomUUID()}`,
      createdAt: new Date().toISOString(),
    };

    feedback.replies.push(reply);
    await feedback.save();
    return reply;
  },

  async updateReply(
    feedbackId: string,
    replyId: string,
    content: string,
  ): Promise<FeedbackReply> {
    const feedback = await FeedbackModel.findOne({ id: feedbackId });
    if (!feedback) throw notFound("Feedback not found.");

    const reply = feedback.replies.find(r => r.id === replyId);
    if (!reply) throw notFound("Reply not found.");
    if (reply.replierRole !== feedback.targetType) {
      throw forbidden("This reply cannot be managed for this feedback.");
    }

    reply.content = content;
    await feedback.save();
    return reply;
  },

  async deleteReply(feedbackId: string, replyId: string): Promise<void> {
    const feedback = await FeedbackModel.findOne({ id: feedbackId });
    if (!feedback) throw notFound("Feedback not found.");

    const reply = feedback.replies.find(r => r.id === replyId);
    if (!reply) throw notFound("Reply not found.");
    if (reply.replierRole !== feedback.targetType) {
      throw forbidden("This reply cannot be managed for this feedback.");
    }

    feedback.replies = feedback.replies.filter(r => r.id !== replyId);
    await feedback.save();
  },

  async updateComplaint(
    id: string,
    input: UpdateComplaintInput,
  ): Promise<FeedbackItem> {
    const updates: Record<string, unknown> = {};
    if (input.status !== undefined) updates.status = input.status;
    if (input.priority !== undefined) updates.priority = input.priority;
    if (input.assignToUsername !== undefined) updates.assignToUsername = input.assignToUsername;
    if (input.rating !== undefined) updates.rating = input.rating;
    if (input.resolutionFeedback !== undefined) {
      updates.resolutionFeedback = input.resolutionFeedback;
    }

    const updated = await FeedbackModel.findOneAndUpdate(
      { id },
      { $set: updates },
      { new: true },
    ).lean();

    if (!updated) throw notFound("Feedback not found.");
    return stripMongoMeta(updated);
  },

  async analytics(): Promise<{
    totalComplaints: number;
    complaintsByCategory: Record<string, number>;
    complaintsByStatus: Record<string, number>;
    totalFeedbacks: number;
    averageFeedbackRating: number;
    feedbackRatingDistribution: Record<number, number>;
  }> {
    const [complaints, feedbackItems] = await Promise.all([
      FeedbackModel.find({ type: "complaint" })
        .select("category status")
        .lean(),
      FeedbackModel.find({ type: "feedback" }).select("rating").lean(),
    ]);

    const byCategory: Record<string, number> = {};
    const byStatus: Record<string, number> = {};
    for (const c of complaints) {
      if (c.category) byCategory[c.category] = (byCategory[c.category] || 0) + 1;
      if (c.status) byStatus[c.status] = (byStatus[c.status] || 0) + 1;
    }

    const ratingDistribution: Record<number, number> = {};
    let totalRating = 0;
    let countWithRating = 0;
    for (const f of feedbackItems) {
      if (typeof f.rating === "number") {
        ratingDistribution[f.rating] = (ratingDistribution[f.rating] || 0) + 1;
        totalRating += f.rating;
        countWithRating += 1;
      }
    }

    const averageRating =
      countWithRating > 0 ? totalRating / countWithRating : 0;

    return {
      totalComplaints: complaints.length,
      complaintsByCategory: byCategory,
      complaintsByStatus: byStatus,
      totalFeedbacks: feedbackItems.length,
      averageFeedbackRating: Math.round(averageRating * 10) / 10,
      feedbackRatingDistribution: ratingDistribution,
    };
  },
};
