import mongoose, { Document, Schema } from 'mongoose';

export interface IOfferDocument extends Document {
  title: string;
  description: string;
  pointsCost: number;
  type: 'Checkup' | 'Discount' | 'Gift' | 'Other';
  hospitalId: string;
  isActive: boolean;
}

const offerSchema = new Schema<IOfferDocument>(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    pointsCost: { type: Number, required: true },
    type: { type: String, enum: ['Checkup', 'Discount', 'Gift', 'Other'], default: 'Checkup' },
    hospitalId: { type: String, required: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const OfferModel = mongoose.model<IOfferDocument>('Offer', offerSchema);
