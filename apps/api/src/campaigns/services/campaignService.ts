import { CampaignCollaborationAttemptModel } from "../../models/CampaignCollaborationAttempt";
import { CampaignModel } from "../../models/Campaign";
import { CampaignRegistrationModel } from "../../models/CampaignRegistration";
import { NotificationModel } from "../../models/Notification";
import { buildParticipantPublicId } from "../../shared/utils/campaignParticipantIds";
import { ApiError } from "../../shared/utils/errors";
import { HealthAssessment } from "../../medical-records/models/HealthAssessment";


type CreateCampaignInput = {
  organizationId: string;
  hospitalId: string;
  name: string;
  date: Date;
  startTime: Date;
  endTime: Date;
  location: string;
  coordinatorName: string;
  coordinatorPhone: string;
  maxCapacity: number;
  description: string;
};

type DonorProfileInput = {
  bloodType: string;
  fullName: string;
  gender: "MALE" | "FEMALE" | "OTHER";
  phoneNumber: string;
  age: number;
  weightKg?: number;
  monthsSinceLastDonation: number;
  hasValidId: boolean;
  isPregnantOrBreastfeeding: boolean;
  hasSeriousMedicalIllness: boolean;
  hasRiskBehavior: boolean;
};

type VolunteerProfileInput = {
  fullName: string;
  gender: "MALE" | "FEMALE" | "OTHER";
  homeTown: string;
  phoneNumber: string;
  educationalQualification: string;
  otherQualification: string;
  concerns: string;
};

type DonorScreeningInput = {
  recentRiskFactors: {
    tattooIn12Months: boolean;
    earPiercingIn12Months: boolean;
    dentalExtractionIn1Week: boolean;
    imprisonedIn12Months: boolean;
    pregnantOrBreastfeedingInLast12Months: boolean;
  };
  medicalHistory: {
    heartDisease: boolean;
    diabetes: boolean;
    sexuallyTransmittedDiseases: boolean;
    lungDisease: boolean;
    allergicDisease: boolean;
    epilepsy: boolean;
    jaundice: boolean;
    faintingSpells: boolean;
    cancer: boolean;
    hepatitisBC: boolean;
    typhoidIn2Years: boolean;
    tuberculosisIn2Years: boolean;
    kidneyDisease: boolean;
    bleedingTendency: boolean;
    malariaIn12Months: boolean;
    dengueIn6Months: boolean;
    chickenpoxRubellaDiarrhoeaIn1Month: boolean;
  };
  recentMedicationsOrVaccines: {
    antibioticsIn1Week: boolean;
    aspirinIn1Week: boolean;
    alcoholIn3Days: boolean;
    steroids: boolean;
    vaccinationsIn12Months: boolean;
  };
  surgeryInLast6Months: boolean;
  travelToMalariaEndemicInLast3Years: boolean;
  foreignTravelInLast3Months: boolean;
};

export async function createCampaignWithCollaboration(input: CreateCampaignInput) {
  const campaign = await CampaignModel.create({
    organizationId: input.organizationId,
    name: input.name,
    date: input.date,
    startTime: input.startTime,
    endTime: input.endTime,
    location: input.location,
    coordinatorName: input.coordinatorName,
    coordinatorPhone: input.coordinatorPhone,
    maxCapacity: input.maxCapacity,
    description: input.description,
    currentHospitalId: input.hospitalId,
    status: "PENDING_HOSPITAL",
  });

  const attempt = await CampaignCollaborationAttemptModel.create({
    campaignId: campaign._id,
    organizationId: input.organizationId,
    hospitalId: input.hospitalId,
    attemptNo: 1,
    status: "PENDING",
  });

  campaign.currentCollaborationAttemptId = attempt._id as any;
  await campaign.save();

  await NotificationModel.create({
    actorType: "HOSPITAL",
    actorId: input.hospitalId,
    type: "COLLAB_REQUEST",
    title: "New collaboration request",
    message: `Campaign "${input.name}" needs hospital acceptance.`,
    meta: { campaignId: campaign._id.toString(), attemptId: attempt._id.toString() },
  });

  return { campaign, attempt };
}

