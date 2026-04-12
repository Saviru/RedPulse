import { randomUUID } from "crypto";

import type {
  CreateFeedbackInput,
  CreateReplyInput,
  FeedbackItem,
  FeedbackReply,
  UpdateFeedbackInput,
  UpdateComplaintInput,
} from "../types/feedback";

// Simple in-memory store for Phase 2 (no DB).
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

function notFound(message: string) {
  const err = new Error(message) as Error & { status?: number };
  err.status = 404;
  return err;
}

function forbidden(message: string) {
  const err = new Error(message) as Error & { status?: number };
  err.status = 403;
  return err;
}

export const feedbackService = {
  getAll(filters?: { targetType?: string; targetId?: string; userRole?: string; userId?: string }): FeedbackItem[] {
    let list = [...feedbacks];
    if (filters?.targetType && filters?.targetId) {
      list = list.filter(
        f => f.targetType === filters.targetType && f.targetId === filters.targetId,
      );
    }
    if (filters?.userRole && filters?.userId) {
      if (filters.userRole === "user") {
        list = list.filter(f => f.userId === filters.userId);
      } else if (filters.userRole === "hospital" || filters.userRole === "organization") {
        list = list.filter(f => f.targetType === filters.userRole && (f.assignToId === filters.userId || !f.assignToId));
      }
    }
    // newest first
    return list.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  },

  create(input: CreateFeedbackInput): FeedbackItem {
    const defaults = input.type === "complaint" 
      ? { status: "pending" as const, priority: "medium" as const }
      : {};
    
    const item: FeedbackItem = {
      id: `f_${randomUUID()}`,
      createdAt: new Date().toISOString(),
      replies: [],
      ...input,
      ...defaults,
    };
    feedbacks = [item, ...feedbacks];
    return item;
  },

  update(id: string, input: UpdateFeedbackInput): FeedbackItem {
    const idx = feedbacks.findIndex(f => f.id === id);
    if (idx < 0) throw notFound("Feedback not found.");
    const updated = { ...feedbacks[idx], ...input };
    feedbacks = feedbacks.map(f => (f.id === id ? updated : f));
    return updated;
  },

  remove(id: string): void {
    const exists = feedbacks.some(f => f.id === id);
    if (!exists) throw notFound("Feedback not found.");
    feedbacks = feedbacks.filter(f => f.id !== id);
  },

  addReply(feedbackId: string, input: CreateReplyInput): FeedbackReply {
    const feedback = feedbacks.find(f => f.id === feedbackId);
    if (!feedback) throw notFound("Feedback not found.");
    if (input.replierRole !== "hospital" && input.replierRole !== "organization") {
      throw forbidden("Invalid replier role.");
    }
    if (feedback.targetType !== input.replierRole) {
      throw forbidden("Only the assigned entity can reply to this feedback.");
    }
    const reply: FeedbackReply = {
      id: `r_${randomUUID()}`,
      createdAt: new Date().toISOString(),
      ...input,
    };
    feedback.replies = [...feedback.replies, reply];
    return reply;
  },

  updateReply(feedbackId: string, replyId: string, content: string): FeedbackReply {
    const feedback = feedbacks.find(f => f.id === feedbackId);
    if (!feedback) throw notFound("Feedback not found.");
    const idx = feedback.replies.findIndex(r => r.id === replyId);
    if (idx < 0) throw notFound("Reply not found.");
    const existing = feedback.replies[idx];
    if (existing.replierRole !== feedback.targetType) {
      throw forbidden("This reply cannot be managed for this feedback.");
    }
    const updated = { ...existing, content };
    feedback.replies = feedback.replies.map(r => (r.id === replyId ? updated : r));
    return updated;
  },

  deleteReply(feedbackId: string, replyId: string): void {
    const feedback = feedbacks.find(f => f.id === feedbackId);
    if (!feedback) throw notFound("Feedback not found.");
    const reply = feedback.replies.find(r => r.id === replyId);
    if (!reply) throw notFound("Reply not found.");
    if (reply.replierRole !== feedback.targetType) {
      throw forbidden("This reply cannot be managed for this feedback.");
    }
    feedback.replies = feedback.replies.filter(r => r.id !== replyId);
  },

  updateComplaint(id: string, input: UpdateComplaintInput): FeedbackItem {
    const idx = feedbacks.findIndex(f => f.id === id);
    if (idx < 0) throw notFound("Feedback not found.");
    const updated = { ...feedbacks[idx], ...input };
    feedbacks = feedbacks.map(f => (f.id === id ? updated : f));
    // Simulate notification
    console.log(`Complaint ${id} status updated to ${updated.status}`);
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
    
    complaints.forEach(c => {
      if (c.category) {
        byCategory[c.category] = (byCategory[c.category] || 0) + 1;
      }
      if (c.status) {
        byStatus[c.status] = (byStatus[c.status] || 0) + 1;
      }
    });
    
    feedbackItems.forEach(f => {
      if (f.rating) {
        ratingDistribution[f.rating] = (ratingDistribution[f.rating] || 0) + 1;
      }
    });
    
    const totalRating = feedbackItems.reduce((sum, f) => sum + (f.rating || 0), 0);
    const averageRating = feedbackItems.length > 0 ? totalRating / feedbackItems.length : 0;
    
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

