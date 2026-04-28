import { NextFunction, Request, Response } from "express";

import { CampaignModel } from "../../models/Campaign";
import { CampaignRegistrationModel } from "../../models/CampaignRegistration";
import { NotificationModel } from "../../models/Notification";
import { VolunteerTaskAssignmentModel } from "../../models/VolunteerTaskAssignment";
import { OrganizationModel } from "../../models/Organization";
import { UserModel } from "../../models/User";
import { AuthenticatedRequest } from "../../shared/types/request.types";
import { ApiError } from "../../shared/utils/errors";
import { ok } from "../../shared/utils/response";
import { resolveVolunteerTaskCrewView } from "../../shared/utils/volunteerTaskAssignmentView";

async function buildCampaignOverview(campaign: any) {
  const hospital = campaign.currentHospitalId
    ? await OrganizationModel.findById(campaign.currentHospitalId)
    : null;

  const registrations = await CampaignRegistrationModel.find({
    campaignId: campaign._id,
    role: "VOLUNTEER",
    status: "REGISTERED",
  }).sort({ createdAt: -1 });

  const userIds = registrations.map((r) => r.userId);
  const users = await UserModel.find({ _id: { $in: userIds } });
  const userMap = new Map(users.map((u) => [u._id.toString(), u]));

  const registrationIds = registrations.map((r) => r._id);
  const taskAssignments =
    registrationIds.length > 0
      ? await VolunteerTaskAssignmentModel.find({
          registrationId: { $in: registrationIds },
        }).lean()
      : [];
  const taskByRegistrationId = new Map(
    taskAssignments.map((doc) => [doc.registrationId.toString(), doc]),
  );

  const crew = registrations.map((r) => {
    const user = userMap.get(r.userId.toString());
    const volunteerProfile = (((r.volunteerRegistration as { profile?: unknown } | null)
      ?.profile ??
      r.volunteerProfile) as
      | {
          fullName?: string;
          homeTown?: string;
          phoneNumber?: string;
          educationalQualification?: string;
          otherQualification?: string;
          concerns?: string;
        }
      | null) ?? null;
    const volReg = r.volunteerRegistration as
      | {
          volunteerPublicId?: string;
          assignedTask?: {
            title?: string;
            description?: string;
            points?: number;
            assignedAt?: Date | null;
          };
          taskAttendance?: {
            status?: "ATTENDED" | "ABSENT";
            markedAt?: Date | null;
          };
        }
      | null
      | undefined;
    const assignmentDoc = taskByRegistrationId.get(r._id.toString());
    const { assignedTask, taskAttendance } = resolveVolunteerTaskCrewView(assignmentDoc, volReg);

    return {
      id: r._id.toString(),
      userId: r.userId.toString(),
      name: volunteerProfile?.fullName ?? user?.name ?? "Volunteer",
      role: "Volunteer",
      points: 0,
      volunteerPublicId: volReg?.volunteerPublicId ?? "",
      assignedTask,
      taskAttendance,
      homeTown: volunteerProfile?.homeTown ?? "",
      phoneNumber: volunteerProfile?.phoneNumber ?? "",
      educationalQualification:
        volunteerProfile?.educationalQualification ?? "",
      otherQualification: volunteerProfile?.otherQualification ?? "",
      concerns: volunteerProfile?.concerns ?? "",
    };
  });

  return {
    campaign: {
      id: campaign._id.toString(),
      name: campaign.name,
      status: campaign.status,
      location: campaign.location,
      updatedAt: campaign.updatedAt,
    },
    hospital: hospital
      ? {
          id: hospital._id.toString(),
          name: hospital.name,
          address: "N/A",
          status:
            campaign.status === "PUBLISHED"
              ? "accepted"
              : campaign.status === "HOSPITAL_REJECTED"
                ? "rejected"
                : "pending",
        }
      : null,
    crew,
  };
}

export async function getMyNotifications(req: Request, res: Response, next: NextFunction) {
  try {
    const authReq = req as AuthenticatedRequest;
    const notifications = await NotificationModel.find({
      actorId: authReq.user!.id,
      actorType: authReq.user!.role,
    }).sort({ createdAt: -1 });
    ok(res, notifications, "Notifications");
  } catch (error) {
    next(error);
  }
}

