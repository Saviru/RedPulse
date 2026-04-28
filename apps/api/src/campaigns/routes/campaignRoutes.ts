import { Router } from "express";

import { requireAuth, requireRole } from "../../shared/middleware/auth.middleware";
import {
  acceptRequest,
  changeHospital,
  createCampaign,
  getMyVolunteerRegistrationStatuses,
  getMyCampaignRegistrations,
  getHospitalCollaborations,
  getHospitalPendingRequests,
  getPublishedCampaigns,
  registerCampaign,
  rejectRequest,
} from "../controllers/campaignController";

export const campaignRouter = Router();

campaignRouter.get("/public", getPublishedCampaigns);

campaignRouter.post("/", requireAuth, requireRole("ORGANIZATION"), createCampaign);
campaignRouter.patch(
  "/:campaignId/change-hospital",
  requireAuth,
  requireRole("ORGANIZATION"),
  changeHospital,
);
campaignRouter.post(
  "/:campaignId/register",
  requireAuth,
  requireRole("USER"),
  registerCampaign,
);
campaignRouter.get(
  "/my-volunteer-registrations",
  requireAuth,
  requireRole("USER"),
  getMyVolunteerRegistrationStatuses,
);
campaignRouter.get(
  "/my-registrations",
  requireAuth,
  requireRole("USER"),
  getMyCampaignRegistrations,
);

campaignRouter.get(
  "/hospital/pending-requests",
  requireAuth,
  requireRole("HOSPITAL"),
  getHospitalPendingRequests,
);
campaignRouter.get(
  "/hospital/collaborations",
  requireAuth,
  requireRole("HOSPITAL"),
  getHospitalCollaborations,
);
campaignRouter.patch(
  "/collaboration-attempts/:attemptId/accept",
  requireAuth,
  requireRole("HOSPITAL"),
  acceptRequest,
);
campaignRouter.patch(
  "/collaboration-attempts/:attemptId/reject",
  requireAuth,
  requireRole("HOSPITAL"),
  rejectRequest,
);
