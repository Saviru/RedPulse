import mongoose, { Schema, Document, Model } from "mongoose";
import { BLOOD_MSG } from "../utils/bloodMessages";

export interface IBlood {
  unitId: string;
  username: string;
  bloodType: string;
  component: string;
  volume: number;
  /**
   * Stored as full local datetime at creation time.
   * - collectionDateTime = entered collection date + current system time
   * - expiryDateTime = entered expiry date + same time as collectionDateTime
   */
  collectionDateTime?: Date;
  expiryDateTime?: Date;

  /**
   * Backward-compatible legacy fields (date-only). New logic uses *_DateTime.
   * Can be removed after data migration.
   */
  collectionDate?: Date;
  expiryDate?: Date;
  expiringSoonAlertSent: boolean;
  packetImage?: string;
  createdAt: Date;
}

export interface IBloodDocument extends IBlood, Document {}

const bloodSchema = new Schema<IBloodDocument>(
  {
    unitId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    username: {
      type: String,
      required: false,
      trim: true,
    },
    bloodType: {
      type: String,
      required: true,
      trim: true,
    },
    component: {
      type: String,
      required: true,
      trim: true,
    },
    volume: {
      type: Number,
      required: true,
      min: 450,
      max: 500,
    },
    collectionDateTime: {
      type: Date,
      required: false,
    },
    expiryDateTime: {
      type: Date,
      required: false,
    },

    // Legacy fields (date-only).
    collectionDate: {
      type: Date,
      required: false,
    },
    expiryDate: {
      type: Date,
      required: false,
    },
    expiringSoonAlertSent: {
      type: Boolean,
      required: true,
      default: false,
    },
    packetImage: {
      type: String,
      required: false,
    },
  },
  {
    timestamps: { createdAt: "createdAt", updatedAt: false },
  }
);

bloodSchema.pre("validate", function (next) {
  const collDT = this.collectionDateTime ?? this.collectionDate;
  const expDT = this.expiryDateTime ?? this.expiryDate;
  if (collDT && expDT && expDT <= collDT) {
    next(new Error(BLOOD_MSG.expiryAfterCollection));
    return;
  }
  next();
});

export const Blood: Model<IBloodDocument> =
  mongoose.models.Blood || mongoose.model<IBloodDocument>("Blood", bloodSchema);
