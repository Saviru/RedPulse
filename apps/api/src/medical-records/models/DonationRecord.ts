import mongoose, { Schema, Document } from 'mongoose';

export interface IDonationRecord extends Document {
  userId: mongoose.Types.ObjectId;
  donationDate: Date;
  location: string;
  status: 'Completed' | 'Pending' | 'Deferred';
  nextEligibleDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const DonationRecordSchema: Schema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  donationDate: { type: Date, required: true },
  location: { type: String, required: true },
  status: { type: String, enum: ['Completed', 'Pending', 'Deferred'], default: 'Completed' },
  nextEligibleDate: { type: Date }
}, { timestamps: true });

export const DonationRecord = mongoose.model<IDonationRecord>('DonationRecord', DonationRecordSchema);
