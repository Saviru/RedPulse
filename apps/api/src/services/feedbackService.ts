import { randomUUID } from "crypto";

import type {
  CreateFeedbackInput,
  CreateReplyInput,
  FeedbackItem,
  FeedbackReply,
  UpdateFeedbackInput,
  UpdateComplaintInput,
} from "../types/feedback";

// ---------------------------------------------------------------------------
// In-memory store (Phase 2)
// ---------------------------------------------------------------------------
// This is intentionally simple — no database yet. Process restart wipes the
// list. When we move to a real DB the public API of this module shouldn't
// have to change.

let feedbacks: FeedbackItem[] = [
  {
    id: "f1",
    userId: "u123",
    userName: "Savidu Jayaweeera",
    userRole: "user",
    targetType: "hospital",
    targetId: "h1",
    targetName: "Colombo General Hospital",
    type: "feedback",
    title: "Great experience at the last camp",
    description:
      "The staff were friendly and the registration process was smooth. Parking guidance could be improved.",
    category: "suggestion",
    status: "resolved",
    priority: "medium",
    rating: 4,
    isAnonymous: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    replies: [
      {
        id: "r1",
        replierId: "h1",
        replierName: "Colombo General Hospital",
        replierRole: "hospital",
        content: "Thank you! We appreciate the suggestion about parking guidance.",
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 20).toISOString(),
      },
    ],
  },
  {
    id: "f2",
    userId: "u456",
    userName: "Jane Doe",
    userRole: "user",
    targetType: "organization",
    targetId: "o1",
    targetName: "Lions Club Blood Drive",
    type: "complaint",
    title: "Waiting time was too long",
    description:
      "I had to wait for more than 2 hours before my turn. It would be helpful to have better time slots.",
    category: undefined,
    status: "pending",
    priority: "medium",
    isAnonymous: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
    replies: [],
  },
];

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
// Internal helpers
// ---------------------------------------------------------------------------
function findFeedback(id: string): FeedbackItem {
  const item = feedbacks.find(f => f.id === id);
  if (!item) throw notFound("Feedback not found.");
  return item;
}

