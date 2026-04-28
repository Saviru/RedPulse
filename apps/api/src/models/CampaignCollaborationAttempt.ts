import { InferSchemaType, model, Schema, Types } from "mongoose";

export const CollaborationStatuses = ["PENDING", "ACCEPTED", "REJECTED"] as const;

const CampaignCollaborationAttemptSchema = new Schema(
  {
    campaignId: { type: Types.ObjectId, required: true, index: true, ref: "Campaign" },
    organizationId: { type: Types.ObjectId, required: true, index: true },
    hospitalId: { type: Types.ObjectId, required: true, index: true },
    attemptNo: { type: Number, required: true, min: 1 },
    status: { type: String, enum: CollaborationStatuses, default: "PENDING", index: true },
    decisionBy: { type: Types.ObjectId, default: null },
    decisionAt: { type: Date, default: null },
    rejectionReason: { type: String, default: "", trim: true },
  },
  { timestamps: true },
);

CampaignCollaborationAttemptSchema.index({ campaignId: 1, attemptNo: 1 }, { unique: true });

export type CampaignCollaborationAttemptDocument =
  InferSchemaType<typeof CampaignCollaborationAttemptSchema> & { _id: Types.ObjectId };

export const CampaignCollaborationAttemptModel = model(
  "CampaignCollaborationAttempt",
  CampaignCollaborationAttemptSchema,
);
