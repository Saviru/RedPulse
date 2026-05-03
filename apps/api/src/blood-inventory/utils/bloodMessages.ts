/** User-facing validation copy (keep in sync with `lib/bloodValidation.ts`). */
export const BLOOD_MSG = {
  fillAll: "Fill all the fields required",
  invalidFormat: "invalid format",
  invalidUnitId: "invalid unit id",
  hospitalUsernameNotFound: "Hospital username not found",
  expiryAfterCollection: "expiry date must be greater than collection date",
  collectionMustBeToday: "collectionDate must be the current date",
} as const;
