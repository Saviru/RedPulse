import { NextFunction, Request, Response } from "express";

import { CampaignCollaborationAttemptModel } from "../../models/CampaignCollaborationAttempt";
import { CampaignModel } from "../../models/Campaign";
import { CampaignRegistrationModel } from "../../models/CampaignRegistration";
import { OrganizationModel } from "../../models/Organization";
import { VolunteerTaskAssignmentModel } from "../../models/VolunteerTaskAssignment";
import { AuthenticatedRequest } from "../../shared/types/request.types";
import { created, ok } from "../../shared/utils/response";
import { resolveVolunteerTaskCrewView } from "../../shared/utils/volunteerTaskAssignmentView";
import {
  ChangeHospitalSchema,
  CreateCampaignSchema,
  RegisterCampaignSchema,
  RejectCollaborationSchema,
} from "../validators/campaignValidator";
import {
  acceptCollaboration,
  changeCampaignHospital,
  createCampaignWithCollaboration,
  registerToCampaign,
  rejectCollaboration,
} from "../services/campaignService";

export async function createCampaign(req: Request, res: Response, next: NextFunction) {
  try {
    const authReq = req as AuthenticatedRequest;
    const payload = CreateCampaignSchema.parse(req.body);
    const data = await createCampaignWithCollaboration({
      organizationId: authReq.user!.id,
      ...payload,
    });
    created(res, data, "Campaign created and sent to hospital for approval");
  } catch (error) {
    next(error);
  }
}

export async function changeHospital(req: Request, res: Response, next: NextFunction) {
  try {
    const authReq = req as AuthenticatedRequest;
    const payload = ChangeHospitalSchema.parse(req.body);
    const data = await changeCampaignHospital(req.params.campaignId, authReq.user!.id, payload.hospitalId);
    ok(res, data, "Hospital changed and collaboration request re-sent");
  } catch (error) {
    next(error);
  }
}

export async function getPublishedCampaigns(_req: Request, res: Response, next: NextFunction) {
  try {
    const campaigns = await CampaignModel.find({ status: "PUBLISHED" }).sort({ date: 1 });
    const hospitalIds = campaigns
      .map((c) => c.currentHospitalId?.toString())
      .filter(Boolean) as string[];
    const orgIds = campaigns.map((c) => c.organizationId.toString());
    const organizations = await OrganizationModel.find({
      _id: { $in: [...new Set([...hospitalIds, ...orgIds])] },
    });
    const orgMap = new Map(organizations.map((o) => [o._id.toString(), o.name]));

    const result = campaigns.map((c) => ({
      _id: c._id.toString(),
      name: c.name,
      date: c.date,
      startTime: c.startTime,
      endTime: c.endTime,
      location: c.location,
      coordinatorName: c.coordinatorName,
      coordinatorPhone: c.coordinatorPhone,
      maxCapacity: c.maxCapacity,
      description: c.description,
      currentHospitalId: c.currentHospitalId?.toString() ?? null,
      currentHospitalName: c.currentHospitalId
        ? orgMap.get(c.currentHospitalId.toString()) ?? "Partner hospital"
        : "Partner hospital",
      organizationName: orgMap.get(c.organizationId.toString()) ?? "Organization",
    }));

    ok(res, result, "Published campaigns");
  } catch (error) {
    next(error);
  }
}

export async function getHospitalPendingRequests(req: Request, res: Response, next: NextFunction) {
  try {
    const authReq = req as AuthenticatedRequest;
    const pendingAttempts = await CampaignCollaborationAttemptModel.find({
      hospitalId: authReq.user!.id,
      status: "PENDING",
    }).sort({ createdAt: -1 });

    const campaignIds = pendingAttempts.map((attempt) => attempt.campaignId);
    const campaigns = await CampaignModel.find({ _id: { $in: campaignIds } });
    const campaignMap = new Map(campaigns.map((c) => [c._id.toString(), c]));
    const orgIds = pendingAttempts.map((attempt) => attempt.organizationId.toString());
    const organizations = await OrganizationModel.find({ _id: { $in: orgIds } });
    const orgMap = new Map(organizations.map((o) => [o._id.toString(), o.name]));

    const pending = pendingAttempts
      .map((attempt) => {
        const campaign = campaignMap.get(attempt.campaignId.toString());
        if (!campaign) {
          return null;
        }
        return {
          attemptId: attempt._id.toString(),
          campaignId: campaign._id.toString(),
          campaignName: campaign.name,
          date: campaign.date,
          startTime: campaign.startTime,
          endTime: campaign.endTime,
          location: campaign.location,
          coordinatorName: campaign.coordinatorName,
          coordinatorPhone: campaign.coordinatorPhone,
          maxCapacity: campaign.maxCapacity,
          organizationId: attempt.organizationId.toString(),
          organizationName: orgMap.get(attempt.organizationId.toString()) ?? "Organization",
        };
      })
      .filter(Boolean);

    ok(res, pending, "Pending collaboration requests");
  } catch (error) {
    next(error);
  }
}

