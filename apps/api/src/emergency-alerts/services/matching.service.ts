import { DonorProfileModel } from "../../models/DonorProfile";
import type { BloodGroup, EmergencyUrgency, RankedDonor } from "../types/emergency.types";

export const compatibleMap: Record<BloodGroup, BloodGroup[]> = {
  "A+": ["A+", "A-", "O+", "O-"],
  "A-": ["A-", "O-"],
  "B+": ["B+", "B-", "O+", "O-"],
  "B-": ["B-", "O-"],
  "AB+": ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"],
  "AB-": ["A-", "B-", "AB-", "O-"],
  "O+": ["O+", "O-"],
  "O-": ["O-"],
};

const urgencyMultiplier: Record<EmergencyUrgency, number> = {
  critical: 1.5,
  high: 1.25,
  medium: 1,
};

const scoreDonor = (params: {
  patientBloodGroup: BloodGroup;
  donorBloodGroup: BloodGroup;
  sameLocation: boolean;
  eligibleNow: boolean;
  responseRate: number;
  urgencyLevel: EmergencyUrgency;
}): number => {
  const exact = params.patientBloodGroup === params.donorBloodGroup ? 50 : 0;
  const compatible =
    params.patientBloodGroup !== params.donorBloodGroup &&
    compatibleMap[params.patientBloodGroup].includes(params.donorBloodGroup)
      ? 30
      : 0;
  const location = params.sameLocation ? 20 : 0;
  const eligible = params.eligibleNow ? 25 : -100;
  const reliability = Math.round(params.responseRate * 15);

  return (exact + compatible + location + eligible + reliability) * urgencyMultiplier[params.urgencyLevel];
};

export const rankDonorsForEmergency = async (input: {
  patientBloodGroup: BloodGroup;
  urgencyLevel: EmergencyUrgency;
  locationText: string;
  limit?: number;
}): Promise<RankedDonor[]> => {
  type DonorCandidate = {
    donorId: string;
    bloodGroup: BloodGroup;
    locationText: string;
    isEligibleNow: boolean;
    responseRate?: number;
  };

  const compatible = compatibleMap[input.patientBloodGroup];

  const donors = await DonorProfileModel.find({
    active: true,
    bloodGroup: { $in: compatible },
  }).lean<DonorCandidate[]>();

  const ranked: RankedDonor[] = donors
    .map((donor: DonorCandidate): RankedDonor => ({
      donorId: donor.donorId,
      bloodGroup: donor.bloodGroup as BloodGroup,
      score: scoreDonor({
        patientBloodGroup: input.patientBloodGroup,
        donorBloodGroup: donor.bloodGroup as BloodGroup,
        sameLocation: donor.locationText.toLowerCase() === input.locationText.toLowerCase(),
        eligibleNow: donor.isEligibleNow,
        responseRate: donor.responseRate ?? 0.5,
        urgencyLevel: input.urgencyLevel,
      }),
    }))
    .filter((item: RankedDonor) => item.score > 0)
    .sort((left: RankedDonor, right: RankedDonor) => right.score - left.score);

  return ranked.slice(0, input.limit ?? 50);
};
