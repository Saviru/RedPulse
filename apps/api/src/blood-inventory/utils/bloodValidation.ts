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

export type AllowedBloodType = (typeof ALLOWED_BLOOD_TYPES)[number];
export type AllowedComponent = (typeof ALLOWED_COMPONENTS)[number];

const UNIT_ID_REGEX = /^UNIT-\d+$/;

const YMD_REGEX = /^(\d{4})-(\d{2})-(\d{2})$/;

export function isValidUnitId(unitId: string): boolean {
  return typeof unitId === "string" && UNIT_ID_REGEX.test(unitId.trim());
}

export function isValidYmd(s: unknown): s is string {
  if (typeof s !== "string") return false;
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

export function todayYmdLocal(): string {
  const t = new Date();
  const y = t.getFullYear();
  const mo = String(t.getMonth() + 1).padStart(2, "0");
  const d = String(t.getDate()).padStart(2, "0");
  return `${y}-${mo}-${d}`;
}

export function isAllowedBloodType(s: unknown): s is AllowedBloodType {
  return typeof s === "string" && (ALLOWED_BLOOD_TYPES as readonly string[]).includes(s);
}

export function isAllowedComponent(s: unknown): s is AllowedComponent {
  return typeof s === "string" && (ALLOWED_COMPONENTS as readonly string[]).includes(s);
}

export function isVolumeValid(volume: unknown): volume is number {
  return typeof volume === "number" && Number.isFinite(volume) && volume >= 450 && volume <= 500;
}

export function parseVolume(v: unknown): number | null {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string") {
    const n = Number(v.replace(/,/g, ".").trim());
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

export function isNonEmptyString(v: unknown): v is string {
  return typeof v === "string" && v.trim().length > 0;
}
