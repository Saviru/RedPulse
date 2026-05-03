import mongoose from "mongoose";

export interface ActiveHospitalUser {
  username: string;
  email: string;
}

type RawUserDoc = {
  username?: unknown;
  email?: unknown;
  role?: unknown;
  isActive?: unknown;
};

function normalizeHospitalUser(doc: RawUserDoc): ActiveHospitalUser | null {
  const username = typeof doc.username === "string" ? doc.username.trim() : "";
  const email = typeof doc.email === "string" ? doc.email.trim() : "";
  const role = typeof doc.role === "string" ? doc.role.trim() : "";
  const isActive = doc.isActive === true;
  if (!username || !email || role !== "HOSPITAL" || !isActive) {
    return null;
  }
  return { username, email };
}

function usersCollection() {
  const db = mongoose.connection.db;
  if (!db) {
    throw new Error("Database connection is not ready");
  }
  return db.collection("users");
}

export async function findActiveHospitalByUsername(
  username: string
): Promise<ActiveHospitalUser | null> {
  const trimmed = username.trim();
  if (!trimmed) return null;

  const row = (await usersCollection().findOne(
    { username: trimmed, role: "HOSPITAL", isActive: true },
    { projection: { username: 1, email: 1, role: 1, isActive: 1 } }
  )) as RawUserDoc | null;

  if (!row) return null;
  return normalizeHospitalUser(row);
}

export async function listActiveHospitalUsernames(): Promise<string[]> {
  const rows = (await usersCollection()
    .find({ role: "HOSPITAL", isActive: true }, { projection: { username: 1, email: 1, role: 1, isActive: 1 } })
    .toArray()) as RawUserDoc[];

  const usernames = rows
    .map((row) => normalizeHospitalUser(row)?.username ?? "")
    .filter((u) => u.length > 0)
    .sort((a, b) => a.localeCompare(b));

  return Array.from(new Set(usernames));
}

export async function getActiveHospitalEmailsByUsernames(
  usernames: string[]
): Promise<Map<string, string>> {
  const unique = Array.from(
    new Set(
      usernames
        .map((u) => u.trim())
        .filter((u) => u.length > 0)
    )
  );

  if (unique.length === 0) return new Map<string, string>();

  const rows = (await usersCollection()
    .find(
      { username: { $in: unique }, role: "HOSPITAL", isActive: true },
      { projection: { username: 1, email: 1, role: 1, isActive: 1 } }
    )
    .toArray()) as RawUserDoc[];

  const map = new Map<string, string>();
  for (const row of rows) {
    const normalized = normalizeHospitalUser(row);
    if (normalized) {
      map.set(normalized.username, normalized.email);
    }
  }
  return map;
}
