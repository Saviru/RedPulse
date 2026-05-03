export interface QuestionnairePayload {
  chronicDisease: boolean;
  recentSurgery: boolean;
  recentTravel: boolean;
  feverOrInfection: boolean;
  recentTattoo: boolean;
  pregnancy: boolean;
  weightAbove50: boolean;
  
  hemoglobinLevel?: number;
  bloodPressureSystolic?: number;
  bloodPressureDiastolic?: number;
  
  malariaEndemicReturnDate?: string;
  foreignTravelReturnDate?: string;
}

export interface EligibilityResult {
  isEligible: boolean;
  reasons: string[];
  metrics?: {
    hbResult?: number | null;
    bpResult?: string | null;
  };
}
