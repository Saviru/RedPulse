import { Router } from "express";
import { requireAuth, requireRoles } from "../../shared/middleware/auth.middleware";
import {
  donorRespondToAlert,
  getNearbyDonorsController,
  getNearbyHospitalsController,
  markAlertOpenedByDonor,
  registerDeviceToken,
  unregisterDeviceToken,
  upsertDonorLocation,
  upsertHospitalLocation,
} from "../controllers/emergency.controller";

const emergencyRouter = Router();


emergencyRouter.post("/devices/register-token", requireAuth, requireRoles("USER"), registerDeviceToken);
emergencyRouter.delete("/devices/unregister-token", requireAuth, unregisterDeviceToken);

emergencyRouter.post("/alerts/:alertId/respond", requireAuth, requireRoles("USER"), donorRespondToAlert);
emergencyRouter.post(
  "/alerts/:alertId/opened",
  requireAuth,
  requireRoles("USER"),
  markAlertOpenedByDonor
);

emergencyRouter.patch("/donors/:donorId/location", requireAuth, requireRoles("USER"), upsertDonorLocation);
emergencyRouter.get("/donors/nearby", getNearbyDonorsController);

emergencyRouter.patch(
  "/hospitals/:hospitalId/location",
  requireAuth,
  requireRoles("HOSPITAL"),
  upsertHospitalLocation
);
emergencyRouter.get("/hospitals/nearby", getNearbyHospitalsController);

export { emergencyRouter };
