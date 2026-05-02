import mongoose, { Document, Schema } from 'mongoose';

export interface IPointTransaction extends Document {
  username: string;
  amount: number;
  type: 'EARNED' | 'REDEMPTION' | 'DONATION' | 'REFUND';
  targetId?: string;
  timestamp: Date;
}

const pointTransactionSchema = new Schema<IPointTransaction>(
  {
    username: { type: String, required: true, index: true },
    amount: { type: Number, required: true },
    type: { 
      type: String, 
      enum: ['EARNED', 'REDEMPTION', 'DONATION', 'REFUND'], 
      required: true 
    },
    targetId: { type: String, required: false },
    timestamp: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

export const PointTransactionModel = mongoose.model<IPointTransaction>('PointTransaction', pointTransactionSchema);
