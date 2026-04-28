import { Router } from "express";

import { requireAuth, requireRole } from "../../shared/middleware/auth.middleware";
import {
  completeDonorDonation,
  getMyCampaignOverviewById,
  getMyCampaigns,
  getHospitalDonorDonationDetails,
  getHospitalVerifiedDonors,
  getHospitals,
  getMyLatestCampaignOverview,
  getMyNotifications,
  assignVolunteerTask,
  markVolunteerAttendance,
  rejectCampaignVolunteer,
  verifyDonorDoctor,
  verifyDonorFinal,
  verifyDonorPrecheck,
} from "../controllers/organizationController";

export const organizationRouter = Router();

organizationRouter.get("/hospitals", getHospitals);

organizationRouter.get(
  "/notifications/me",
  requireAuth,
  requireRole("ORGANIZATION", "HOSPITAL", "USER"),
  getMyNotifications,
);

organizationRouter.get(
  "/campaigns/latest-overview",
  requireAuth,
  requireRole("ORGANIZATION"),
  getMyLatestCampaignOverview,
);
organizationRouter.get(
  "/campaigns/my",
  requireAuth,
  requireRole("ORGANIZATION"),
  getMyCampaigns,
);
organizationRouter.get(
  "/campaigns/:campaignId/overview",
  requireAuth,
  requireRole("ORGANIZATION"),
  getMyCampaignOverviewById,
);
organizationRouter.patch(
  "/campaigns/:campaignId/volunteers/:registrationId/task",
  requireAuth,
  requireRole("ORGANIZATION"),
  assignVolunteerTask,
);
organizationRouter.patch(
  "/campaigns/:campaignId/volunteers/:registrationId/attendance",
  requireAuth,
  requireRole("ORGANIZATION"),
  markVolunteerAttendance,
);
organizationRouter.patch(
  "/campaigns/:campaignId/volunteers/:registrationId/reject",
  requireAuth,
  requireRole("ORGANIZATION"),
  rejectCampaignVolunteer,
);

organizationRouter.get(
  "/hospitals/verified-donors",
  requireAuth,
  requireRole("HOSPITAL"),
  getHospitalVerifiedDonors,
);

organizationRouter.get(
  "/hospitals/verified-donors/:registrationId",
  requireAuth,
  requireRole("HOSPITAL"),
  getHospitalDonorDonationDetails,
);

organizationRouter.patch(
  "/hospitals/verified-donors/:registrationId/precheck",
  requireAuth,
  requireRole("HOSPITAL"),
  verifyDonorPrecheck,
);

organizationRouter.patch(
  "/hospitals/verified-donors/:registrationId/doctor-verification",
  requireAuth,
  requireRole("HOSPITAL"),
  verifyDonorDoctor,
);

organizationRouter.patch(
  "/hospitals/verified-donors/:registrationId/final-verification",
  requireAuth,
  requireRole("HOSPITAL"),
  verifyDonorFinal,
);

organizationRouter.patch(
  "/hospitals/verified-donors/:registrationId/complete-donation",
  requireAuth,
  requireRole("HOSPITAL"),
  completeDonorDonation,
);
