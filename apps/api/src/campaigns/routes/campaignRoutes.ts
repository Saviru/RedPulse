import { Router } from "express";

import { requireAuth, requireRoles } from "../../shared/middleware/auth.middleware";
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
  submitTaskWork,
} from "../controllers/campaignController";
import { createUploadMiddleware } from "../../shared/middleware/upload.middleware";

export const campaignRouter = Router();
const uploadWork = createUploadMiddleware("task-submissions");

campaignRouter.get("/public", getPublishedCampaigns);

campaignRouter.post("/", requireAuth, requireRoles("ORGANIZATION"), createCampaign);
campaignRouter.patch(
  "/:campaignId/change-hospital",
  requireAuth,
  requireRoles("ORGANIZATION"),
  changeHospital,
);
campaignRouter.post(
  "/:campaignId/register",
  requireAuth,
  requireRoles("USER"),
  registerCampaign,
);
campaignRouter.get(
  "/my-volunteer-registrations",
  requireAuth,
  requireRoles("USER"),
  getMyVolunteerRegistrationStatuses,
);
campaignRouter.get(
  "/my-registrations",
  requireAuth,
  requireRoles("USER"),
  getMyCampaignRegistrations,
);

campaignRouter.get(
  "/hospital/pending-requests",
  requireAuth,
  requireRoles("HOSPITAL"),
  getHospitalPendingRequests,
);
campaignRouter.get(
  "/hospital/collaborations",
  requireAuth,
  requireRoles("HOSPITAL"),
  getHospitalCollaborations,
);
campaignRouter.patch(
  "/collaboration-attempts/:attemptId/accept",
  requireAuth,
  requireRoles("HOSPITAL"),
  acceptRequest,
);
campaignRouter.patch(
  "/collaboration-attempts/:attemptId/reject",
  requireAuth,
  requireRoles("HOSPITAL"),
  rejectRequest,
);

campaignRouter.post(
  "/:campaignId/tasks/submit-work",
  requireAuth,
  requireRoles("USER"),
  uploadWork.array("workImages", 5),
  submitTaskWork,
);
