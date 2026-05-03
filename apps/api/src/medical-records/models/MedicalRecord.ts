import mongoose, { Schema, Document } from 'mongoose';

export interface IMedicalRecord extends Document {
  fileName: string;
  fileUrl: string;
  categoryId: mongoose.Types.ObjectId;
  donorId: mongoose.Types.ObjectId;
  createdAt: Date;
}

const medicalRecordSchema = new Schema({
  fileName: { type: String, required: true },
  fileUrl: { type: String, required: true },
  categoryId: { type: Schema.Types.ObjectId, ref: 'MedicalCategory', required: true },
  donorId: { type: Schema.Types.ObjectId, ref: 'Donor', required: true },
  createdAt: { type: Date, default: Date.now }
});

export const MedicalRecord = mongoose.model<IMedicalRecord>('MedicalRecord', medicalRecordSchema);
