import { Schema, model, type InferSchemaType } from "mongoose";

const hospitalProfileSchema = new Schema(
  {
    hospitalId: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    address: { type: String },
    city: { type: String },
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
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

hospitalProfileSchema.index({ location: "2dsphere" });

export type HospitalProfileDocument = InferSchemaType<typeof hospitalProfileSchema>;
export const HospitalProfileModel = model("HospitalProfile", hospitalProfileSchema);