export async function changeCampaignHospital(
  campaignId: string,
  organizationId: string,
  hospitalId: string,
) {
  const campaign = await CampaignModel.findById(campaignId);
  if (!campaign) {
    throw new ApiError(404, "Campaign not found");
  }
  if (campaign.organizationId.toString() !== organizationId) {
    throw new ApiError(403, "You can only edit your own campaign");
  }

  const latestAttempt = await CampaignCollaborationAttemptModel.findOne({
    campaignId: campaign._id,
  }).sort({ attemptNo: -1 });

  const nextAttemptNo = (latestAttempt?.attemptNo ?? 0) + 1;
  const attempt = await CampaignCollaborationAttemptModel.create({
    campaignId: campaign._id,
    organizationId: campaign.organizationId,
    hospitalId,
    attemptNo: nextAttemptNo,
    status: "PENDING",
  });

  campaign.currentHospitalId = hospitalId as any;
  campaign.currentCollaborationAttemptId = attempt._id as any;
  campaign.status = "PENDING_HOSPITAL";
  await campaign.save();

  await NotificationModel.create({
    actorType: "HOSPITAL",
    actorId: hospitalId,
    type: "COLLAB_REQUEST",
    title: "Campaign changed hospital",
    message: `Campaign "${campaign.name}" has requested your hospital collaboration.`,
    meta: { campaignId: campaign._id.toString(), attemptId: attempt._id.toString() },
  });

  return { campaign, attempt };
}

export async function acceptCollaboration(attemptId: string, hospitalUserId: string) {
  const attempt = await CampaignCollaborationAttemptModel.findById(attemptId);
  if (!attempt) {
    throw new ApiError(404, "Collaboration attempt not found");
  }
  if (attempt.status !== "PENDING") {
    throw new ApiError(409, "Only pending requests can be accepted");
  }

  attempt.status = "ACCEPTED";
  attempt.decisionAt = new Date();
  attempt.decisionBy = hospitalUserId as any;
  await attempt.save();

  const campaign = await CampaignModel.findById(attempt.campaignId);
  if (!campaign) {
    throw new ApiError(404, "Campaign not found");
  }
  campaign.status = "PUBLISHED";
  await campaign.save();

  await NotificationModel.create({
    actorType: "ORGANIZATION",
    actorId: campaign.organizationId,
    type: "COLLAB_ACCEPTED",
    title: "Hospital accepted collaboration",
    message: `Hospital accepted campaign "${campaign.name}". It is now visible to users.`,
    meta: { campaignId: campaign._id.toString(), attemptId: attempt._id.toString() },
  });

  return { campaign, attempt };
}

export async function rejectCollaboration(
  attemptId: string,
  hospitalUserId: string,
  reason: string,
) {
  const attempt = await CampaignCollaborationAttemptModel.findById(attemptId);
  if (!attempt) {
    throw new ApiError(404, "Collaboration attempt not found");
  }
  if (attempt.status !== "PENDING") {
    throw new ApiError(409, "Only pending requests can be rejected");
  }

  attempt.status = "REJECTED";
  attempt.rejectionReason = reason;
  attempt.decisionAt = new Date();
  attempt.decisionBy = hospitalUserId as any;
  await attempt.save();

  const campaign = await CampaignModel.findById(attempt.campaignId);
  if (!campaign) {
    throw new ApiError(404, "Campaign not found");
  }
  campaign.status = "HOSPITAL_REJECTED";
  await campaign.save();

  await NotificationModel.create({
    actorType: "ORGANIZATION",
    actorId: campaign.organizationId,
    type: "COLLAB_REJECTED",
    title: "Hospital rejected collaboration",
    message: `Hospital rejected campaign "${campaign.name}". You can choose another hospital.`,
    meta: { campaignId: campaign._id.toString(), attemptId: attempt._id.toString(), reason },
  });

  return { campaign, attempt };
}

