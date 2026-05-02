export type BloodGroup = "A+" | "A-" | "B+" | "B-" | "AB+" | "AB-" | "O+" | "O-";

export type EmergencyUrgency = "critical" | "high" | "medium";

export interface RankedDonor {
  donorId: string;
  score: number;
  bloodGroup: BloodGroup;
}
