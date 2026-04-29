import { Schema, model, type HydratedDocument } from "mongoose";

import type { FeedbackItem, FeedbackReply } from "../types/feedback";

// ---------------------------------------------------------------------------
// Sub-schema: replies
// ---------------------------------------------------------------------------
// Replies are embedded as a subdocument array. They're always scoped to a
// single feedback item so this is more efficient than a separate collection.
const ReplySchema = new Schema<FeedbackReply>(
  {
    id: { type: String, required: true },
    replierId: { type: String, required: true },
    replierName: { type: String, required: true },
    replierRole: {
      type: String,
      enum: ["user", "hospital", "organization"],
      required: true,
    },
    content: { type: String, required: true, maxlength: 2000 },
    createdAt: { type: String, required: true },
  },
  { _id: false },
);

// ---------------------------------------------------------------------------
// Main schema: feedback
// ---------------------------------------------------------------------------
const FeedbackSchema = new Schema<FeedbackItem>(
  {
    id: { type: String, required: true, unique: true, index: true },
    userId: { type: String, required: true, index: true },
    userName: { type: String, required: true },
    userRole: {
      type: String,
      enum: ["user", "hospital", "organization"],
      required: true,
    },
    targetType: {
      type: String,
      enum: ["hospital", "organization"],
      required: true,
      index: true,
    },
    targetId: { type: String, required: true, index: true },
    targetName: { type: String, required: true },
    type: {
      type: String,
      enum: ["feedback", "complaint"],
      required: true,
      index: true,
    },
    title: { type: String, required: true, maxlength: 200 },
    description: { type: String, required: true, maxlength: 5000 },
    category: { type: String },
    attachments: { type: [String], default: undefined },
    status: {
      type: String,
      enum: ["pending", "in_progress", "resolved", "rejected"],
    },
    priority: { type: String, enum: ["low", "medium", "high", "critical"] },
    assignToId: { type: String },
    rating: { type: Number, min: 1, max: 5 },
    resolutionFeedback: { type: String, maxlength: 5000 },
    isAnonymous: { type: Boolean, required: true, default: false },
    createdAt: { type: String, required: true, index: true },
    replies: { type: [ReplySchema], default: [] },
  },
  {
    collection: "feedback",
    versionKey: false,
    // Strip Mongo's internal _id from JSON responses so the API contract
    // stays identical to the previous in-memory shape.
    toJSON: {
      virtuals: false,
      transform: (_doc, ret) => {
        delete (ret as { _id?: unknown })._id;
        return ret;
      },
    },
  },
);

export const FeedbackModel = model<FeedbackItem>("Feedback", FeedbackSchema);

export type FeedbackDoc = HydratedDocument<FeedbackItem>;
