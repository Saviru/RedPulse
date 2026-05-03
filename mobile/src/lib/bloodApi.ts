import { API_BASE_URL } from "./api";

export type BloodUnitResponse = {
  id: string;
  unitId: string;
  username: string;
  bloodType: string;
  component: string;
  volume: number;
  // New datetime fields
  collectionDateTime: string;
  expiryDateTime: string;
  /** formatted as "12:30 PM" (local) */
  formattedExpiryTime: string;

  // Legacy fields kept for backward compatibility (can be removed later)
  collectionDate?: string;
  expiryDate?: string;
  createdAt: string;
  daysLeft: number;
  status: string | null;
  expiryAlert: boolean;
  /** e.g. "10d left" when status is Expiring Soon */
  daysLeftLabel: string | null;
  lowStockAlert: boolean;
};

export type DashboardResponse = {
  totalUnits: number;
  expiringSoonCount: number;
  lowStockBloodTypes: { bloodType: string; count: number; stockLevel: string }[];
  wastagePercent: number;
};

async function parseError(res: Response): Promise<string> {
  const text = await res.text();
  try {
    const j = JSON.parse(text) as { message?: string };
    const msg = j.message ?? text;
    return msg || res.statusText;
  } catch {
    return text || res.statusText;
  }
}

export async function createBloodUnit(payload: {
  username: string;
  bloodType: string;
  component: string;
  volume: number;
  /** YYYY-MM-DD */
  collectionDate: string;
  /** YYYY-MM-DD */
  expiryDate: string;
  packetImageUri?: string;
}): Promise<BloodUnitResponse> {
  const formData = new FormData();
  Object.entries(payload).forEach(([key, value]) => {
    if (value !== undefined && key !== 'packetImageUri') {
      formData.append(key, String(value));
    }
  });

  if (payload.packetImageUri) {
    const filename = payload.packetImageUri.split("/").pop();
    const match = /\.(\w+)$/.exec(filename || "");
    const type = match ? `image/${match[1]}` : "image";
    formData.append("packetImage", {
      uri: payload.packetImageUri,
      name: filename,
      type,
    } as any);
  }

  const res = await fetch(`${API_BASE_URL}/blood`, {
    method: "POST",
    body: formData as any,
  });
  if (!res.ok) {
    throw new Error(await parseError(res));
  }
  return res.json() as Promise<BloodUnitResponse>;
}

export async function fetchHospitalUsernames(): Promise<string[]> {
  const res = await fetch(`${API_BASE_URL}/blood/hospital-usernames`);
  if (!res.ok) {
    throw new Error(await parseError(res));
  }
  const data = (await res.json()) as { usernames?: unknown };
  if (!Array.isArray(data.usernames)) return [];
  return data.usernames.filter((u): u is string => typeof u === "string");
}

export async function fetchNextBloodUnitId(): Promise<string> {
  const res = await fetch(`${API_BASE_URL}/blood/next-unit-id`);
  if (!res.ok) {
    throw new Error(await parseError(res));
  }
  const data = (await res.json()) as { unitId?: string };
  if (!data.unitId || typeof data.unitId !== "string") {
    throw new Error("Invalid next unit id response");
  }
  return data.unitId;
}

export async function fetchDashboard(): Promise<DashboardResponse> {
  const res = await fetch(`${API_BASE_URL}/blood/dashboard`);
  if (!res.ok) {
    throw new Error(await parseError(res));
  }
  return res.json() as Promise<DashboardResponse>;
}

export async function fetchBloodUnits(): Promise<BloodUnitResponse[]> {
  const res = await fetch(`${API_BASE_URL}/blood`);
  if (!res.ok) {
    throw new Error(await parseError(res));
  }
  return res.json() as Promise<BloodUnitResponse[]>;
}

/** All units including expired (wastage / analytics). */
export async function fetchAllBloodRecords(): Promise<BloodUnitResponse[]> {
  const res = await fetch(`${API_BASE_URL}/blood/all`);
  if (!res.ok) {
    throw new Error(await parseError(res));
  }
  return res.json() as Promise<BloodUnitResponse[]>;
}

export async function fetchBloodAlerts(): Promise<BloodUnitResponse[]> {
  const res = await fetch(`${API_BASE_URL}/blood/alerts`);
  if (!res.ok) {
    throw new Error(await parseError(res));
  }
  return res.json() as Promise<BloodUnitResponse[]>;
}

export async function fetchBloodById(id: string): Promise<BloodUnitResponse> {
  const res = await fetch(`${API_BASE_URL}/blood/${encodeURIComponent(id)}`);
  if (!res.ok) {
    throw new Error(await parseError(res));
  }
  return res.json() as Promise<BloodUnitResponse>;
}

export async function updateBloodUnit(
  id: string,
  payload: {
    username: string;
    unitId: string;
    bloodType: string;
    component: string;
    volume: number;
    /** YYYY-MM-DD */
    collectionDate: string;
    /** YYYY-MM-DD */
    expiryDate: string;
  }
): Promise<BloodUnitResponse> {
  const res = await fetch(`${API_BASE_URL}/blood/${encodeURIComponent(id)}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    throw new Error(await parseError(res));
  }
  return res.json() as Promise<BloodUnitResponse>;
}

export async function deleteBloodUnit(id: string): Promise<void> {
  if (!id?.trim()) {
    throw new Error("Missing unit id");
  }
  const sid = encodeURIComponent(id.trim());
  const res = await fetch(`${API_BASE_URL}/blood/${sid}/delete`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: "{}",
  });
  if (!res.ok) {
    throw new Error(await parseError(res));
  }
  try {
    await res.json();
  } catch {
    /* ignore empty body */
  }
}

/** Client-side counts per blood type (FIFO order preserved in list endpoints). */
export function aggregateStockByBloodType(
  units: BloodUnitResponse[]
): { bloodType: string; count: number }[] {
  const map = new Map<string, number>();
  for (const u of units) {
    map.set(u.bloodType, (map.get(u.bloodType) ?? 0) + 1);
  }
  return Array.from(map.entries())
    .map(([bloodType, count]) => ({ bloodType, count }))
    .sort((a, b) => a.bloodType.localeCompare(b.bloodType));
}

const TYPE_LABELS: Record<string, string> = {
  "O-": "O Negative",
  "O+": "O Positive",
  "A-": "A Negative",
  "A+": "A Positive",
  "B-": "B Negative",
  "B+": "B Positive",
  "AB-": "AB Negative",
  "AB+": "AB Positive",
};

export function bloodTypeDisplayName(code: string): string {
  return TYPE_LABELS[code] ?? code;
}

/** Local calendar YYYY-MM-DD from an ISO date string (for form fields). */
export function isoDateToLocalYmd(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Local time "12:30 PM" from an ISO datetime string. */
export function isoDateTimeToLocalTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const hours24 = d.getHours();
  const minutes = String(d.getMinutes()).padStart(2, "0");
  const suffix = hours24 >= 12 ? "PM" : "AM";
  const hours12 = hours24 % 12 === 0 ? 12 : hours24 % 12;
  return `${hours12}:${minutes} ${suffix}`;
}
