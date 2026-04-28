import { InferSchemaType, model, Schema, Types } from "mongoose";

/**
 * Volunteer task assignments live in their own collection (not embedded on CampaignRegistration).
 */
const VolunteerTaskAssignmentSchema = new Schema(
  {
    registrationId: {
      type: Types.ObjectId,
      required: true,
      unique: true,
      index: true,
      ref: "CampaignRegistration",
    },
    campaignId: { type: Types.ObjectId, required: true, index: true, ref: "Campaign" },
    userId: { type: Types.ObjectId, required: true, index: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "", trim: true },
    points: { type: Number, default: 0 },
    assignedAt: { type: Date, default: () => new Date() },
    attendanceStatus: { type: String, default: null },
    attendanceMarkedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

export type VolunteerTaskAssignmentDocument =
  InferSchemaType<typeof VolunteerTaskAssignmentSchema> & { _id: Types.ObjectId };

export const VolunteerTaskAssignmentModel = model(
  "VolunteerTaskAssignment",
  VolunteerTaskAssignmentSchema,
);