export async function getHospitals(_req: Request, res: Response, next: NextFunction) {
  try {
    const hospitals = await OrganizationModel.find({ type: "HOSPITAL" }).sort({ name: 1 });
    const result = hospitals.map((h) => ({ id: h._id.toString(), name: h.name }));
    ok(res, result, "Hospitals");
  } catch (error) {
    next(error);
  }
}

export async function getMyLatestCampaignOverview(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const authReq = req as AuthenticatedRequest;
    const campaign = await CampaignModel.findOne({
      organizationId: authReq.user!.id,
    }).sort({ createdAt: -1 });

    if (!campaign) {
      ok(
        res,
        { campaign: null, hospital: null, crew: [] },
        "No campaign yet",
      );
      return;
    }

    const data = await buildCampaignOverview(campaign);
    ok(res, data, "Latest campaign overview");
  } catch (error) {
    next(error);
  }
}

export async function getMyCampaigns(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const authReq = req as AuthenticatedRequest;
    const campaigns = await CampaignModel.find({
      organizationId: authReq.user!.id,
    }).sort({ createdAt: -1 });

    const campaignIds = campaigns.map((c) => c._id);
    const registrations = await CampaignRegistrationModel.find({
      campaignId: { $in: campaignIds },
      status: "REGISTERED",
    }).select("campaignId role");

    const statsMap = new Map<
      string,
      { donors: number; volunteers: number }
    >();
    for (const registration of registrations) {
      const key = registration.campaignId.toString();
      const current = statsMap.get(key) ?? { donors: 0, volunteers: 0 };
      if (registration.role === "DONOR") {
        current.donors += 1;
      } else {
        current.volunteers += 1;
      }
      statsMap.set(key, current);
    }

    const result = campaigns.map((campaign) => {
      const stats = statsMap.get(campaign._id.toString()) ?? {
        donors: 0,
        volunteers: 0,
      };
      return {
        id: campaign._id.toString(),
        name: campaign.name,
        date: campaign.date,
        location: campaign.location,
        status: campaign.status,
        maxCapacity: campaign.maxCapacity,
        registeredDonors: stats.donors,
        volunteers: stats.volunteers,
      };
    });

    ok(res, result, "My campaigns");
  } catch (error) {
    next(error);
  }
}

export async function getMyCampaignOverviewById(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const authReq = req as AuthenticatedRequest;
    const campaign = await CampaignModel.findById(req.params.campaignId);
    if (!campaign || campaign.organizationId.toString() !== authReq.user!.id) {
      throw new ApiError(404, "Campaign not found");
    }

    const data = await buildCampaignOverview(campaign);
    ok(res, data, "Campaign overview");
  } catch (error) {
    next(error);
  }
}