export async function getHospitalCollaborations(req: Request, res: Response, next: NextFunction) {
  try {
    const authReq = req as AuthenticatedRequest;
    const attempts = await CampaignCollaborationAttemptModel.find({
      hospitalId: authReq.user!.id,
    }).sort({ createdAt: -1 });

    const campaignIds = attempts.map((attempt) => attempt.campaignId);
    const campaigns = await CampaignModel.find({ _id: { $in: campaignIds } });
    const campaignMap = new Map(campaigns.map((c) => [c._id.toString(), c]));
    const orgIds = attempts.map((attempt) => attempt.organizationId.toString());
    const organizations = await OrganizationModel.find({ _id: { $in: orgIds } });
    const orgMap = new Map(organizations.map((o) => [o._id.toString(), o.name]));

    const collaborations = attempts
      .map((attempt) => {
        const campaign = campaignMap.get(attempt.campaignId.toString());
        if (!campaign) {
          return null;
        }
        return {
          attemptId: attempt._id.toString(),
          campaignId: campaign._id.toString(),
          campaignName: campaign.name,
          date: campaign.date,
          startTime: campaign.startTime,
          endTime: campaign.endTime,
          location: campaign.location,
          coordinatorName: campaign.coordinatorName,
          coordinatorPhone: campaign.coordinatorPhone,
          maxCapacity: campaign.maxCapacity,
          organizationId: attempt.organizationId.toString(),
          organizationName: orgMap.get(attempt.organizationId.toString()) ?? "Organization",
          status: attempt.status,
        };
      })
      .filter(Boolean);

    ok(res, collaborations, "Hospital collaborations");
  } catch (error) {
    next(error);
  }
}

export async function acceptRequest(req: Request, res: Response, next: NextFunction) {
  try {
    const authReq = req as AuthenticatedRequest;
    const data = await acceptCollaboration(req.params.attemptId, authReq.user!.id);
    ok(res, data, "Collaboration accepted and campaign published");
  } catch (error) {
    next(error);
  }
}

export async function rejectRequest(req: Request, res: Response, next: NextFunction) {
  try {
    const authReq = req as AuthenticatedRequest;
    const payload = RejectCollaborationSchema.parse(req.body);
    const data = await rejectCollaboration(req.params.attemptId, authReq.user!.id, payload.reason);
    ok(res, data, "Collaboration rejected and organizer notified");
  } catch (error) {
    next(error);
  }
}

export async function registerCampaign(req: Request, res: Response, next: NextFunction) {
  try {
    const authReq = req as AuthenticatedRequest;
    const payload = RegisterCampaignSchema.parse(req.body);
    const registration = await registerToCampaign(
      req.params.campaignId,
      authReq.user!.id,
      payload.role,
      payload.notes,
      payload.volunteerProfile,
      payload.donorProfile,
      payload.screening,
    );
    created(res, registration, "Campaign registration completed");
  } catch (error) {
    next(error);
  }
}

export async function getMyVolunteerRegistrationStatuses(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const authReq = req as AuthenticatedRequest;
    const registrations = await CampaignRegistrationModel.find({
      userId: authReq.user!.id,
      role: "VOLUNTEER",
    }).select("campaignId status updatedAt");

    const result = registrations.map((registration) => ({
      campaignId: registration.campaignId.toString(),
      status: registration.status,
      updatedAt: registration.updatedAt,
    }));

    ok(res, result, "Volunteer registration statuses");
  } catch (error) {
    next(error);
  }
}

export async function getMyCampaignRegistrations(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const authReq = req as AuthenticatedRequest;
    const registrations = await CampaignRegistrationModel.find({
      userId: authReq.user!.id,
    }).select("campaignId role status screeningDecision donorRegistration volunteerRegistration");

    const volunteerRegistrationIds = registrations
      .filter((r) => r.role === "VOLUNTEER")
      .map((r) => r._id);
    const volunteerTaskDocs =
      volunteerRegistrationIds.length > 0
        ? await VolunteerTaskAssignmentModel.find({
            registrationId: { $in: volunteerRegistrationIds },
          }).lean()
        : [];
    const volunteerTaskByRegId = new Map(
      volunteerTaskDocs.map((d) => [d.registrationId.toString(), d]),
    );

    type Row = {
      campaignId: string;
      donor: null | {
        status: string;
        screeningDecision: string | null;
        donorPublicId: string | null;
      };
      volunteer: null | {
        status: string;
        volunteerPublicId: string | null;
        assignedTask: null | {
          title: string;
          description: string;
          points: number;
          assignedAt: string | null;
        };
      };
    };

    const byCampaign = new Map<string, Row>();

    for (const registration of registrations) {
      const campaignId = registration.campaignId.toString();
      const row = byCampaign.get(campaignId) ?? {
        campaignId,
        donor: null,
        volunteer: null,
      };

      if (registration.role === "DONOR") {
        const dr = registration.donorRegistration as
          | { donorPublicId?: string | null; screeningDecision?: string | null }
          | null;
        const screening =
          registration.screeningDecision ?? dr?.screeningDecision ?? null;
        row.donor = {
          status: registration.status,
          screeningDecision: screening,
          donorPublicId: dr?.donorPublicId ? String(dr.donorPublicId) : null,
        };
      }

      if (registration.role === "VOLUNTEER") {
        const vr = registration.volunteerRegistration as
          | {
              volunteerPublicId?: string | null;
              assignedTask?: {
                title?: string;
                description?: string;
                points?: number;
                assignedAt?: Date | null;
              };
            }
          | null
          | undefined;
        const assignDoc = volunteerTaskByRegId.get(registration._id.toString());
        const { assignedTask } = resolveVolunteerTaskCrewView(assignDoc, vr);
        row.volunteer = {
          status: registration.status,
          volunteerPublicId: vr?.volunteerPublicId ? String(vr.volunteerPublicId) : null,
          assignedTask,
        };
      }

      byCampaign.set(campaignId, row);
    }

    ok(res, Array.from(byCampaign.values()), "My campaign registrations");
  } catch (error) {
    next(error);
  }
}
