import mongoose, { Document, Model, Schema } from "mongoose";

export interface IUnitIdCounter {
  key: string;
  seq: number;
}

export interface IUnitIdCounterDocument extends IUnitIdCounter, Document {}

const unitIdCounterSchema = new Schema<IUnitIdCounterDocument>(
  {
    key: { type: String, required: true, unique: true, trim: true },
    seq: { type: Number, required: true, default: 0, min: 0 },
  },
  { timestamps: false }
);

export const UnitIdCounter: Model<IUnitIdCounterDocument> =
  mongoose.models.UnitIdCounter ||
  mongoose.model<IUnitIdCounterDocument>("UnitIdCounter", unitIdCounterSchema);