export async function assignVolunteerTask(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const authReq = req as AuthenticatedRequest;
    const campaign = await CampaignModel.findById(req.params.campaignId);
    if (!campaign || campaign.organizationId.toString() !== authReq.user!.id) {
      throw new ApiError(404, "Campaign not found");
    }

    const registration = await CampaignRegistrationModel.findById(req.params.registrationId);
    if (
      !registration ||
      registration.campaignId.toString() !== campaign._id.toString() ||
      registration.role !== "VOLUNTEER"
    ) {
      throw new ApiError(404, "Volunteer registration not found");
    }
    if (registration.status !== "REGISTERED") {
      throw new ApiError(409, "Volunteer is not active for task assignment");
    }

    const title = typeof req.body.title === "string" ? req.body.title.trim() : "";
    const description =
      typeof req.body.description === "string" ? req.body.description.trim() : "";
    const pointsRaw = req.body.points;
    const points =
      typeof pointsRaw === "number" && !Number.isNaN(pointsRaw)
        ? pointsRaw
        : Number.parseInt(String(pointsRaw ?? "0"), 10);
    if (!title) {
      throw new ApiError(400, "Task title is required");
    }

    const assignment = await VolunteerTaskAssignmentModel.findOneAndUpdate(
      { registrationId: registration._id },
      {
        $set: {
          registrationId: registration._id,
          campaignId: campaign._id,
          userId: registration.userId,
          title,
          description,
          points: Number.isNaN(points) ? 0 : points,
          assignedAt: new Date(),
          attendanceStatus: null,
          attendanceMarkedAt: null,
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );

    await CampaignRegistrationModel.updateOne(
      { _id: registration._id },
      { $unset: { "volunteerRegistration.assignedTask": 1, "volunteerRegistration.taskAttendance": 1 } },
    ).catch(() => undefined);

    await NotificationModel.create({
      actorType: "USER",
      actorId: registration.userId,
      type: "VOLUNTEER_TASK_ASSIGNED",
      title: "Volunteer task assigned",
      message: `You were assigned: ${title}`,
      meta: {
        campaignId: campaign._id.toString(),
        registrationId: registration._id.toString(),
        taskTitle: title,
      },
    });

    ok(
      res,
      {
        registrationId: registration._id.toString(),
        campaignId: campaign._id.toString(),
        assignedTask: {
          title: assignment.title,
          description: assignment.description,
          points: assignment.points,
          assignedAt: assignment.assignedAt,
        },
      },
      "Task assigned to volunteer",
    );
  } catch (error) {
    next(error);
  }
}

export async function markVolunteerAttendance(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const authReq = req as AuthenticatedRequest;
    const campaign = await CampaignModel.findById(req.params.campaignId);
    if (!campaign || campaign.organizationId.toString() !== authReq.user!.id) {
      throw new ApiError(404, "Campaign not found");
    }

    const registration = await CampaignRegistrationModel.findById(req.params.registrationId);
    if (
      !registration ||
      registration.campaignId.toString() !== campaign._id.toString() ||
      registration.role !== "VOLUNTEER"
    ) {
      throw new ApiError(404, "Volunteer registration not found");
    }
    if (registration.status !== "REGISTERED") {
      throw new ApiError(409, "Volunteer is not active");
    }

    const status = req.body.status as string | undefined;
    if (status !== "ATTENDED" && status !== "ABSENT") {
      throw new ApiError(400, "status must be ATTENDED or ABSENT");
    }

    const assignment = await VolunteerTaskAssignmentModel.findOne({
      registrationId: registration._id,
    });
    if (!assignment) {
      throw new ApiError(409, "Assign a task before marking attendance");
    }
    const hasTask =
      Boolean(String(assignment.title ?? "").trim()) ||
      Boolean(String(assignment.description ?? "").trim()) ||
      assignment.assignedAt != null;
    if (!hasTask) {
      throw new ApiError(409, "Assign a task before marking attendance");
    }

    const existingAttendance = assignment.attendanceStatus;
    if (existingAttendance === "ATTENDED" || existingAttendance === "ABSENT") {
      throw new ApiError(409, "Attendance has already been recorded for this volunteer");
    }

    assignment.attendanceStatus = status;
    assignment.attendanceMarkedAt = new Date();
    await assignment.save();

    await NotificationModel.create({
      actorType: "USER",
      actorId: registration.userId,
      type: "VOLUNTEER_ATTENDANCE_MARKED",
      title: status === "ATTENDED" ? "Marked as attended" : "Marked as absent",
      message:
        status === "ATTENDED"
          ? `Your attendance for "${campaign.name}" was recorded as attended.`
          : `Your attendance for "${campaign.name}" was recorded as absent.`,
      meta: {
        campaignId: campaign._id.toString(),
        registrationId: registration._id.toString(),
        status,
      },
    });

    ok(
      res,
      {
        registrationId: registration._id.toString(),
        campaignId: campaign._id.toString(),
        taskAttendance: {
          status: assignment.attendanceStatus,
          markedAt: assignment.attendanceMarkedAt,
        },
      },
      "Volunteer attendance updated",
    );
  } catch (error) {
    next(error);
  }
}

