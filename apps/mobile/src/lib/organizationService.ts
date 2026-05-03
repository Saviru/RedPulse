import { requestJson } from "./api";

export type HospitalOption = {
  id: string;
  name: string;
};

export type MyCampaignItem = {
  id: string;
  name: string;
  date: string;
  location: string;
  status: "PENDING_HOSPITAL" | "PUBLISHED" | "HOSPITAL_REJECTED" | "CANCELLED";
  maxCapacity: number;
  registeredDonors: number;
  volunteers: number;
};

export type LatestCampaignOverview = {
  campaign: null | {
    id: string;
    name: string;
    status: string;
    location: string;
    updatedAt: string;
  };
  hospital: null | {
    id: string;
    name: string;
    address: string;
    status: "accepted" | "pending" | "rejected";
  };
  crew: {
    id: string;
    userId: string;
    name: string;
    role: string;
    points: number;
    volunteerPublicId?: string;
    assignedTask?: null | {
      title: string;
      description: string;
      points: number;
      assignedAt: string | null;
    };
    taskAttendance?: null | {
      status: "ATTENDED" | "ABSENT";
      markedAt: string | null;
    };
    homeTown?: string;
    phoneNumber?: string;
    educationalQualification?: string;
    otherQualification?: string;
    concerns?: string;
  }[];
};

export type AppNotification = {
  _id: string;
  actorType: "ORGANIZATION" | "HOSPITAL" | "USER";
  actorId: string;
  type: string;
  title: string;
  message: string;
  meta: Record<string, unknown>;
  isRead: boolean;
  createdAt: string;
};

export type HospitalVerifiedDonor = {
  id: string;
  campaignId: string;
  campaignName: string;
  userId: string;
  donorPublicId: string | null;
  fullName: string;
  bloodType: string;
  phoneNumber: string;
  age: number | null;
  gender: string | null;
  donationStatus: string;
  createdAt: string;
};

export type DonorDonationDetails = {
  registrationId: string;
  campaignId: string;
  campaignName: string;
  donor: {
    name: string;
    email: string;
    phoneNumber: string;
    bloodType: string;
    age: number | null;
    gender: string | null;
    lastDonationInfo: string;
  };
  process: {
    donationStatus: string;
    precheck: null | {
      bodyWeightKg: number | null;
      checkedAt: string | null;
      result: "VERIFIED" | "REJECTED" | null;
      reason: string;
    };
    doctorVerification: null | {
      decision: "ACCEPT" | "REJECT" | null;
      notes: string;
      verifiedAt: string | null;
    };
    finalVerification: null | {
      haemoglobinStatus: "FLOATED" | "NOT_FLOATED" | null;
      verifiedAt: string | null;
    };
    donationCompletedAt: string | null;
  };
};

export async function getHospitals() {
  return requestJson<HospitalOption[]>("/organizations/hospitals", { method: "GET" });
}

export async function getOrgDashboard() {
  return requestJson<{
    metrics: { activeCamps: number; volunteers: number; donations: number };
    latestCampaign: MyCampaignItem | null;
    upcomingCamps: MyCampaignItem[];
  }>("/organizations/dashboard", { method: "GET", auth: true });
}

export async function getMyLatestCampaignOverview() {
  return requestJson<LatestCampaignOverview>(
    "/organizations/campaigns/latest-overview",
    { method: "GET", auth: true },
  );
}

export async function getMyCampaigns() {
  return requestJson<MyCampaignItem[]>(
    "/organizations/campaigns/my",
    { method: "GET", auth: true },
  );
}

export async function getMyCampaignOverviewById(campaignId: string) {
  return requestJson<LatestCampaignOverview>(
    `/organizations/campaigns/${campaignId}/overview`,
    { method: "GET", auth: true },
  );
}

export async function rejectCampaignVolunteer(
  campaignId: string,
  registrationId: string,
  reason: string,
) {
  return requestJson(
    `/organizations/campaigns/${campaignId}/volunteers/${registrationId}/reject`,
    { method: "PATCH", body: JSON.stringify({ reason }), auth: true },
  );
}

export async function assignVolunteerTask(
  campaignId: string,
  registrationId: string,
  body: { title: string; description: string; points: number },
) {
  return requestJson<{ registrationId: string; campaignId: string; assignedTask: unknown }>(
    `/organizations/campaigns/${campaignId}/volunteers/${registrationId}/task`,
    { method: "PATCH", body: JSON.stringify(body), auth: true },
  );
}

export async function markVolunteerAttendance(
  campaignId: string,
  registrationId: string,
  status: "ATTENDED" | "ABSENT",
) {
  return requestJson<{ registrationId: string; campaignId: string; taskAttendance: unknown }>(
    `/organizations/campaigns/${campaignId}/volunteers/${registrationId}/attendance`,
    { method: "PATCH", body: JSON.stringify({ status }), auth: true },
  );
}

export async function getMyNotifications() {
  return requestJson<AppNotification[]>(
    "/organizations/notifications/me",
    { method: "GET", auth: true },
  );
}

export async function getHospitalVerifiedDonors() {
  return requestJson<HospitalVerifiedDonor[]>(
    "/organizations/hospitals/verified-donors",
    { method: "GET", auth: true },
  );
}

export async function getHospitalDonorDonationDetails(registrationId: string) {
  return requestJson<DonorDonationDetails>(
    `/organizations/hospitals/verified-donors/${registrationId}`,
    { method: "GET", auth: true },
  );
}

export async function verifyDonorPrecheck(registrationId: string, bodyWeightKg: number) {
  return requestJson<DonorDonationDetails["process"]>(
    `/organizations/hospitals/verified-donors/${registrationId}/precheck`,
    { method: "PATCH", body: JSON.stringify({ bodyWeightKg }), auth: true },
  );
}

export async function verifyDonorDoctor(
  registrationId: string,
  decision: "ACCEPT" | "REJECT",
  notes: string,
) {
  return requestJson<DonorDonationDetails["process"]>(
    `/organizations/hospitals/verified-donors/${registrationId}/doctor-verification`,
    { method: "PATCH", body: JSON.stringify({ decision, notes }), auth: true },
  );
}

export async function verifyDonorFinal(
  registrationId: string,
  haemoglobinStatus: "FLOATED" | "NOT_FLOATED",
) {
  return requestJson<DonorDonationDetails["process"]>(
    `/organizations/hospitals/verified-donors/${registrationId}/final-verification`,
    { method: "PATCH", body: JSON.stringify({ haemoglobinStatus }), auth: true },
  );
}

export async function completeDonorDonation(registrationId: string) {
  return requestJson<DonorDonationDetails["process"]>(
    `/organizations/hospitals/verified-donors/${registrationId}/complete-donation`,
    { method: "PATCH", auth: true },
  );
}
