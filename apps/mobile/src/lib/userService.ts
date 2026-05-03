import { requestJson } from "./api";

export type PublicStats = {
  totalDonors: number;
  totalDonations: number;
  totalLivesSaved: number;
  totalVolunteers: number;
};

export async function getPublicStats() {
  return requestJson<PublicStats>("/users/stats", {
    method: "GET",
    auth: true,
  });
}

export default function Ignore() { return null; }