export async function rejectCampaignVolunteer(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const authReq = req as AuthenticatedRequest;
    const campaign = await CampaignModel.findById(req.params.campaignId);
    if (!campaign || campaign.organizationId.toString() !== authReq.user!.id) {
      throw new ApiError(404, "Campaign not found");
    }

    const registration = await CampaignRegistrationModel.findById(
      req.params.registrationId,
    );
    if (
      !registration ||
      registration.campaignId.toString() !== campaign._id.toString() ||
      registration.role !== "VOLUNTEER"
    ) {
      throw new ApiError(404, "Volunteer registration not found");
    }
    if (registration.status !== "REGISTERED") {
      throw new ApiError(409, "Volunteer is already processed");
    }

    const reason =
      typeof req.body.reason === "string" && req.body.reason.trim()
        ? req.body.reason.trim()
        : "Your volunteer registration was rejected by organization.";

    registration.status = "CANCELLED";
    registration.notes = reason;
    if (!registration.volunteerRegistration) {
      registration.volunteerRegistration = {} as any;
    }
    (registration.volunteerRegistration as any).reviewedStatus = "REJECTED";
    (registration.volunteerRegistration as any).reviewedAt = new Date();
    (registration.volunteerRegistration as any).rejectionReason = reason;
    await registration.save();

    await VolunteerTaskAssignmentModel.deleteOne({ registrationId: registration._id }).catch(
      () => undefined,
    );

    await NotificationModel.create({
      actorType: "USER",
      actorId: registration.userId,
      type: "VOLUNTEER_REGISTRATION_REJECTED",
      title: "Volunteer registration rejected",
      message: reason,
      meta: {
        campaignId: campaign._id.toString(),
        registrationId: registration._id.toString(),
      },
    });

    ok(
      res,
      {
        registrationId: registration._id.toString(),
        campaignId: campaign._id.toString(),
        status: registration.status,
      },
      "Volunteer rejected and notified",
    );
  } catch (error) {
    next(error);
  }
}

export async function getHospitalVerifiedDonors(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const authReq = req as AuthenticatedRequest;

    const campaigns = await CampaignModel.find({
      currentHospitalId: authReq.user!.id,
      status: "PUBLISHED",
    }).select("_id name");

    const campaignMap = new Map(campaigns.map((c) => [c._id.toString(), c.name]));
    const campaignIds = campaigns.map((c) => c._id);

    if (campaignIds.length === 0) {
      ok(res, [], "Verified donors");
      return;
    }

    const registrations = await CampaignRegistrationModel.find({
      campaignId: { $in: campaignIds },
      role: "DONOR",
      status: "REGISTERED",
      $or: [{ screeningDecision: "APPROVED" }, { "donorRegistration.screeningDecision": "APPROVED" }],
    }).sort({ createdAt: -1 });

    const result = registrations.map((registration) => {
      const donorReg = registration.donorRegistration as { donorPublicId?: string | null } | null;
      const donorPublicId = donorReg?.donorPublicId ? String(donorReg.donorPublicId) : null;
      return {
      id: registration._id.toString(),
      campaignId: registration.campaignId.toString(),
      campaignName: campaignMap.get(registration.campaignId.toString()) ?? "Campaign",
      userId: registration.userId.toString(),
      donorPublicId,
      fullName: ((((registration.donorRegistration as { profile?: any } | null)?.profile ??
        registration.donorProfile) as { fullName?: string } | null)?.fullName ?? "Donor"),
      bloodType: ((((registration.donorRegistration as { profile?: any } | null)?.profile ??
        registration.donorProfile) as { bloodType?: string } | null)?.bloodType ?? "Unknown"),
      phoneNumber: ((((registration.donorRegistration as { profile?: any } | null)?.profile ??
        registration.donorProfile) as { phoneNumber?: string } | null)?.phoneNumber ?? ""),
      age: ((((registration.donorRegistration as { profile?: any } | null)?.profile ??
        registration.donorProfile) as { age?: number } | null)?.age ?? null),
      gender: ((((registration.donorRegistration as { profile?: any } | null)?.profile ??
        registration.donorProfile) as { gender?: string } | null)?.gender ?? null),
      donationStatus:
        ((registration.donorRegistration as { donationWorkflow?: { status?: string } } | null)
          ?.donationWorkflow?.status as string | undefined) ?? registration.donationStatus,
      createdAt: registration.createdAt,
    };
    });

    ok(res, result, "Verified donors");
  } catch (error) {
    next(error);
  }
}

async function getHospitalRegistrationOrThrow(
  hospitalId: string,
  registrationId: string,
) {
  const registration = await CampaignRegistrationModel.findById(registrationId);
  if (!registration) {
    throw new ApiError(404, "Donor registration not found");
  }
  const campaign = await CampaignModel.findById(registration.campaignId);
  if (!campaign || campaign.currentHospitalId?.toString() !== hospitalId) {
    throw new ApiError(403, "You can only manage donors for your hospital campaigns");
  }
  return { registration, campaign };
}

