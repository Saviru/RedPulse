import mongoose, { Document, Schema } from 'mongoose';
import { Role } from 'redpulse-types';

export interface IUserDocument extends Document {
  email: string;
  username: string;
  passwordHash: string;
  role: Role;
  phone: string;
  avatar?: string;
  points: number;
  isActive: boolean;
  isVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUserDocument>(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    username: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ['USER', 'ORGANIZATION', 'HOSPITAL'], required: true },
    phone: { type: String, required: false, unique: true, sparse: true, trim: true },
    avatar: { type: String, required: false },
    points: { type: Number, default: 10 },
    isActive: { type: Boolean, default: true },
    isVerified: { type: Boolean, default: false },
  },
  {
    timestamps: true,
    discriminatorKey: 'role'
  }
);

export const UserModel = mongoose.model<IUserDocument>('User', userSchema);
