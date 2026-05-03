import { requestJson } from "./api";

export type CampaignPayload = {
  hospitalId: string;
  name: string;
  date: string;
  startTime: string;
  endTime: string;
  location: string;
  coordinatorName: string;
  coordinatorPhone: string;
  maxCapacity: number;
  description: string;
};

export type PublicCampaign = {
  _id: string;
  name: string;
  date: string;
  startTime: string;
  endTime: string;
  location: string;
  coordinatorName: string;
  coordinatorPhone: string;
  maxCapacity: number;
  description: string;
  currentHospitalId?: string | null;
  currentHospitalName: string;
  organizationName: string;
};

export type PendingHospitalRequest = {
  attemptId: string;
  campaignId: string;
  campaignName: string;
  date: string;
  startTime: string;
  endTime: string;
  location: string;
  coordinatorName: string;
  coordinatorPhone: string;
  maxCapacity: number;
  organizationId: string;
  organizationName: string;
};

export type HospitalCollaboration = PendingHospitalRequest & {
  status: "PENDING" | "ACCEPTED" | "REJECTED";
};

export type DonorProfilePayload = {
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

export type VolunteerProfilePayload = {
  fullName: string;
  gender: "MALE" | "FEMALE" | "OTHER";
  homeTown: string;
  phoneNumber: string;
  educationalQualification: string;
  otherQualification: string;
  concerns: string;
};

export type DonorScreeningPayload = {
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

export type VolunteerRegistrationStatus = {
  campaignId: string;
  status: "REGISTERED" | "CANCELLED" | "SCREENING_REJECTED";
  updatedAt: string;
};

export type MyCampaignRegistrationRow = {
  campaignId: string;
  campaignName: string;
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

export async function createCampaign(payload: CampaignPayload) {
  return requestJson("/campaigns", {
    method: "POST",
    body: JSON.stringify(payload),
    auth: true,
  });
}

export async function changeHospital(campaignId: string, hospitalId: string) {
  return requestJson(`/campaigns/${campaignId}/change-hospital`, {
    method: "PATCH",
    body: JSON.stringify({ hospitalId }),
    auth: true,
  });
}

export async function getHospitalPendingRequests() {
  return requestJson<PendingHospitalRequest[]>(
    "/campaigns/hospital/pending-requests",
    { method: "GET", auth: true },
  );
}

export async function getHospitalCollaborations() {
  return requestJson<HospitalCollaboration[]>(
    "/campaigns/hospital/collaborations",
    { method: "GET", auth: true },
  );
}

export async function acceptHospitalRequest(attemptId: string) {
  return requestJson(
    `/campaigns/collaboration-attempts/${attemptId}/accept`,
    { method: "PATCH", auth: true },
  );
}

export async function rejectHospitalRequest(attemptId: string, reason: string) {
  return requestJson(
    `/campaigns/collaboration-attempts/${attemptId}/reject`,
    { method: "PATCH", body: JSON.stringify({ reason }), auth: true },
  );
}

export async function getPublishedCampaigns() {
  return requestJson<PublicCampaign[]>("/campaigns/public", { method: "GET" });
}

export async function getMyVolunteerRegistrationStatuses() {
  return requestJson<VolunteerRegistrationStatus[]>(
    "/campaigns/my-volunteer-registrations",
    { method: "GET", auth: true },
  );
}

export async function getMyCampaignRegistrations() {
  return requestJson<MyCampaignRegistrationRow[]>(
    "/campaigns/my-registrations",
    { method: "GET", auth: true },
  );
}

export async function registerForCampaign(
  campaignId: string,
  role: "DONOR" | "VOLUNTEER",
  notes: string,
  volunteerProfile?: VolunteerProfilePayload,
  donorProfile?: DonorProfilePayload,
  screening?: DonorScreeningPayload,
) {
  return requestJson(
    `/campaigns/${campaignId}/register`,
    {
      method: "POST",
      body: JSON.stringify({ role, notes, volunteerProfile, donorProfile, screening }),
      auth: true,
    },
  );
}

export async function submitTaskWork(campaignId: string, imageUris: string[]) {
  const formData = new FormData();
  
  imageUris.forEach((uri) => {
    const filename = uri.split("/").pop();
    const match = /\.(\w+)$/.exec(filename || "");
    const type = match ? `image/${match[1]}` : "image";
    formData.append("workImages", {
      uri,
      name: filename,
      type,
    } as any);
  });

  return requestJson(`/campaigns/${campaignId}/tasks/submit-work`, {
    method: "POST",
    body: formData as any,
    auth: true,
  });
}