export async function getHospitalDonorDonationDetails(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const authReq = req as AuthenticatedRequest;
    const { registration, campaign } = await getHospitalRegistrationOrThrow(
      authReq.user!.id,
      req.params.registrationId,
    );

    const user = await UserModel.findById(registration.userId).select("name email");
    const donorProfile = ((((registration.donorRegistration as { profile?: unknown } | null)
      ?.profile ??
      registration.donorProfile) ??
      {}) as {
      bloodType?: string;
      fullName?: string;
      phoneNumber?: string;
      gender?: string;
      age?: number;
      monthsSinceLastDonation?: number;
    });

    ok(
      res,
      {
        registrationId: registration._id.toString(),
        campaignId: campaign._id.toString(),
        campaignName: campaign.name,
        donor: {
          name: donorProfile.fullName ?? user?.name ?? "Donor",
          email: user?.email ?? "",
          phoneNumber: donorProfile.phoneNumber ?? "",
          bloodType: donorProfile.bloodType ?? "Unknown",
          age: donorProfile.age ?? null,
          gender: donorProfile.gender ?? null,
          lastDonationInfo:
            donorProfile.monthsSinceLastDonation !== undefined
              ? `${donorProfile.monthsSinceLastDonation} month(s) ago`
              : "Not provided",
        },
        process: {
          donationStatus:
            ((registration.donorRegistration as { donationWorkflow?: { status?: string } } | null)
              ?.donationWorkflow?.status as string | undefined) ?? registration.donationStatus,
          precheck:
            ((registration.donorRegistration as { donationWorkflow?: { precheck?: unknown } } | null)
              ?.donationWorkflow?.precheck as unknown) ?? registration.precheck ?? null,
          doctorVerification:
            ((registration.donorRegistration as {
              donationWorkflow?: { doctorVerification?: unknown };
            } | null)?.donationWorkflow?.doctorVerification as unknown) ??
            registration.doctorVerification ??
            null,
          finalVerification:
            ((registration.donorRegistration as { donationWorkflow?: { finalVerification?: unknown } } | null)
              ?.donationWorkflow?.finalVerification as unknown) ??
            registration.finalVerification ??
            null,
          donationCompletedAt:
            ((registration.donorRegistration as {
              donationWorkflow?: { donationCompletedAt?: Date | null };
            } | null)?.donationWorkflow?.donationCompletedAt as Date | null | undefined) ??
            registration.donationCompletedAt ??
            null,
        },
      },
      "Donor donation details",
    );
  } catch (error) {
    next(error);
  }
}

export async function verifyDonorPrecheck(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const authReq = req as AuthenticatedRequest;
    const weight = Number(req.body.bodyWeightKg);
    if (Number.isNaN(weight)) {
      throw new ApiError(400, "bodyWeightKg is required");
    }
    const { registration } = await getHospitalRegistrationOrThrow(
      authReq.user!.id,
      req.params.registrationId,
    );
    const donorScreeningDecision =
      ((registration.donorRegistration as { screeningDecision?: string } | null)
        ?.screeningDecision as string | undefined) ?? registration.screeningDecision;
    if (donorScreeningDecision !== "APPROVED") {
      throw new ApiError(409, "Donor is not screening-approved");
    }

    const now = new Date();
    const verified = weight >= 50;
    registration.precheck = {
      bodyWeightKg: weight,
      checkedAt: now,
      result: verified ? "VERIFIED" : "REJECTED",
      reason: verified ? "" : "Body weight is below 50kg",
    };
    registration.donationStatus = verified
      ? "PENDING_DOCTOR_VERIFICATION"
      : "REJECTED_PRECHECK";
    if (!registration.donorRegistration) {
      registration.donorRegistration = {} as any;
    }
    (registration.donorRegistration as any).donationWorkflow = {
      ...((registration.donorRegistration as any).donationWorkflow ?? {}),
      status: registration.donationStatus,
      precheck: registration.precheck,
    };
    await registration.save();

    ok(
      res,
      {
        donationStatus: registration.donationStatus,
        precheck: registration.precheck,
      },
      verified ? "Body weight verified" : "Donor rejected by precheck",
    );
  } catch (error) {
    next(error);
  }
}

