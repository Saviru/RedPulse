import { BLOOD_MSG } from "./bloodMessages";

export const ALLOWED_BLOOD_TYPES = [
  "A+",
  "A-",
  "B+",
  "B-",
  "O+",
  "O-",
  "AB+",
  "AB-",
] as const;

export const ALLOWED_COMPONENTS = [
  "Whole blood",
  "Red Blood Cells",
  "Plasma",
  "Platelets",
] as const;

const UNIT_ID_REGEX = /^UNIT-\d+$/;

const YMD_REGEX = /^(\d{4})-(\d{2})-(\d{2})$/;

export function todayYmdLocal(): string {
  const t = new Date();
  const y = t.getFullYear();
  const mo = String(t.getMonth() + 1).padStart(2, "0");
  const d = String(t.getDate()).padStart(2, "0");
  return `${y}-${mo}-${d}`;
}

export function isValidUnitId(unitId: string): boolean {
  return typeof unitId === "string" && UNIT_ID_REGEX.test(unitId.trim());
}

export function isValidYmd(s: string): boolean {
  const t = s.trim();
  const m = t.match(YMD_REGEX);
  if (!m) return false;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  const dt = new Date(y, mo - 1, d);
  return dt.getFullYear() === y && dt.getMonth() === mo - 1 && dt.getDate() === d;
}

export function ymdToLocalDate(ymd: string): Date {
  const m = ymd.trim().match(YMD_REGEX);
  if (!m) return new Date(NaN);
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  return new Date(y, mo - 1, d);
}

export function isAllowedBloodType(s: string): boolean {
  return (ALLOWED_BLOOD_TYPES as readonly string[]).includes(s);
}

export function isAllowedComponent(s: string): boolean {
  return (ALLOWED_COMPONENTS as readonly string[]).includes(s);
}

export function parseVolume(v: string): number | null {
  const n = Number(v.replace(/,/g, ".").trim());
  return Number.isFinite(n) ? n : null;
}

export function isVolumeValid(vol: number): boolean {
  return vol >= 450 && vol <= 500;
}

/**
 * Whole days left from now (local) until an entered YYYY-MM-DD expiry date,
 * using the *current time* as the time component (to match backend datetime creation).
 */
export function calculateDaysLeftFromYmd(expiryYmd: string): number | null {
  if (!isValidYmd(expiryYmd)) return null;
  const now = new Date();
  const exp = ymdToLocalDate(expiryYmd);
  // Apply current time so frontend preview matches backend datetime creation.
  exp.setHours(now.getHours(), now.getMinutes(), now.getSeconds(), now.getMilliseconds());
  const diffMs = exp.getTime() - now.getTime();
  const dayMs = 1000 * 60 * 60 * 24;
  return Math.floor(diffMs / dayMs);
}

export type BloodFormValidationResult =
  | { ok: true }
  | { ok: false; message: string };

export function validateBloodUnitForm(input: {
  unitId: string;
  bloodType: string;
  component: string;
  volume: string;
  collectionDate: string;
  expiryDate: string;
  requireCollectionIsToday: boolean;
}): BloodFormValidationResult {
  const { unitId, bloodType, component, volume, collectionDate, expiryDate, requireCollectionIsToday } =
    input;

  if (
    !unitId.trim() ||
    !bloodType.trim() ||
    !component.trim() ||
    !volume.trim() ||
    !collectionDate.trim() ||
    !expiryDate.trim()
  ) {
    return { ok: false, message: BLOOD_MSG.fillAll };
  }
  if (!isValidUnitId(unitId)) {
    return { ok: false, message: BLOOD_MSG.invalidFormat };
  }
  if (!isAllowedBloodType(bloodType)) {
    return { ok: false, message: BLOOD_MSG.invalidFormat };
  }
  if (!isAllowedComponent(component)) {
    return { ok: false, message: BLOOD_MSG.invalidFormat };
  }
  const vol = parseVolume(volume);
  if (vol === null) return { ok: false, message: BLOOD_MSG.invalidFormat };
  if (!isVolumeValid(vol)) return { ok: false, message: BLOOD_MSG.invalidFormat };


  if (!isValidYmd(collectionDate) || !isValidYmd(expiryDate)) {
    return { ok: false, message: BLOOD_MSG.invalidFormat };
  }


  if (requireCollectionIsToday && collectionDate.trim() !== todayYmdLocal()) {
    return { ok: false, message: BLOOD_MSG.collectionMustBeToday };
  }



  const coll = ymdToLocalDate(collectionDate.trim());
  const exp = ymdToLocalDate(expiryDate.trim());
  if (exp <= coll) {
    return { ok: false, message: BLOOD_MSG.expiryAfterCollection };
  }
  return { ok: true };
}
