import { Schema, model, type InferSchemaType } from "mongoose";

const donorProfileSchema = new Schema(
  {
    donorId: { type: String, required: true, unique: true },
    bloodGroup: { type: String, required: true },
    locationText: { type: String, required: true },
    location: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: {
        type: [Number],
        default: [0, 0],
      },
    },
    isEligibleNow: { type: Boolean, default: true },
    lastDonationDate: { type: Date },
    responseRate: { type: Number, default: 0.5, min: 0, max: 1 },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

donorProfileSchema.index({ location: "2dsphere" });

export type DonorProfileDocument = InferSchemaType<typeof donorProfileSchema>;
export const DonorProfileModel = model("DonorProfile", donorProfileSchema);
