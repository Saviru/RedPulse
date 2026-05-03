import { Schema, model, type InferSchemaType } from "mongoose";

const bloodRequestSchema = new Schema(
  {
    requesterId: { type: String, required: true, index: true },
    requesterType: {
      type: String,
      enum: ["USER", "HOSPITAL"],
      required: true,
    },
    requesterName: { type: String }, // Display name or hospital name
    requesterPhone: { type: String },
    requesterEmail: { type: String },
    
    // Extra details
    reason: { type: String },
    patientName: { type: String },
    patientAge: { type: Number },
    patientGender: { type: String, enum: ["Male", "Female", "Other"] },
    patientDetails: { type: String }, // General condition / diagnosis
    doctorName: { type: String },
    relationshipToPatient: { type: String },
    
    // Target info - who can receive this request
    targetType: {
      type: String,
      enum: ["USER", "HOSPITAL"], // user requests go to users, hospital requests go to hospitals
      required: true,
    },
    
    // Blood details
    bloodGroup: { type: String, required: true },
    bloodComponent: { 
      type: String, 
      enum: ["Whole Blood", "Red Cells", "Plasma", "Platelets"] 
    },
    neededBefore: { type: Date },
    
    // Location info
    locationText: { type: String },
    address: { type: String },
    city: { type: String },
    hospitalWard: { type: String },
    hospitalName: { type: String },
    hospitalLocation: { type: String },
    requesterLocation: { type: String },
    coordinatorPhone: { type: String },
    coordinates: {
      type: {
        type: String,
        enum: ["Point"],
      },
      coordinates: {
        type: [Number], // [lng, lat]
      },
    },
    
    // Request details
    urgencyLevel: {
      type: String,
      enum: ["critical", "high", "medium", "low"],
      default: "medium",
    },
    isEmergency: { type: Boolean, default: false },
    
    // Status tracking
    status: {
      type: String,
      enum: ["open", "partially_fulfilled", "fulfilled", "cancelled", "expired"],
      default: "open",
    },
    
    // Response tracking
    responses: [{
      responderId: { type: String, required: true },
      responderType: { type: String, enum: ["USER", "HOSPITAL"], required: true },
      responderName: { type: String },
      responderPhone: { type: String },
      responderBloodGroup: { type: String },
      status: {
        type: String,
        enum: ["pending", "accepted", "declined", "cancelled"],
        default: "pending",
      },
      respondedAt: { type: Date },
      notes: { type: String },
      createdAt: { type: Date, default: Date.now },
    }],
    
    // Matching donors/hospitals who received the alert
    notifiedTargets: [{
      targetId: { type: String, required: true },
      targetType: { type: String, enum: ["USER", "HOSPITAL"], required: true },
      priorityScore: { type: Number },
      notifiedAt: { type: Date, default: Date.now },
      notificationId: { type: Schema.Types.ObjectId }, // Reference to AlertNotification
    }],
    
    // For emergency requests, track the emergency request ID
    emergencyRequestId: { type: Schema.Types.ObjectId, ref: "EmergencyRequest" },
  },
  { timestamps: true }
);

bloodRequestSchema.index({ coordinates: "2dsphere" });
bloodRequestSchema.index({ requesterId: 1, status: 1 });
bloodRequestSchema.index({ bloodGroup: 1, status: 1 });
bloodRequestSchema.index({ targetType: 1, status: 1 });

export type BloodRequestDocument = InferSchemaType<typeof bloodRequestSchema>;
export const BloodRequestModel = model("BloodRequest", bloodRequestSchema);