export async function verifyDonorDoctor(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const authReq = req as AuthenticatedRequest;
    const decision = req.body.decision as "ACCEPT" | "REJECT" | undefined;
    const notes = typeof req.body.notes === "string" ? req.body.notes : "";
    if (!decision || !["ACCEPT", "REJECT"].includes(decision)) {
      throw new ApiError(400, "Doctor decision is required");
    }

    const { registration } = await getHospitalRegistrationOrThrow(
      authReq.user!.id,
      req.params.registrationId,
    );
    if (registration.donationStatus !== "PENDING_DOCTOR_VERIFICATION") {
      throw new ApiError(409, "Doctor verification is not available at this stage");
    }

    registration.doctorVerification = {
      decision,
      notes,
      verifiedAt: new Date(),
    };
    registration.donationStatus =
      decision === "ACCEPT"
        ? "PENDING_FINAL_VERIFICATION"
        : "REJECTED_DOCTOR_VERIFICATION";
    if (!registration.donorRegistration) {
      registration.donorRegistration = {} as any;
    }
    (registration.donorRegistration as any).donationWorkflow = {
      ...((registration.donorRegistration as any).donationWorkflow ?? {}),
      status: registration.donationStatus,
      doctorVerification: registration.doctorVerification,
    };
    await registration.save();

    ok(
      res,
      {
        donationStatus: registration.donationStatus,
        doctorVerification: registration.doctorVerification,
      },
      decision === "ACCEPT" ? "Doctor accepted donor" : "Doctor rejected donor",
    );
  } catch (error) {
    next(error);
  }
}

export async function verifyDonorFinal(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const authReq = req as AuthenticatedRequest;
    const haemoglobinStatus = req.body.haemoglobinStatus as
      | "FLOATED"
      | "NOT_FLOATED"
      | undefined;
    if (!haemoglobinStatus || !["FLOATED", "NOT_FLOATED"].includes(haemoglobinStatus)) {
      throw new ApiError(400, "haemoglobinStatus is required");
    }

    const { registration } = await getHospitalRegistrationOrThrow(
      authReq.user!.id,
      req.params.registrationId,
    );
    if (registration.donationStatus !== "PENDING_FINAL_VERIFICATION") {
      throw new ApiError(409, "Final verification is not available at this stage");
    }

    registration.finalVerification = {
      haemoglobinStatus,
      verifiedAt: new Date(),
    };
    registration.donationStatus =
      haemoglobinStatus === "FLOATED"
        ? "READY_FOR_DONATION"
        : "REJECTED_FINAL_VERIFICATION";
    if (!registration.donorRegistration) {
      registration.donorRegistration = {} as any;
    }
    (registration.donorRegistration as any).donationWorkflow = {
      ...((registration.donorRegistration as any).donationWorkflow ?? {}),
      status: registration.donationStatus,
      finalVerification: registration.finalVerification,
    };
    await registration.save();

    ok(
      res,
      {
        donationStatus: registration.donationStatus,
        finalVerification: registration.finalVerification,
      },
      haemoglobinStatus === "FLOATED"
        ? "Final verification passed"
        : "Donor rejected in final verification",
    );
  } catch (error) {
    next(error);
  }
}

export async function completeDonorDonation(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const authReq = req as AuthenticatedRequest;
    const { registration } = await getHospitalRegistrationOrThrow(
      authReq.user!.id,
      req.params.registrationId,
    );
    if (registration.donationStatus !== "READY_FOR_DONATION") {
      throw new ApiError(409, "Donation can only be completed after final verification");
    }

    registration.donationStatus = "DONATION_COMPLETED";
    registration.donationCompletedAt = new Date();
    if (!registration.donorRegistration) {
      registration.donorRegistration = {} as any;
    }
    (registration.donorRegistration as any).donationWorkflow = {
      ...((registration.donorRegistration as any).donationWorkflow ?? {}),
      status: registration.donationStatus,
      donationCompletedAt: registration.donationCompletedAt,
    };
    await registration.save();

    await NotificationModel.create({
      actorType: "USER",
      actorId: registration.userId,
      type: "DONATION_COMPLETED",
      title: "Donation completed",
      message: "Your hospital donation process is marked as completed.",
      meta: {
        registrationId: registration._id.toString(),
        campaignId: registration.campaignId.toString(),
      },
    });

    ok(
      res,
      {
        donationStatus: registration.donationStatus,
        donationCompletedAt: registration.donationCompletedAt,
      },
      "Donation completed",
    );
  } catch (error) {
    next(error);
  }
}
