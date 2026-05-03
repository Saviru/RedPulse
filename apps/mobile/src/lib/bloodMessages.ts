/** Keep in sync with `server/src/utils/bloodMessages.ts`. */
export const BLOOD_MSG = {
  fillAll: "Fill all the fields required",
  invalidFormat: "invalid format",
  invalidUnitId: "invalid unit id",
  hospitalUsernameNotFound: "Hospital username not found",
  expiryAfterCollection: "expiry date must be greater than collection date",
  collectionMustBeToday: "collectionDate must be the current date",
} as const;
