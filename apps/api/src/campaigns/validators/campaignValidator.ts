import { z } from "zod";

export const CreateCampaignSchema = z.object({
  hospitalId: z.string().min(1),
  name: z.string().min(2),
  date: z.coerce.date(),
  startTime: z.coerce.date(),
  endTime: z.coerce.date(),
  location: z.string().min(2),
  coordinatorName: z.string().min(2),
  coordinatorPhone: z.string().min(5),
  maxCapacity: z.coerce.number().int().min(1),
  description: z.string().optional().default(""),
});

export const ChangeHospitalSchema = z.object({
  hospitalId: z.string().min(1),
});

export const RegisterCampaignSchema = z.object({
  role: z.enum(["DONOR", "VOLUNTEER"]),
  notes: z.string().optional().default(""),
  volunteerProfile: z
    .object({
      fullName: z.string().trim().min(2),
      gender: z.enum(["MALE", "FEMALE", "OTHER"]),
      homeTown: z.string().trim().min(2),
      phoneNumber: z.string().trim().min(5),
      educationalQualification: z.string().trim().min(2),
      otherQualification: z.string().optional().default(""),
      concerns: z.string().optional().default(""),
    })
    .optional(),
  donorProfile: z
    .object({
      bloodType: z.string().trim().min(1),
      fullName: z.string().trim().min(2),
      gender: z.enum(["MALE", "FEMALE", "OTHER"]),
      phoneNumber: z.string().trim().min(5),
      age: z.coerce.number().int().min(18).max(120),
      weightKg: z.coerce.number().min(1).optional(),
      monthsSinceLastDonation: z.coerce.number().int().min(0),
      hasValidId: z.boolean(),
      isPregnantOrBreastfeeding: z.boolean(),
      hasSeriousMedicalIllness: z.boolean(),
      hasRiskBehavior: z.boolean(),
    })
    .optional(),
  screening: z
    .object({
      recentRiskFactors: z.object({
        tattooIn12Months: z.boolean(),
        earPiercingIn12Months: z.boolean(),
        dentalExtractionIn1Week: z.boolean(),
        imprisonedIn12Months: z.boolean(),
        pregnantOrBreastfeedingInLast12Months: z.boolean(),
      }),
      medicalHistory: z.object({
        heartDisease: z.boolean(),
        diabetes: z.boolean(),
        sexuallyTransmittedDiseases: z.boolean(),
        lungDisease: z.boolean(),
        allergicDisease: z.boolean(),
        epilepsy: z.boolean(),
        jaundice: z.boolean(),
        faintingSpells: z.boolean(),
        cancer: z.boolean(),
        hepatitisBC: z.boolean(),
        typhoidIn2Years: z.boolean(),
        tuberculosisIn2Years: z.boolean(),
        kidneyDisease: z.boolean(),
        bleedingTendency: z.boolean(),
        malariaIn12Months: z.boolean(),
        dengueIn6Months: z.boolean(),
        chickenpoxRubellaDiarrhoeaIn1Month: z.boolean(),
      }),
      recentMedicationsOrVaccines: z.object({
        antibioticsIn1Week: z.boolean(),
        aspirinIn1Week: z.boolean(),
        alcoholIn3Days: z.boolean(),
        steroids: z.boolean(),
        vaccinationsIn12Months: z.boolean(),
      }),
      surgeryInLast6Months: z.boolean(),
      travelToMalariaEndemicInLast3Years: z.boolean(),
      foreignTravelInLast3Months: z.boolean(),
    })
    .optional(),
});

export const RejectCollaborationSchema = z.object({
  reason: z.string().min(3),
});
