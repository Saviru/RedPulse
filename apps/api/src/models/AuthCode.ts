import mongoose, { Document, Schema } from 'mongoose';

export interface IAuthCode extends Document {
  authorizationCode: string;
  codeChallenge: string;
  userId: string;
  expiresAt: Date;
}

const authCodeSchema = new Schema<IAuthCode>(
  {
    authorizationCode: { type: String, required: true, unique: true },
    codeChallenge: { type: String, required: true },
    userId: { type: String, required: true },
    expiresAt: { type: Date, required: true }
  },
  { timestamps: true }
);

// TTL index to automatically delete expired codes
authCodeSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const AuthCodeModel = mongoose.model<IAuthCode>('AuthCode', authCodeSchema);
