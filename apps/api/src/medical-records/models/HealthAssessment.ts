import mongoose, { Schema, Document } from 'mongoose';

export interface IHealthAssessment extends Document {
  userId?: mongoose.Types.ObjectId; // Optional until auth is connected
  isEligible: boolean;
  reasonsForIneligibility: string[];
  metrics: {
    hemoglobinLevel?: number;
    bloodPressureSystolic?: number;
    bloodPressureDiastolic?: number;
  };
  medicalReports?: string[];
  createdAt: Date;
  updatedAt: Date;
}

const HealthAssessmentSchema: Schema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User' },
  isEligible: { type: Boolean, required: true },
  reasonsForIneligibility: [{ type: String }],
  metrics: {
    hemoglobinLevel: { type: Number },
    bloodPressureSystolic: { type: Number },
    bloodPressureDiastolic: { type: Number },
  },
  medicalReports: [{ type: String }]
}, { timestamps: true });

export const HealthAssessment = mongoose.model<IHealthAssessment>('HealthAssessment', HealthAssessmentSchema);
