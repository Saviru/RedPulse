import { APP_AUTH } from "@/apps/mobile/src/constants/api";
import { apiRequest } from "@/apps/mobile/src/services/apiClient";

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
  return apiRequest<HospitalOption[]>("/organizations/hospitals", { method: "GET" });
}

export async function getMyLatestCampaignOverview() {
  return apiRequest<LatestCampaignOverview>(
    "/organizations/campaigns/latest-overview",
    { method: "GET" },
    APP_AUTH.organization,
  );
}

export async function getMyCampaigns() {
  return apiRequest<MyCampaignItem[]>(
    "/organizations/campaigns/my",
    { method: "GET" },
    APP_AUTH.organization,
  );
}

export async function getMyCampaignOverviewById(campaignId: string) {
  return apiRequest<LatestCampaignOverview>(
    `/organizations/campaigns/${campaignId}/overview`,
    { method: "GET" },
    APP_AUTH.organization,
  );
}

export async function rejectCampaignVolunteer(
  campaignId: string,
  registrationId: string,
  reason: string,
) {
  return apiRequest(
    `/organizations/campaigns/${campaignId}/volunteers/${registrationId}/reject`,
    { method: "PATCH", body: JSON.stringify({ reason }) },
    APP_AUTH.organization,
  );
}

export async function assignVolunteerTask(
  campaignId: string,
  registrationId: string,
  body: { title: string; description: string; points: number },
) {
  return apiRequest<{ registrationId: string; campaignId: string; assignedTask: unknown }>(
    `/organizations/campaigns/${campaignId}/volunteers/${registrationId}/task`,
    { method: "PATCH", body: JSON.stringify(body) },
    APP_AUTH.organization,
  );
}

export async function markVolunteerAttendance(
  campaignId: string,
  registrationId: string,
  status: "ATTENDED" | "ABSENT",
) {
  return apiRequest<{ registrationId: string; campaignId: string; taskAttendance: unknown }>(
    `/organizations/campaigns/${campaignId}/volunteers/${registrationId}/attendance`,
    { method: "PATCH", body: JSON.stringify({ status }) },
    APP_AUTH.organization,
  );
}

export async function getMyNotifications() {
  return apiRequest<AppNotification[]>(
    "/organizations/notifications/me",
    { method: "GET" },
    APP_AUTH.user,
  );
}

export async function getHospitalVerifiedDonors() {
  return apiRequest<HospitalVerifiedDonor[]>(
    "/organizations/hospitals/verified-donors",
    { method: "GET" },
    APP_AUTH.hospital,
  );
}

export async function getHospitalDonorDonationDetails(registrationId: string) {
  return apiRequest<DonorDonationDetails>(
    `/organizations/hospitals/verified-donors/${registrationId}`,
    { method: "GET" },
    APP_AUTH.hospital,
  );
}

export async function verifyDonorPrecheck(registrationId: string, bodyWeightKg: number) {
  return apiRequest<DonorDonationDetails["process"]>(
    `/organizations/hospitals/verified-donors/${registrationId}/precheck`,
    { method: "PATCH", body: JSON.stringify({ bodyWeightKg }) },
    APP_AUTH.hospital,
  );
}

export async function verifyDonorDoctor(
  registrationId: string,
  decision: "ACCEPT" | "REJECT",
  notes: string,
) {
  return apiRequest<DonorDonationDetails["process"]>(
    `/organizations/hospitals/verified-donors/${registrationId}/doctor-verification`,
    { method: "PATCH", body: JSON.stringify({ decision, notes }) },
    APP_AUTH.hospital,
  );
}

export async function verifyDonorFinal(
  registrationId: string,
  haemoglobinStatus: "FLOATED" | "NOT_FLOATED",
) {
  return apiRequest<DonorDonationDetails["process"]>(
    `/organizations/hospitals/verified-donors/${registrationId}/final-verification`,
    { method: "PATCH", body: JSON.stringify({ haemoglobinStatus }) },
    APP_AUTH.hospital,
  );
}

export async function completeDonorDonation(registrationId: string) {
  return apiRequest<DonorDonationDetails["process"]>(
    `/organizations/hospitals/verified-donors/${registrationId}/complete-donation`,
    { method: "PATCH" },
    APP_AUTH.hospital,
  );
}
