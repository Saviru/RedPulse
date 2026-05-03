import { DonorProfileModel } from "../../models/DonorProfile";
import { HospitalProfileModel } from "../../models/HospitalProfile";

const toMeters = (radiusKm: number): number => radiusKm * 1000;

export const getNearbyDonors = async (params: {
  lat: number;
  lng: number;
  radiusKm: number;
  bloodGroup?: string;
  bloodGroups?: string[];
  eligibleOnly?: boolean;
}) => {
  const query: Record<string, unknown> = {
    active: true,
    location: {
      $near: {
        $geometry: {
          type: "Point",
          coordinates: [params.lng, params.lat],
        },
        $maxDistance: toMeters(params.radiusKm),
      },
    },
  };

  if (params.bloodGroups && params.bloodGroups.length > 0) {
    query.bloodGroup = { $in: params.bloodGroups };
  } else if (params.bloodGroup) {
    query.bloodGroup = params.bloodGroup;
  }
  
  if (params.eligibleOnly) query.isEligibleNow = true;

  return DonorProfileModel.find(query).limit(200).lean();
};

export const getNearbyHospitals = async (params: {
  lat: number;
  lng: number;
  radiusKm: number;
}) => {
  return HospitalProfileModel.find({
    active: true,
    location: {
      $near: {
        $geometry: {
          type: "Point",
          coordinates: [params.lng, params.lat],
        },
        $maxDistance: toMeters(params.radiusKm),
      },
    },
  })
    .limit(200)
    .lean();
};
