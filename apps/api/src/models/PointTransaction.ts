import mongoose, { Document, Schema } from 'mongoose';

export interface IPointTransactionDocument extends Document {
  userId: mongoose.Types.ObjectId;
  amount: number;
  type: 'REDEMPTION' | 'DONATION' | 'SYSTEM';
  targetId: mongoose.Types.ObjectId; // id of offer or fundraiser
  timestamp: Date;
}

const transactionSchema = new Schema<IPointTransactionDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    amount: { type: Number, required: true },
    type: { type: String, enum: ['REDEMPTION', 'DONATION', 'SYSTEM'], required: true },
    targetId: { type: Schema.Types.ObjectId, required: true },
    timestamp: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

export const PointTransactionModel = mongoose.model<IPointTransactionDocument>('PointTransaction', transactionSchema);
