import { Router } from "express";

import { requireAuth, requireRoles } from "../../shared/middleware/auth.middleware";
import {
  completeDonorDonation,
  getMyCampaignOverviewById,
  getMyCampaigns,
  getHospitalDonorDonationDetails,
  getHospitalVerifiedDonors,
  getHospitals,
  getMyLatestCampaignOverview,
  getMyNotifications,
  getDashboard,
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
  requireRoles("ORGANIZATION", "HOSPITAL", "USER"),
  getMyNotifications,
);

organizationRouter.get(
  "/campaigns/latest-overview",
  requireAuth,
  requireRoles("ORGANIZATION"),
  getMyLatestCampaignOverview,
);
organizationRouter.get(
  "/dashboard",
  requireAuth,
  requireRoles("ORGANIZATION"),
  getDashboard,
);
organizationRouter.get(
  "/campaigns/my",
  requireAuth,
  requireRoles("ORGANIZATION"),
  getMyCampaigns,
);
organizationRouter.get(
  "/campaigns/:campaignId/overview",
  requireAuth,
  requireRoles("ORGANIZATION"),
  getMyCampaignOverviewById,
);
organizationRouter.patch(
  "/campaigns/:campaignId/volunteers/:registrationId/task",
  requireAuth,
  requireRoles("ORGANIZATION"),
  assignVolunteerTask,
);
organizationRouter.patch(
  "/campaigns/:campaignId/volunteers/:registrationId/attendance",
  requireAuth,
  requireRoles("ORGANIZATION"),
  markVolunteerAttendance,
);
organizationRouter.patch(
  "/campaigns/:campaignId/volunteers/:registrationId/reject",
  requireAuth,
  requireRoles("ORGANIZATION"),
  rejectCampaignVolunteer,
);

organizationRouter.get(
  "/hospitals/verified-donors",
  requireAuth,
  requireRoles("HOSPITAL"),
  getHospitalVerifiedDonors,
);

organizationRouter.get(
  "/hospitals/verified-donors/:registrationId",
  requireAuth,
  requireRoles("HOSPITAL"),
  getHospitalDonorDonationDetails,
);

organizationRouter.patch(
  "/hospitals/verified-donors/:registrationId/precheck",
  requireAuth,
  requireRoles("HOSPITAL"),
  verifyDonorPrecheck,
);

organizationRouter.patch(
  "/hospitals/verified-donors/:registrationId/doctor-verification",
  requireAuth,
  requireRoles("HOSPITAL"),
  verifyDonorDoctor,
);

organizationRouter.patch(
  "/hospitals/verified-donors/:registrationId/final-verification",
  requireAuth,
  requireRoles("HOSPITAL"),
  verifyDonorFinal,
);

organizationRouter.patch(
  "/hospitals/verified-donors/:registrationId/complete-donation",
  requireAuth,
  requireRoles("HOSPITAL"),
  completeDonorDonation,
);