function findReply(feedback: FeedbackItem, replyId: string): FeedbackReply {
  const reply = feedback.replies.find(r => r.id === replyId);
  if (!reply) throw notFound("Reply not found.");
  return reply;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------
export interface FeedbackFilters {
  targetType?: string;
  targetId?: string;
  userRole?: string;
  userId?: string;
}

export const feedbackService = {
  getAll(filters?: FeedbackFilters): FeedbackItem[] {
    let list = [...feedbacks];

    if (filters?.targetType && filters?.targetId) {
      list = list.filter(
        f => f.targetType === filters.targetType && f.targetId === filters.targetId,
      );
    }

    if (filters?.userRole && filters?.userId) {
      if (filters.userRole === "user") {
        list = list.filter(f => f.userId === filters.userId);
      } else if (
        filters.userRole === "hospital" ||
        filters.userRole === "organization"
      ) {
        list = list.filter(
          f =>
            f.targetType === filters.userRole &&
            (f.assignToId === filters.userId || !f.assignToId),
        );
      }
    }

    // Newest first.
    return list.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  },

  create(input: CreateFeedbackInput): FeedbackItem {
    // IMPORTANT: server-assigned fields (id, createdAt, replies) are listed
    // AFTER ...input so a malicious client can't override them by sending
    // those keys in the body.
    const item: FeedbackItem = {
      ...input,
      id: `f_${randomUUID()}`,
      createdAt: new Date().toISOString(),
      replies: [],
      // Complaints always start in "pending" — even if the client tried to
      // bypass that by sending status=resolved.
      ...(input.type === "complaint"
        ? { status: "pending" as const, priority: input.priority ?? "medium" }
        : {}),
    };

    feedbacks = [item, ...feedbacks];
    return item;
  },

  update(id: string, input: UpdateFeedbackInput): FeedbackItem {
    const idx = feedbacks.findIndex(f => f.id === id);
    if (idx < 0) throw notFound("Feedback not found.");

    // Only merge the whitelisted fields from UpdateFeedbackInput. Everything
    // else (id, userId, createdAt, replies, ...) is preserved.
    const existing = feedbacks[idx];
    const updated: FeedbackItem = {
      ...existing,
      type: input.type,
      title: input.title,
      description: input.description,
      category: input.category ?? existing.category,
      attachments: input.attachments ?? existing.attachments,
    };

    feedbacks = feedbacks.map(f => (f.id === id ? updated : f));
    return updated;
  },

  remove(id: string): void {
    const exists = feedbacks.some(f => f.id === id);
    if (!exists) throw notFound("Feedback not found.");
    feedbacks = feedbacks.filter(f => f.id !== id);
  },

  addReply(feedbackId: string, input: CreateReplyInput): FeedbackReply {
    const feedback = findFeedback(feedbackId);

    if (input.replierRole !== "hospital" && input.replierRole !== "organization") {
      throw forbidden("Invalid replier role.");
    }
    if (feedback.targetType !== input.replierRole) {
      throw forbidden("Only the assigned entity can reply to this feedback.");
    }

    const reply: FeedbackReply = {
      ...input,
      id: `r_${randomUUID()}`,
      createdAt: new Date().toISOString(),
    };

    feedback.replies = [...feedback.replies, reply];
    return reply;
  },

  updateReply(feedbackId: string, replyId: string, content: string): FeedbackReply {
    const feedback = findFeedback(feedbackId);
    const existing = findReply(feedback, replyId);

    if (existing.replierRole !== feedback.targetType) {
      throw forbidden("This reply cannot be managed for this feedback.");
    }

    const updated: FeedbackReply = { ...existing, content };
    feedback.replies = feedback.replies.map(r => (r.id === replyId ? updated : r));
    return updated;
  },

  deleteReply(feedbackId: string, replyId: string): void {
    const feedback = findFeedback(feedbackId);
    const reply = findReply(feedback, replyId);

    if (reply.replierRole !== feedback.targetType) {
      throw forbidden("This reply cannot be managed for this feedback.");
    }

    feedback.replies = feedback.replies.filter(r => r.id !== replyId);
  },

  updateComplaint(id: string, input: UpdateComplaintInput): FeedbackItem {
    const idx = feedbacks.findIndex(f => f.id === id);
    if (idx < 0) throw notFound("Feedback not found.");

    const existing = feedbacks[idx];
    // Only merge whitelisted fields. Everything else (id, userId, type, ...)
    // is preserved so a client cannot rewrite the record.
    const updated: FeedbackItem = {
      ...existing,
      status: input.status ?? existing.status,
      priority: input.priority ?? existing.priority,
      assignToId: input.assignToId ?? existing.assignToId,
      rating: input.rating ?? existing.rating,
      resolutionFeedback: input.resolutionFeedback ?? existing.resolutionFeedback,
    };

    feedbacks = feedbacks.map(f => (f.id === id ? updated : f));

    // TODO: replace this with a real notification path (email, push, etc.)
    // and a structured logger that redacts PII. Avoid logging full records.
    return updated;
  },

  analytics(): {
    totalComplaints: number;
    complaintsByCategory: Record<string, number>;
    complaintsByStatus: Record<string, number>;
    totalFeedbacks: number;
    averageFeedbackRating: number;
    feedbackRatingDistribution: Record<number, number>;
  } {
    const complaints = feedbacks.filter(f => f.type === "complaint");
    const feedbackItems = feedbacks.filter(f => f.type === "feedback");

    const byCategory: Record<string, number> = {};
    const byStatus: Record<string, number> = {};
    const ratingDistribution: Record<number, number> = {};

    for (const c of complaints) {
      if (c.category) byCategory[c.category] = (byCategory[c.category] || 0) + 1;
      if (c.status) byStatus[c.status] = (byStatus[c.status] || 0) + 1;
    }

    for (const f of feedbackItems) {
      if (f.rating) ratingDistribution[f.rating] = (ratingDistribution[f.rating] || 0) + 1;
    }

    const totalRating = feedbackItems.reduce((sum, f) => sum + (f.rating || 0), 0);
    const averageRating =
      feedbackItems.length > 0 ? totalRating / feedbackItems.length : 0;

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
