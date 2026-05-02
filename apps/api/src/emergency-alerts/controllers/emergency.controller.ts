import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { DeviceTokenModel } from "../../models/DeviceToken";
import { AlertNotificationModel } from "../../models/AlertNotification";
import { DonorProfileModel } from "../../models/DonorProfile";
import { HospitalProfileModel } from "../../models/HospitalProfile";
import {
  alertOpenedSchema,
  donorResponseSchema,
  donorLocationSchema,
  hospitalLocationSchema,
  nearbyQuerySchema,
  registerDeviceTokenAuthSchema,
} from "../validators/emergency.validator";
import { markAlertOpened, saveDonorResponse } from "../services/alert.service";
import { getNearbyDonors, getNearbyHospitals } from "../services/location.service";

const parse = <T>(schema: z.ZodType<T>, body: unknown): T => schema.parse(body);
const parseQuery = <T>(schema: z.ZodType<T>, query: unknown): T => schema.parse(query);


export const registerDeviceToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user || req.user.role !== "user") {
      res.status(403).json({ message: "Only users can register device tokens" });
      return;
    }
    const body = parse(registerDeviceTokenAuthSchema, req.body) as z.infer<typeof registerDeviceTokenAuthSchema>;
    const donorId = req.user.username;
    const token = await DeviceTokenModel.findOneAndUpdate(
      { fcmToken: body.fcmToken },
      {
        donorId,
        fcmToken: body.fcmToken,
        platform: body.platform,
        isActive: true,
        lastSeenAt: new Date(),
      },
      { new: true, upsert: true }
    );
    res.status(200).json(token);
  } catch (error) {
    next(error);
  }
};

export const unregisterDeviceToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      res.status(401).json({ message: "Authentication required" });
      return;
    }
    const token = String(req.query.fcmToken ?? "");
    if (!token) throw new Error("fcmToken query param is required");

    const existing = await DeviceTokenModel.findOne({ fcmToken: token }).lean();
    if (existing && existing.donorId !== req.user.username) {
      throw new Error("Not allowed to unregister this token");
    }

    await DeviceTokenModel.findOneAndUpdate(
      { fcmToken: token },
      { $set: { isActive: false, lastSeenAt: new Date() } }
    );

    res.status(200).json({ success: true });
  } catch (error) {
    next(error);
  }
};

export const donorRespondToAlert = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      res.status(401).json({ message: "Authentication required" });
      return;
    }
    const existing = await AlertNotificationModel.findById(req.params.alertId).lean();
    if (!existing) throw new Error("Alert not found");
    if (existing.donorId !== req.user.username) throw new Error("Not allowed to respond to this alert");
    const { action } = parse(donorResponseSchema, req.body) as z.infer<typeof donorResponseSchema>;
    const updated = await saveDonorResponse(req.params.alertId, action);
    res.status(200).json(updated);
  } catch (error) {
    next(error);
  }
};

export const markAlertOpenedByDonor = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      res.status(401).json({ message: "Authentication required" });
      return;
    }
    const existing = await AlertNotificationModel.findById(req.params.alertId).lean();
    if (!existing) throw new Error("Alert not found");
    if (existing.donorId !== req.user.username) throw new Error("Not allowed to mark this alert");
    parse(alertOpenedSchema, req.body);
    const updated = await markAlertOpened(req.params.alertId);
    res.status(200).json(updated);
  } catch (error) {
    next(error);
  }
};


export const upsertDonorLocation = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      res.status(401).json({ message: "Authentication required" });
      return;
    }
    if (req.user.role !== "user") {
      res.status(403).json({ message: "Only users can update location" });
      return;
    }
    if (req.params.donorId !== req.user.username) {
      throw new Error("donorId does not match authenticated user");
    }
    const body = parse(donorLocationSchema, req.body) as z.infer<typeof donorLocationSchema>;
    if (body.donorId !== req.params.donorId) throw new Error("donorId mismatch between path and body");
    const updated = await DonorProfileModel.findOneAndUpdate(
      { donorId: req.params.donorId },
      {
        $set: {
          donorId: req.params.donorId,
          bloodGroup: body.bloodGroup ?? "O+",
          locationText: body.locationText ?? "Unknown",
          isEligibleNow: body.isEligibleNow ?? true,
          responseRate: body.responseRate ?? 0.5,
          location: { type: "Point", coordinates: [body.lng, body.lat] },
          active: true,
        },
      },
      { new: true, upsert: true }
    ).lean();
    res.status(200).json(updated);
  } catch (error) {
    next(error);
  }
};

export const getNearbyDonorsController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const query = parseQuery(nearbyQuerySchema, req.query) as z.infer<typeof nearbyQuerySchema>;
    const donors = await getNearbyDonors(query);
    res.status(200).json(donors);
  } catch (error) {
    next(error);
  }
};

export const upsertHospitalLocation = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      res.status(401).json({ message: "Authentication required" });
      return;
    }
    if (req.user.role !== "hospital") {
      res.status(403).json({ message: "Only hospitals can update hospital location" });
      return;
    }
    if (req.params.hospitalId !== req.user.username) {
      throw new Error("hospitalId does not match authenticated user");
    }
    const body = parse(hospitalLocationSchema, req.body) as z.infer<typeof hospitalLocationSchema>;
    if (body.hospitalId !== req.params.hospitalId)
      throw new Error("hospitalId mismatch between path and body");
    const updated = await HospitalProfileModel.findOneAndUpdate(
      { hospitalId: req.params.hospitalId },
      {
        $set: {
          hospitalId: req.params.hospitalId,
          name: body.name,
          address: body.address,
          city: body.city,
          location: { type: "Point", coordinates: [body.lng, body.lat] },
          active: true,
        },
      },
      { new: true, upsert: true }
    ).lean();

    res.status(200).json(updated);
  } catch (error) {
    next(error);
  }
};

export const getNearbyHospitalsController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const query = parseQuery(nearbyQuerySchema.omit({ bloodGroup: true, eligibleOnly: true }), req.query);
    const hospitals = await getNearbyHospitals({
      lat: query.lat,
      lng: query.lng,
      radiusKm: query.radiusKm ?? 10,
    });
    res.status(200).json(hospitals);
  } catch (error) {
    next(error);
  }
};
