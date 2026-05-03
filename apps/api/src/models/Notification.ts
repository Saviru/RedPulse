import { InferSchemaType, model, Schema, Types } from "mongoose";

const NotificationSchema = new Schema(
  {
    actorType: { type: String, enum: ["ORGANIZATION", "HOSPITAL", "USER"], required: true },
    actorId: { type: Types.ObjectId, required: true, index: true },
    type: { type: String, required: true, trim: true },
    title: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
    meta: { type: Schema.Types.Mixed, default: {} },
    isRead: { type: Boolean, default: false, index: true },
  },
  { timestamps: true },
);

export type NotificationDocument = InferSchemaType<typeof NotificationSchema> & { _id: Types.ObjectId };

export const NotificationModel = model("Notification", NotificationSchema);
