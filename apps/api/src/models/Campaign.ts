import { InferSchemaType, model, Schema, Types } from "mongoose";

export const CampaignStatuses = [
  "PENDING_HOSPITAL",
  "PUBLISHED",
  "HOSPITAL_REJECTED",
  "CANCELLED",
] as const;

const CampaignSchema = new Schema(
  {
    organizationId: { type: Types.ObjectId, required: true, index: true },
    name: { type: String, required: true, trim: true },
    date: { type: Date, required: true },
    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },
    location: { type: String, required: true, trim: true },
    coordinatorName: { type: String, required: true, trim: true },
    coordinatorPhone: { type: String, required: true, trim: true },
    maxCapacity: { type: Number, required: true, min: 1 },
    description: { type: String, default: "", trim: true },
    status: {
      type: String,
      enum: CampaignStatuses,
      default: "PENDING_HOSPITAL",
      index: true,
    },
    currentHospitalId: { type: Types.ObjectId, default: null, index: true },
    currentCollaborationAttemptId: { type: Types.ObjectId, default: null },
    donorSeqCounter: { type: Number, default: 0 },
    volunteerSeqCounter: { type: Number, default: 0 },
  },
  { timestamps: true },
);

export type CampaignDocument = InferSchemaType<typeof CampaignSchema> & { _id: Types.ObjectId };

export const CampaignModel = model("Campaign", CampaignSchema);
