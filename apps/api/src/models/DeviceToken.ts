import { Schema, model, type InferSchemaType } from "mongoose";

const deviceTokenSchema = new Schema(
  {
    donorId: { type: String, required: true, index: true },
    fcmToken: { type: String, required: true, unique: true },
    platform: { type: String, enum: ["android", "ios"], required: true },
    isActive: { type: Boolean, default: true },
    lastSeenAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export type DeviceTokenDocument = InferSchemaType<typeof deviceTokenSchema>;
export const DeviceTokenModel = model("DeviceToken", deviceTokenSchema);
