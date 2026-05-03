import mongoose, { Schema, Document } from 'mongoose';

export interface IMedicalCategory extends Document {
  name: string;
  donorId: mongoose.Types.ObjectId;
  createdAt: Date;
}

const medicalCategorySchema = new Schema({
  name: { type: String, required: true },
  donorId: { type: Schema.Types.ObjectId, ref: 'Donor', required: true },
  createdAt: { type: Date, default: Date.now }
});

export const MedicalCategory = mongoose.model<IMedicalCategory>('MedicalCategory', medicalCategorySchema);
