import mongoose, { Document, Schema } from 'mongoose';

export interface IFundraisingDocument extends Document {
  title: string;
  description: string;
  goalLKR: number;
  currentPoints: number;
  organizationId: string;
  isActive: boolean;
}

const fundraisingSchema = new Schema<IFundraisingDocument>(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    goalLKR: { type: Number, required: true },
    currentPoints: { type: Number, default: 0 },
    organizationId: { type: String, required: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const FundraisingModel = mongoose.model<IFundraisingDocument>('Fundraising', fundraisingSchema);
