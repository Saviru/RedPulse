import { QuestionnairePayload, EligibilityResult } from '../types/eligibilityTypes';
import { DonationRecord } from '../models/DonationRecord';

export class EligibilityService {
  public static async evaluateEligibility(data: QuestionnairePayload, userId?: string): Promise<EligibilityResult> {
    const reasons: string[] = [];

    // 1. Boolean absolute rejections
    if (data.chronicDisease) reasons.push("Has chronic diseases");
    if (data.recentSurgery) reasons.push("Had recent surgery");
    if (data.recentTravel) reasons.push("Recent travel abroad (past 3 months)");
    if (data.feverOrInfection) reasons.push("Has fever or infection");
    if (data.recentTattoo) reasons.push("Got a recent tattoo");
    if (data.pregnancy) reasons.push("Currently pregnant");
    if (!data.weightAbove50) reasons.push("Weight must be above 50 kg");

    // 2. Numeric Boundaries
    if (data.hemoglobinLevel !== undefined) {
      if (data.hemoglobinLevel < 12.5) {
        reasons.push(`Hemoglobin level (${data.hemoglobinLevel} g/dL) is too low. Required: ≥ 12.5`);
      } else if (data.hemoglobinLevel > 20) {
        reasons.push(`Hemoglobin level (${data.hemoglobinLevel} g/dL) is too high. Acceptable max: 20`);
      }
    }

    if (data.bloodPressureSystolic !== undefined || data.bloodPressureDiastolic !== undefined) {
      const sys = data.bloodPressureSystolic;
      const dia = data.bloodPressureDiastolic;
      if (sys === undefined || dia === undefined) {
        reasons.push(`Blood pressure must include both systolic and diastolic values`);
      } else {
        if (sys < 90 || sys > 180) {
          reasons.push(`Systolic blood pressure (${sys} mmHg) is out of bounds (90-180)`);
        }
        if (dia < 50 || dia > 100) {
          reasons.push(`Diastolic blood pressure (${dia} mmHg) is out of bounds (50-100)`);
        }
      }
    }

    // 3. Date constraints
    const getMonthsDifference = (dateString: string): number => {
      const pastDate = new Date(dateString);
      const today = new Date();
      return (today.getFullYear() - pastDate.getFullYear()) * 12 + (today.getMonth() - pastDate.getMonth());
    };

    if (data.malariaEndemicReturnDate) {
      if (getMonthsDifference(data.malariaEndemicReturnDate) < 36) {
        reasons.push(`Malaria-endemic country return date is less than 3 years ago`);
      }
    }

    if (data.foreignTravelReturnDate) {
      if (getMonthsDifference(data.foreignTravelReturnDate) < 3) {
        reasons.push(`Foreign travel return date is less than 3 months ago`);
      }
    }

    // 4. Check last donation date (must be at least 4 months ago)
    if (userId) {
      try {
        const lastDonation = await DonationRecord.findOne({ 
          userId: userId, 
          status: 'Completed' 
        }).sort({ donationDate: -1 });
        
        if (lastDonation) {
          const monthsSinceLastDonation = getMonthsDifference(lastDonation.donationDate.toISOString());
          if (monthsSinceLastDonation < 4) {
            reasons.push("Your previous donation is less than 4 months");
          }
        }
      } catch (error) {
        console.error('Error checking donation history:', error);
        // Don't fail eligibility check if database query fails
      }
    }

    return {
      isEligible: reasons.length === 0,
      reasons,
      metrics: {
        hbResult: data.hemoglobinLevel || null,
        bpResult: (data.bloodPressureSystolic && data.bloodPressureDiastolic) ? `${data.bloodPressureSystolic}/${data.bloodPressureDiastolic}` : null,
      }
    };
  }
}
