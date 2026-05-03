import { QuestionnairePayload } from '../types/eligibilityTypes';

export const validateEligibilityInput = (data: any): { isValid: boolean, error?: string, parsedData?: QuestionnairePayload } => {
  if (typeof data !== 'object' || data === null) {
    return { isValid: false, error: 'Invalid payload block. Expected object.' };
  }

  const requiredBooleans = ['chronicDisease', 'recentSurgery', 'recentTravel', 'feverOrInfection', 'recentTattoo', 'pregnancy', 'weightAbove50'];
  for (const field of requiredBooleans) {
    if (typeof data[field] !== 'boolean') {
      return { isValid: false, error: `Field ${field} is missing or must be a boolean.` };
    }
  }

  if (data.hemoglobinLevel !== undefined && typeof data.hemoglobinLevel !== 'number') {
    return { isValid: false, error: 'Hemoglobin level must be a number.' };
  }
  if (data.bloodPressureSystolic !== undefined && typeof data.bloodPressureSystolic !== 'number') {
    return { isValid: false, error: 'Systolic blood pressure must be a number.' };
  }
  if (data.bloodPressureDiastolic !== undefined && typeof data.bloodPressureDiastolic !== 'number') {
    return { isValid: false, error: 'Diastolic blood pressure must be a number.' };
  }

  return { isValid: true, parsedData: data as QuestionnairePayload };
};
