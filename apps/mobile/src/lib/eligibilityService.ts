import { requestJson } from "./api";

export type EligibilityResult = {
  isEligible: boolean;
  reasonsForIneligibility: string[];
  createdAt: string;
};

export async function getLatestEligibility() {
  try {
    const history = await requestJson<EligibilityResult[]>("/eligibility/history", {
      method: "GET",
      auth: true,
    });
    console.log("Eligibility History:", JSON.stringify(history));
    
    if (Array.isArray(history) && history.length > 0) {
      const latest = history[0];
      console.log("Latest Eligibility:", JSON.stringify(latest));
      return latest;
    }
    
    console.log("No eligibility history found.");
    return null;
  } catch (error) {
    console.error("Error fetching eligibility history:", error);
    return null;
  }
}


export default function Ignore() { return null; }