export async function registerToCampaign(
  campaignId: string,
  userId: string,
  role: "DONOR" | "VOLUNTEER",
  notes: string,
  volunteerProfile?: VolunteerProfileInput,
  donorProfile?: DonorProfileInput,
  screening?: DonorScreeningInput,
) {
  const campaign = await CampaignModel.findById(campaignId);
  if (!campaign) {
    throw new ApiError(404, "Campaign not found");
  }
  if (campaign.status !== "PUBLISHED") {
    throw new ApiError(409, "Campaign is not open for registration");
  }

  const existingRegistration = await CampaignRegistrationModel.findOne({
    campaignId: campaign._id,
    userId,
    role,
  });
  if (role === "VOLUNTEER" && existingRegistration?.status === "CANCELLED") {
    throw new ApiError(409, "Your volunteer registration was rejected for this campaign");
  }

  // Requirement 1: Exclusive registration (Donor OR Volunteer, not both)
  const otherRole = role === "DONOR" ? "VOLUNTEER" : "DONOR";
  const existingOtherRole = await CampaignRegistrationModel.findOne({
    campaignId: campaign._id,
    userId,
    role: otherRole,
    status: { $ne: "CANCELLED" }
  });
  if (existingOtherRole) {
    throw new ApiError(400, `You are already registered as a ${otherRole.toLowerCase()} for this campaign. You can only hold one role at a time.`);
  }


  let screeningDecision: "APPROVED" | "REJECTED" | null = null;
  let rejectionReasons: string[] = [];
  let status: "REGISTERED" | "SCREENING_REJECTED" = "REGISTERED";
  const screenedAt = role === "DONOR" ? new Date() : null;
  let donationStatus:
    | "PENDING_PRECHECK"
    | "REJECTED_PRECHECK"
    | "PENDING_DOCTOR_VERIFICATION"
    | "REJECTED_DOCTOR_VERIFICATION"
    | "PENDING_FINAL_VERIFICATION"
    | "REJECTED_FINAL_VERIFICATION"
    | "READY_FOR_DONATION"
    | "DONATION_COMPLETED" = "PENDING_PRECHECK";

  if (role === "DONOR") {
    // Requirement 2: Global eligibility check
    const healthAssessment = await HealthAssessment.findOne({ userId }).sort({ createdAt: -1 });
    if (!healthAssessment) {
      throw new ApiError(403, "You must complete the medical eligibility assessment before registering as a donor.");
    }
    if (!healthAssessment.isEligible) {
      const reasons = healthAssessment.reasonsForIneligibility.join(", ");
      throw new ApiError(403, `You are currently not eligible to donate. Reasons: ${reasons}`);
    }

    if (!donorProfile) {
      throw new ApiError(400, "Donor profile is required");
    }

    if (screening) {
      const riskFlags = [
        screening.recentRiskFactors.tattooIn12Months,
        screening.recentRiskFactors.earPiercingIn12Months,
        screening.recentRiskFactors.dentalExtractionIn1Week,
        screening.recentRiskFactors.imprisonedIn12Months,
        screening.recentRiskFactors.pregnantOrBreastfeedingInLast12Months,
        screening.medicalHistory.heartDisease,
        screening.medicalHistory.diabetes,
        screening.medicalHistory.sexuallyTransmittedDiseases,
        screening.medicalHistory.lungDisease,
        screening.medicalHistory.allergicDisease,
        screening.medicalHistory.epilepsy,
        screening.medicalHistory.jaundice,
        screening.medicalHistory.faintingSpells,
        screening.medicalHistory.cancer,
        screening.medicalHistory.hepatitisBC,
        screening.medicalHistory.typhoidIn2Years,
        screening.medicalHistory.tuberculosisIn2Years,
        screening.medicalHistory.kidneyDisease,
        screening.medicalHistory.bleedingTendency,
        screening.medicalHistory.malariaIn12Months,
        screening.medicalHistory.dengueIn6Months,
        screening.medicalHistory.chickenpoxRubellaDiarrhoeaIn1Month,
        screening.recentMedicationsOrVaccines.antibioticsIn1Week,
        screening.recentMedicationsOrVaccines.aspirinIn1Week,
        screening.recentMedicationsOrVaccines.alcoholIn3Days,
        screening.recentMedicationsOrVaccines.steroids,
        screening.recentMedicationsOrVaccines.vaccinationsIn12Months,
        screening.surgeryInLast6Months,
        screening.travelToMalariaEndemicInLast3Years,
        screening.foreignTravelInLast3Months,
        donorProfile.isPregnantOrBreastfeeding,
        donorProfile.hasSeriousMedicalIllness,
        donorProfile.hasRiskBehavior,
      ];

      if (riskFlags.some(Boolean)) {
        rejectionReasons.push("Risk or medical deferral factor selected");
      }
    }

    if (donorProfile.age < 18 || donorProfile.age > 60) {
      rejectionReasons.push("Age must be between 18 and 60 years");
    }
    if (
      donorProfile.weightKg !== undefined &&
      donorProfile.weightKg !== null &&
      !Number.isNaN(Number(donorProfile.weightKg)) &&
      donorProfile.weightKg <= 50
    ) {
      rejectionReasons.push("Weight must be above 50 kg");
    }
    if (donorProfile.monthsSinceLastDonation < 4) {
      rejectionReasons.push("Minimum 4 months gap between donations is required");
    }
    if (!donorProfile.hasValidId) {
      rejectionReasons.push("A valid national identity card is required");
    }

    // If screening is missing, we rely on the healthAssessment being isEligible: true
    // which was checked at the beginning of the block.
    
    screeningDecision = rejectionReasons.length > 0 ? "REJECTED" : "APPROVED";
    status = screeningDecision === "REJECTED" ? "SCREENING_REJECTED" : "REGISTERED";
    donationStatus =
      screeningDecision === "REJECTED" ? "REJECTED_PRECHECK" : "PENDING_PRECHECK";
  }

  if (role === "VOLUNTEER" && !volunteerProfile) {
    throw new ApiError(400, "Volunteer profile is required");
  }

  const existingDonorReg = existingRegistration?.donorRegistration as
    | { donorPublicId?: string | null }
    | null
    | undefined;
  const existingVolReg = existingRegistration?.volunteerRegistration as
    | { volunteerPublicId?: string | null }
    | null
    | undefined;

  let donorPublicId: string | null =
    role === "DONOR" && existingDonorReg?.donorPublicId
      ? String(existingDonorReg.donorPublicId)
      : null;
  if (role === "DONOR" && status === "REGISTERED" && screeningDecision === "APPROVED" && !donorPublicId) {
    const updatedCampaign = await CampaignModel.findByIdAndUpdate(
      campaign._id,
      { $inc: { donorSeqCounter: 1 } },
      { new: true },
    );
    if (!updatedCampaign) {
      throw new ApiError(500, "Could not allocate donor ID");
    }
    donorPublicId = buildParticipantPublicId(
      campaign.name,
      "Donor",
      updatedCampaign.donorSeqCounter ?? 1,
    );
  }
  if (role === "DONOR" && !(status === "REGISTERED" && screeningDecision === "APPROVED")) {
    donorPublicId = null;
  }

  let volunteerPublicId: string | null =
    role === "VOLUNTEER" && existingVolReg?.volunteerPublicId
      ? String(existingVolReg.volunteerPublicId)
      : null;
  if (role === "VOLUNTEER" && status === "REGISTERED" && !volunteerPublicId) {
    const updatedCampaign = await CampaignModel.findByIdAndUpdate(
      campaign._id,
      { $inc: { volunteerSeqCounter: 1 } },
      { new: true },
    );
    if (!updatedCampaign) {
      throw new ApiError(500, "Could not allocate volunteer ID");
    }
    volunteerPublicId = buildParticipantPublicId(
      campaign.name,
      "Volunteer",
      updatedCampaign.volunteerSeqCounter ?? 1,
    );
  }

  let registration;
  if (role === "VOLUNTEER") {
    registration = await CampaignRegistrationModel.findOneAndUpdate(
      { campaignId: campaign._id, userId, role: "VOLUNTEER" },
      {
        $set: {
          campaignId: campaign._id,
          userId,
          role: "VOLUNTEER",
          status,
          notes,
          volunteerProfile: volunteerProfile ?? null,
          donorProfile: null,
          screeningSnapshot: null,
          screeningDecision: null,
          rejectionReasons,
          screenedAt: null,
          donationStatus,
          "volunteerRegistration.profile": volunteerProfile ?? null,
          "volunteerRegistration.volunteerPublicId": volunteerPublicId,
          "volunteerRegistration.reviewedStatus": "ACCEPTED",
          "volunteerRegistration.reviewedAt": new Date(),
          "volunteerRegistration.rejectionReason": "",
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
  } else {
    registration = await CampaignRegistrationModel.findOneAndUpdate(
      { campaignId: campaign._id, userId, role: "DONOR" },
      {
        campaignId: campaign._id,
        userId,
        role,
        status,
        notes,
        volunteerProfile: volunteerProfile ?? null,
        donorProfile: donorProfile ?? null,
        screeningSnapshot: screening ?? null,
        screeningDecision,
        rejectionReasons,
        screenedAt,
        donationStatus,
        volunteerRegistration: undefined,
        donorRegistration: {
          profile: donorProfile ?? null,
          donorPublicId,
          screeningSnapshot: screening ?? null,
          screeningDecision,
          rejectionReasons,
          screenedAt,
          donationWorkflow: {
            status: donationStatus,
            precheck: {
              bodyWeightKg: null,
              checkedAt: null,
              result: null,
              reason: "",
            },
            doctorVerification: {
              decision: null,
              notes: "",
              verifiedAt: null,
            },
            finalVerification: {
              haemoglobinStatus: null,
              verifiedAt: null,
            },
            donationCompletedAt: null,
          },
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
  }

  if (role === "DONOR" && screeningDecision) {
    await NotificationModel.create({
      actorType: "USER",
      actorId: userId,
      type: screeningDecision === "APPROVED" ? "DONOR_SCREENING_APPROVED" : "DONOR_SCREENING_REJECTED",
      title: screeningDecision === "APPROVED" ? "Donor registration approved" : "Donor registration rejected",
      message:
        screeningDecision === "APPROVED"
          ? `You are eligible for campaign "${campaign.name}".`
          : `You are not eligible for campaign "${campaign.name}" at the moment.`,
      meta: {
        campaignId: campaign._id.toString(),
        registrationId: registration._id.toString(),
        rejectionReasons,
      },
    });

    if (campaign.currentHospitalId && screeningDecision === "APPROVED") {
      await NotificationModel.create({
        actorType: "HOSPITAL",
        actorId: campaign.currentHospitalId,
        type: "VERIFIED_DONOR_AVAILABLE",
        title: "Verified donor available",
        message: `A donor passed screening for campaign "${campaign.name}".`,
        meta: {
          campaignId: campaign._id.toString(),
          registrationId: registration._id.toString(),
        },
      });
    }
  }

  return registration;
}
