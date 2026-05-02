import { z } from "zod";

const bloodGroupSchema = z.enum(["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]);

export const createEmergencyRequestSchema = z.object({
  requesterType: z.enum(["hospital", "user"]),
  requesterId: z.string().min(1),
  patientBloodGroup: bloodGroupSchema,
  locationText: z.string().min(2),
  urgencyLevel: z.enum(["critical", "high", "medium"]),
});

/** Body for authenticated request creation; requester is taken from the JWT. */
export const createEmergencyRequestAuthSchema = z.object({
  patientBloodGroup: bloodGroupSchema,
  locationText: z.string().min(2),
  urgencyLevel: z.enum(["critical", "high", "medium"]),
});

const locationSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
});

export const registerDeviceTokenSchema = z.object({
  donorId: z.string().min(1),
  fcmToken: z.string().min(10),
  platform: z.enum(["android", "ios"]),
});

/** Donor device registration when authenticated; donorId is implied from JWT. */
export const registerDeviceTokenAuthSchema = z.object({
  fcmToken: z.string().min(10),
  platform: z.enum(["android", "ios"]),
});

export const donorResponseSchema = z.object({
  action: z.enum(["accepted", "declined"]),
});

export const requestStatusSchema = z.object({
  status: z.enum(["open", "partially_fulfilled", "fulfilled", "expired", "cancelled"]),
});

export const alertOpenedSchema = z.object({
  opened: z.boolean().default(true),
});

export const donorLocationSchema = z.object({
  donorId: z.string().min(1),
  bloodGroup: bloodGroupSchema.optional(),
  locationText: z.string().min(2).optional(),
  isEligibleNow: z.boolean().optional(),
  responseRate: z.number().min(0).max(1).optional(),
  ...locationSchema.shape,
});

export const hospitalLocationSchema = z.object({
  hospitalId: z.string().min(1),
  name: z.string().min(2),
  address: z.string().optional(),
  city: z.string().optional(),
  ...locationSchema.shape,
});

export const nearbyQuerySchema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
  radiusKm: z.coerce.number().min(0.1).max(500).default(10),
  bloodGroup: bloodGroupSchema.optional(),
  eligibleOnly: z.coerce.boolean().optional(),
});

export const requestLocationSchema = z.object(locationSchema.shape);

export const topNQuerySchema = z.object({
  topN: z.coerce.number().int().min(1).max(200).default(30),
});
