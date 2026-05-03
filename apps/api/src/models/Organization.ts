import { model, Schema, Types } from "mongoose";

const OrganizationSchema = new Schema(
  {
    ownerUserId: { type: Types.ObjectId, required: true },
    name: { type: String, required: true, trim: true },
    type: { type: String, enum: ["ORGANIZATION", "HOSPITAL"], required: true },
  },
  { timestamps: true },
);

export const OrganizationModel = model("Organization", OrganizationSchema);
