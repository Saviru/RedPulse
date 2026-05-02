import { Schema, model, type InferSchemaType } from "mongoose";

const alertNotificationSchema = new Schema(
  {
    emergencyRequestId: { type: Schema.Types.ObjectId, required: true, ref: "EmergencyRequest" },
    donorId: { type: String, required: true },
    priorityScore: { type: Number, required: true },
    status: {
      type: String,
      enum: ["queued", "sent", "failed", "opened", "accepted", "declined", "expired"],
      default: "queued",
    },
    sentAt: { type: Date },
    respondedAt: { type: Date },
    fcmMessageId: { type: String },
    failureReason: { type: String },
  },
  { timestamps: true }
);

export type AlertNotificationDocument = InferSchemaType<typeof alertNotificationSchema>;
export const AlertNotificationModel = model("AlertNotification", alertNotificationSchema);
