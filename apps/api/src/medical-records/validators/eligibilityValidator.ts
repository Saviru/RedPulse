import { QuestionnairePayload } from '../types/eligibilityTypes';

export const validateEligibilityInput = (data: any): { isValid: boolean, error?: string, parsedData?: QuestionnairePayload } => {
  if (typeof data !== 'object' || data === null) {
    return { isValid: false, error: 'Invalid payload block. Expected object.' };
  }

  const requiredBooleans = ['chronicDisease', 'recentSurgery', 'recentTravel', 'feverOrInfection', 'recentTattoo', 'pregnancy', 'weightAbove50'];
  for (const field of requiredBooleans) {
    const value = data[field];
    // Handle both boolean and string representations (FormData from frontend)
    if (typeof value === 'boolean') {
      // Already a boolean, keep as is
      data[field] = value;
    } else if (typeof value === 'string') {
      // Convert string to boolean
      if (value === 'true') {
        data[field] = true;
      } else if (value === 'false') {
        data[field] = false;
      } else {
        return { isValid: false, error: `Field ${field} is missing or must be a boolean.` };
      }
    } else {
      return { isValid: false, error: `Field ${field} is missing or must be a boolean.` };
    }
  }

  // Handle numeric fields that might come as strings from FormData
  if (data.hemoglobinLevel !== undefined) {
    if (typeof data.hemoglobinLevel === 'string') {
      const num = Number(data.hemoglobinLevel);
      if (isNaN(num)) {
        return { isValid: false, error: 'Hemoglobin level must be a number.' };
      }
      data.hemoglobinLevel = num;
    } else if (typeof data.hemoglobinLevel !== 'number') {
      return { isValid: false, error: 'Hemoglobin level must be a number.' };
    }
  }
  
  if (data.bloodPressureSystolic !== undefined) {
    if (typeof data.bloodPressureSystolic === 'string') {
      const num = Number(data.bloodPressureSystolic);
      if (isNaN(num)) {
        return { isValid: false, error: 'Systolic blood pressure must be a number.' };
      }
      data.bloodPressureSystolic = num;
    } else if (typeof data.bloodPressureSystolic !== 'number') {
      return { isValid: false, error: 'Systolic blood pressure must be a number.' };
    }
  }
  
  if (data.bloodPressureDiastolic !== undefined) {
    if (typeof data.bloodPressureDiastolic === 'string') {
      const num = Number(data.bloodPressureDiastolic);
      if (isNaN(num)) {
        return { isValid: false, error: 'Diastolic blood pressure must be a number.' };
      }
      data.bloodPressureDiastolic = num;
    } else if (typeof data.bloodPressureDiastolic !== 'number') {
      return { isValid: false, error: 'Diastolic blood pressure must be a number.' };
    }
  }

  return { isValid: true, parsedData: data as QuestionnairePayload };
};
