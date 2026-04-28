import { InferSchemaType, model, Schema, Types } from "mongoose";

export const RegistrationRoles = ["DONOR", "VOLUNTEER"] as const;
export const RegistrationStatuses = ["REGISTERED", "SCREENING_REJECTED", "CANCELLED"] as const;
export const ScreeningDecisions = ["APPROVED", "REJECTED"] as const;
export const DonationStatuses = [
  "PENDING_PRECHECK",
  "REJECTED_PRECHECK",
  "PENDING_DOCTOR_VERIFICATION",
  "REJECTED_DOCTOR_VERIFICATION",
  "PENDING_FINAL_VERIFICATION",
  "REJECTED_FINAL_VERIFICATION",
  "READY_FOR_DONATION",
  "DONATION_COMPLETED",
] as const;

const CampaignRegistrationSchema = new Schema(
  {
    campaignId: { type: Types.ObjectId, required: true, index: true, ref: "Campaign" },
    userId: { type: Types.ObjectId, required: true, index: true },
    role: { type: String, enum: RegistrationRoles, required: true },
    status: { type: String, enum: RegistrationStatuses, default: "REGISTERED", index: true },
    notes: { type: String, default: "" },
    // Legacy flat fields kept for backward compatibility.
    volunteerProfile: { type: Schema.Types.Mixed, default: null },
    donorProfile: { type: Schema.Types.Mixed, default: null },
    screeningSnapshot: { type: Schema.Types.Mixed, default: null },
    screeningDecision: { type: String, enum: ScreeningDecisions, default: null, index: true },
    rejectionReasons: { type: [String], default: [] },
    screenedAt: { type: Date, default: null },
    donationStatus: {
      type: String,
      enum: DonationStatuses,
      default: "PENDING_PRECHECK",
      index: true,
    },
    precheck: {
      bodyWeightKg: { type: Number, default: null },
      checkedAt: { type: Date, default: null },
      result: { type: String, enum: ["VERIFIED", "REJECTED"], default: null },
      reason: { type: String, default: "" },
    },
    doctorVerification: {
      decision: { type: String, enum: ["ACCEPT", "REJECT"], default: null },
      notes: { type: String, default: "" },
      verifiedAt: { type: Date, default: null },
    },
    finalVerification: {
      haemoglobinStatus: { type: String, enum: ["FLOATED", "NOT_FLOATED"], default: null },
      verifiedAt: { type: Date, default: null },
    },
    donationCompletedAt: { type: Date, default: null },
    // Refined role-specific structures.
    volunteerRegistration: {
      profile: { type: Schema.Types.Mixed, default: null },
      volunteerPublicId: { type: String, default: null, trim: true, sparse: true, index: true },
      assignedTask: {
        title: { type: String, default: "" },
        description: { type: String, default: "" },
        points: { type: Number, default: 0 },
        assignedAt: { type: Date, default: null },
      },
      taskAttendance: {
        status: { type: String, enum: ["ATTENDED", "ABSENT"], default: null },
        markedAt: { type: Date, default: null },
      },
      reviewedStatus: {
        type: String,
        enum: ["PENDING", "ACCEPTED", "REJECTED"],
        default: "PENDING",
      },
      reviewedAt: { type: Date, default: null },
      rejectionReason: { type: String, default: "" },
    },
    donorRegistration: {
      profile: { type: Schema.Types.Mixed, default: null },
      donorPublicId: { type: String, default: null, trim: true, sparse: true, index: true },
      screeningSnapshot: { type: Schema.Types.Mixed, default: null },
      screeningDecision: { type: String, enum: ScreeningDecisions, default: null },
      rejectionReasons: { type: [String], default: [] },
      screenedAt: { type: Date, default: null },
      donationWorkflow: {
        status: {
          type: String,
          enum: DonationStatuses,
          default: "PENDING_PRECHECK",
        },
        precheck: {
          bodyWeightKg: { type: Number, default: null },
          checkedAt: { type: Date, default: null },
          result: { type: String, enum: ["VERIFIED", "REJECTED"], default: null },
          reason: { type: String, default: "" },
        },
        doctorVerification: {
          decision: { type: String, enum: ["ACCEPT", "REJECT"], default: null },
          notes: { type: String, default: "" },
          verifiedAt: { type: Date, default: null },
        },
        finalVerification: {
          haemoglobinStatus: { type: String, enum: ["FLOATED", "NOT_FLOATED"], default: null },
          verifiedAt: { type: Date, default: null },
        },
        donationCompletedAt: { type: Date, default: null },
      },
    },
  },
  { timestamps: true },
);

CampaignRegistrationSchema.index({ campaignId: 1, userId: 1, role: 1 }, { unique: true });

export type CampaignRegistrationDocument =
  InferSchemaType<typeof CampaignRegistrationSchema> & { _id: Types.ObjectId };

export const CampaignRegistrationModel = model("CampaignRegistration", CampaignRegistrationSchema);
