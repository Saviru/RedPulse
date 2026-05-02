import mongoose, { Document, Schema } from 'mongoose';

export interface IOtpDocument extends Document {
  email: string;
  otp: string;
  purpose: 'REGISTER' | 'DELETE';
  userData?: any;
  createdAt: Date;
  expiresAt: Date;
}

const otpSchema = new Schema<IOtpDocument>(
  {
    email: { type: String, required: true, lowercase: true, trim: true },
    otp: { type: String, required: true },
    purpose: { type: String, enum: ['REGISTER', 'DELETE'], required: true },
    userData: { type: Schema.Types.Mixed },
    createdAt: { type: Date, default: Date.now },
    expiresAt: { type: Date, required: true },
  }
);

// TTL index to automatically delete expired OTPs
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const OtpModel = mongoose.model<IOtpDocument>('Otp', otpSchema);
