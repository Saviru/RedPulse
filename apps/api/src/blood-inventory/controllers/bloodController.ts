import { Request, Response } from "express";
import mongoose from "mongoose";
import { Blood, IBloodDocument } from "../models/Blood";
import { UnitIdCounter } from "../models/UnitIdCounter";
import {
  calculateDaysLeft,
  computeStatusForScreen,
  lowStockAlertForCount,
  shouldIncludeInAlerts,
  stockLevelForCount,
} from "../utils/bloodStatus";
import { BLOOD_MSG } from "../utils/bloodMessages";
import {
  isAllowedBloodType,
  isAllowedComponent,
  isNonEmptyString,
  isValidUnitId,
  isValidYmd,
  isVolumeValid,
  parseVolume,
  todayYmdLocal,
  ymdToLocalDate,
} from "../utils/bloodValidation";
import { findActiveHospitalByUsername, listActiveHospitalUsernames } from "../services/hospitalUserService";

type CountsByType = Record<string, number>;

function getCollectionDateTime(u: IBloodDocument): Date {
  return (u.collectionDateTime ?? u.collectionDate) as Date;
}

function getExpiryDateTime(u: IBloodDocument): Date {
  return (u.expiryDateTime ?? u.expiryDate) as Date;
}

function formatTime12h(d: Date): string {
  const hours24 = d.getHours();
  const minutes = String(d.getMinutes()).padStart(2, "0");
  const suffix = hours24 >= 12 ? "PM" : "AM";
  const hours12 = hours24 % 12 === 0 ? 12 : hours24 % 12;
  return `${hours12}:${minutes} ${suffix}`;
}


function isActiveUnit(doc: IBloodDocument): boolean {
  return getExpiryDateTime(doc).getTime() >= Date.now();
}


async function getCountsByBloodType(): Promise<CountsByType> {
  const rows = await Blood.find().exec();
  const map: CountsByType = {};
  for (const u of rows) {
    if (!isActiveUnit(u)) continue;
    map[u.bloodType] = (map[u.bloodType] ?? 0) + 1;
  }
  return map;
}


function serializeBlood(
  doc: IBloodDocument,
  counts: CountsByType,
  screen: "total" | "alerts"
) {
  const bloodTypeCount = counts[doc.bloodType] ?? 0;
  const expiryDateTime = getExpiryDateTime(doc);
  const collectionDateTime = getCollectionDateTime(doc);
  const { daysLeft, status, expiryAlert, daysLeftLabel } = computeStatusForScreen(
    expiryDateTime,
    screen
  );
  return {
    id: doc._id.toString(),
    unitId: doc.unitId,
    username: doc.username ?? "",
    bloodType: doc.bloodType,
    component: doc.component,
    volume: doc.volume,
    // New datetime fields (ISO strings in JSON).
    collectionDateTime,
    expiryDateTime,
    formattedExpiryTime: formatTime12h(expiryDateTime),

    // Legacy fields kept for backward compatibility.
    collectionDate: collectionDateTime,
    expiryDate: expiryDateTime,
    createdAt: doc.createdAt,
    daysLeft,
    status,
    expiryAlert,
    daysLeftLabel,
    lowStockAlert: lowStockAlertForCount(bloodTypeCount),
  };
}

const UNIT_ID_COUNTER_KEY = "blood-unit";
const UNIT_ID_REGEX = /^UNIT-(\d+)$/;

function extractUnitNumber(unitId: string): number | null {
  const match = UNIT_ID_REGEX.exec(unitId.trim());
  if (!match) return null;
  const value = Number(match[1]);
  if (!Number.isFinite(value) || value < 1) return null;
  return value;
}

async function getMaxExistingUnitNumber(): Promise<number> {
  const rows = await Blood.find({}, { unitId: 1 }).lean().exec();
  let max = 0;
  for (const row of rows) {
    const id = typeof row.unitId === "string" ? row.unitId : "";
    const n = extractUnitNumber(id);
    if (n !== null && n > max) max = n;
  }
  return max;
}

async function reserveNextUnitId(): Promise<string> {
  const maxExisting = await getMaxExistingUnitNumber();
  await UnitIdCounter.findOneAndUpdate(
    { key: UNIT_ID_COUNTER_KEY },
    { $max: { seq: maxExisting }, $setOnInsert: { key: UNIT_ID_COUNTER_KEY } },
    { upsert: true, new: true }
  ).exec();

  const counter = await UnitIdCounter.findOneAndUpdate(
    { key: UNIT_ID_COUNTER_KEY },
    { $inc: { seq: 1 } },
    { new: true }
  ).exec();

  if (!counter) {
    throw new Error("Could not generate unit id");
  }

  return `UNIT-${counter.seq}`;
}

 //validations
function validateRequiredFields(body: Record<string, unknown>): string | null {
  const fields = ["username", "bloodType", "component", "volume", "collectionDate", "expiryDate"] as const;
  for (const k of fields) {
    const v = body[k];
    if (v === undefined || v === null) return BLOOD_MSG.fillAll;
    if (typeof v === "string" && v.trim() === "") return BLOOD_MSG.fillAll;
  }
  return null;
}

function validateCreatePayload(body: Record<string, unknown>): string | null {
  const reqErr = validateRequiredFields(body);
  if (reqErr) return reqErr;

  if (!isNonEmptyString(body.username)) return BLOOD_MSG.fillAll;
  if (!isAllowedBloodType(body.bloodType)) return BLOOD_MSG.invalidFormat;
  if (!isAllowedComponent(body.component)) return BLOOD_MSG.invalidFormat;
  const vol = parseVolume(body.volume);
  if (vol === null) return BLOOD_MSG.invalidFormat;
  if (!isVolumeValid(vol)) return BLOOD_MSG.invalidFormat;

  if (!isValidYmd(body.collectionDate)) return BLOOD_MSG.invalidFormat;
  if (!isValidYmd(body.expiryDate)) return BLOOD_MSG.invalidFormat;

  const collY = String(body.collectionDate).trim();
  const expY = String(body.expiryDate).trim();
  if (collY !== todayYmdLocal()) {
    return BLOOD_MSG.collectionMustBeToday;
  }

  const coll = ymdToLocalDate(collY);
  const exp = ymdToLocalDate(expY);
  if (exp <= coll) return BLOOD_MSG.expiryAfterCollection;

  return null;
}

function validateUpdatePayload(body: Record<string, unknown>, existing: IBloodDocument): string | null {
  const mergedUsername = body.username !== undefined ? body.username : existing.username;
  const mergedUnitId = body.unitId !== undefined ? body.unitId : existing.unitId;
  const mergedBloodType = body.bloodType !== undefined ? body.bloodType : existing.bloodType;
  const mergedComponent = body.component !== undefined ? body.component : existing.component;
  const mergedVolRaw = body.volume !== undefined ? body.volume : existing.volume;
  const mergedCollectionRaw =
    body.collectionDate !== undefined ? body.collectionDate : existing.collectionDate;
  const mergedExpiryRaw = body.expiryDate !== undefined ? body.expiryDate : existing.expiryDate;

  const merged = {
    username: mergedUsername,
    unitId: mergedUnitId,
    bloodType: mergedBloodType,
    component: mergedComponent,
    volume: mergedVolRaw,
    collectionDate: mergedCollectionRaw,
    expiryDate: mergedExpiryRaw,
  };

  const fields = ["username", "unitId", "bloodType", "component", "volume", "collectionDate", "expiryDate"] as const;
  for (const k of fields) {
    const v = merged[k];
    if (v === undefined || v === null) return BLOOD_MSG.fillAll;
    if (typeof v === "string" && v.trim() === "") return BLOOD_MSG.fillAll;
  }

  if (!isNonEmptyString(merged.username)) return BLOOD_MSG.fillAll;
  if (!isNonEmptyString(merged.unitId) || !isValidUnitId(String(merged.unitId))) {
    return BLOOD_MSG.invalidFormat;
  }
  if (!isAllowedBloodType(merged.bloodType)) return BLOOD_MSG.invalidFormat;
  if (!isAllowedComponent(merged.component)) return BLOOD_MSG.invalidFormat;
  const mergedVol = parseVolume(mergedVolRaw);
  if (mergedVol === null) return BLOOD_MSG.invalidFormat;
  if (!isVolumeValid(mergedVol)) return BLOOD_MSG.invalidFormat;


  let coll: Date;
  let exp: Date;

  if (typeof mergedCollectionRaw === "string") {
    if (!isValidYmd(mergedCollectionRaw)) return BLOOD_MSG.invalidFormat;
    coll = ymdToLocalDate(mergedCollectionRaw.trim());
  } else if (mergedCollectionRaw instanceof Date) {
    const y = mergedCollectionRaw.getFullYear();
    const m = String(mergedCollectionRaw.getMonth() + 1).padStart(2, "0");
    const d = String(mergedCollectionRaw.getDate()).padStart(2, "0");
    if (!isValidYmd(`${y}-${m}-${d}`)) return BLOOD_MSG.invalidFormat;
    coll = ymdToLocalDate(`${y}-${m}-${d}`);
  } else {
    return BLOOD_MSG.invalidFormat;
  }


  if (typeof mergedExpiryRaw === "string") {
    if (!isValidYmd(mergedExpiryRaw)) return BLOOD_MSG.invalidFormat;
    exp = ymdToLocalDate(mergedExpiryRaw.trim());
  } else if (mergedExpiryRaw instanceof Date) {
    const y = mergedExpiryRaw.getFullYear();
    const m = String(mergedExpiryRaw.getMonth() + 1).padStart(2, "0");
    const d = String(mergedExpiryRaw.getDate()).padStart(2, "0");
    if (!isValidYmd(`${y}-${m}-${d}`)) return BLOOD_MSG.invalidFormat;
    exp = ymdToLocalDate(`${y}-${m}-${d}`);
  } else {
    return BLOOD_MSG.invalidFormat;
  }


  if (exp <= coll) return BLOOD_MSG.expiryAfterCollection;

  return null;
}


function toYmdInput(v: string | Date): string {
  if (typeof v === "string" && isValidYmd(v)) return v.trim();
  if (v instanceof Date) {
    const y = v.getFullYear();
    const m = String(v.getMonth() + 1).padStart(2, "0");
    const d = String(v.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }
  return "";
}


export async function createBlood(req: Request, res: Response): Promise<void> {
  const body = req.body as Record<string, unknown>;
  const err = validateCreatePayload(body);
  if (err) {
    res.status(400).json({ message: err });
    return;
  }

  const collYmd = ymdToLocalDate(String(body.collectionDate).trim());
  const expYmd = ymdToLocalDate(String(body.expiryDate).trim());

  const volume = parseVolume(body.volume) as number;

  try {
    const username = String(body.username).trim();
    const hospitalUser = await findActiveHospitalByUsername(username);
    if (!hospitalUser) {
      res.status(400).json({ message: BLOOD_MSG.hospitalUsernameNotFound });
      return;
    }

    // Capture current system time at creation.
    const now = new Date();
    const collectionDateTime = new Date(
      collYmd.getFullYear(),
      collYmd.getMonth(),
      collYmd.getDate(),
      now.getHours(),
      now.getMinutes(),
      now.getSeconds(),
      now.getMilliseconds()
    );
    // Expiry time must match the collection time.
    const expiryDateTime = new Date(
      expYmd.getFullYear(),
      expYmd.getMonth(),
      expYmd.getDate(),
      now.getHours(),
      now.getMinutes(),
      now.getSeconds(),
      now.getMilliseconds()
    );

    const unitId = await reserveNextUnitId();

    const doc = await Blood.create({
      unitId,
      username: hospitalUser.username,
      bloodType: body.bloodType as string,
      component: body.component as string,
      volume,
      collectionDateTime,
      expiryDateTime,

      // Legacy fields for backward compatibility.
      collectionDate: collectionDateTime,
      expiryDate: expiryDateTime,
    });
    const counts = await getCountsByBloodType();
    res.status(201).json(serializeBlood(doc, counts, "total"));
  } catch (e) {
    if (e && typeof e === "object" && "code" in e && (e as { code: number }).code === 11000) {
      res.status(400).json({ message: BLOOD_MSG.invalidUnitId });
      return;
    }
    throw e;
  }
}

export async function getNextUnitId(_req: Request, res: Response): Promise<void> {
  const maxExisting = await getMaxExistingUnitNumber();
  const counter = await UnitIdCounter.findOne({ key: UNIT_ID_COUNTER_KEY }).exec();
  const highest = Math.max(maxExisting, counter?.seq ?? 0);
  res.json({ unitId: `UNIT-${highest + 1}` });
}

export async function getHospitalUsernames(_req: Request, res: Response): Promise<void> {
  const usernames = await listActiveHospitalUsernames();
  res.json({ usernames });
}


export async function getAllBlood(_req: Request, res: Response): Promise<void> {
  const units = await Blood.find().exec();
  units.sort((a, b) => getExpiryDateTime(a).getTime() - getExpiryDateTime(b).getTime());
  const active = units.filter((u) => isActiveUnit(u));
  const counts = await getCountsByBloodType();
  const data = active.map((u) => serializeBlood(u, counts, "total"));
  res.json(data);
}




/** All units (including expired) for wastage / analytics. */
export async function getAllBloodRecords(_req: Request, res: Response): Promise<void> {
  const units = await Blood.find().exec();
  units.sort((a, b) => getExpiryDateTime(a).getTime() - getExpiryDateTime(b).getTime());
  const counts = await getCountsByBloodType();
  const data = units.map((u) => serializeBlood(u, counts, "alerts"));
  res.json(data);
}



export async function getBloodById(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) {
    res.status(400).json({ message: "Invalid id format" });
    return;
  }
  const doc = await Blood.findById(id).exec();
  if (!doc) {
    res.status(404).json({ message: "Blood unit not found" });
    return;
  }
  const counts = await getCountsByBloodType();
  const screen = isActiveUnit(doc) ? "total" : "alerts";
  res.json(serializeBlood(doc, counts, screen));
}



export async function getAlerts(_req: Request, res: Response): Promise<void> {
  const units = await Blood.find().exec();
  units.sort((a, b) => getExpiryDateTime(a).getTime() - getExpiryDateTime(b).getTime());
  const counts = await getCountsByBloodType();
  const filtered = units.filter((u) =>
    shouldIncludeInAlerts(calculateDaysLeft(getExpiryDateTime(u)))
  );
  const data = filtered.map((u) => serializeBlood(u, counts, "alerts"));
  res.json(data);
}

//dashboard.
export async function getDashboard(_req: Request, res: Response): Promise<void> {
  const units = await Blood.find().exec();
  const activeUnits = units.filter((u) => isActiveUnit(u));
  const totalUnits = activeUnits.length;

  let expiredCount = 0;
  let expiringSoonCount = 0;
  for (const u of units) {
    const d = calculateDaysLeft(getExpiryDateTime(u));
    if (d < 0) {
      expiredCount += 1;
    }
  }
  for (const u of activeUnits) {
    const d = calculateDaysLeft(getExpiryDateTime(u));
    if (d >= 0 && d <= 10) {
      expiringSoonCount += 1;
    }
  }

  const counts = await getCountsByBloodType();
  const lowStockBloodTypes = Object.entries(counts)
    .filter(([, count]) => count <= 5)
    .map(([bloodType, count]) => ({
      bloodType,
      count,
      stockLevel: stockLevelForCount(count),
    }))
    .sort((a, b) => a.bloodType.localeCompare(b.bloodType));

  const allCount = units.length;
  const wastagePercent =
    allCount === 0 ? 0 : Math.round((expiredCount / allCount) * 10000) / 100;

  res.json({
    totalUnits,
    expiringSoonCount,
    lowStockBloodTypes,
    wastagePercent,
  });
}


//update unit
export async function updateBlood(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) {
    res.status(400).json({ message: "Invalid id format" });
    return;
  }
  const body = req.body as Record<string, unknown>;
  const existing = await Blood.findById(id).exec();
  if (!existing) {
    res.status(404).json({ message: "Blood unit not found" });
    return;
  }

  const err = validateUpdatePayload(body, existing);
  if (err) {
    res.status(400).json({ message: err });
    return;
  }

  const mergedUnitId = body.unitId !== undefined ? String(body.unitId).trim() : existing.unitId;
  const mergedUsername = body.username !== undefined ? String(body.username).trim() : (existing.username ?? "").trim();
  const hospitalUser = await findActiveHospitalByUsername(mergedUsername);
  if (!hospitalUser) {
    res.status(400).json({ message: BLOOD_MSG.hospitalUsernameNotFound });
    return;
  }
  if (mergedUnitId !== existing.unitId) {
    const taken = await Blood.findOne({ unitId: mergedUnitId, _id: { $ne: id } }).exec();
    if (taken) {
      res.status(400).json({ message: BLOOD_MSG.invalidUnitId });
      return;
    }
  }

  const mergedCollection =
    body.collectionDate !== undefined ? body.collectionDate : existing.collectionDate;
  const mergedExpiry = body.expiryDate !== undefined ? body.expiryDate : existing.expiryDate;

  const collectionYmd = toYmdInput(mergedCollection as string | Date);
  const expiryYmd = toYmdInput(mergedExpiry as string | Date);
  if (!collectionYmd || !expiryYmd) {
    res.status(400).json({ message: BLOOD_MSG.invalidFormat });
    return;
  }
  const collectionDate = ymdToLocalDate(collectionYmd);
  const expiryDate = ymdToLocalDate(expiryYmd);

  // Preserve the original collection time (expiry time must always match collection time).
  const baseCollection = getCollectionDateTime(existing);
  const collectionHours = baseCollection.getHours();
  const collectionMinutes = baseCollection.getMinutes();
  const collectionSeconds = baseCollection.getSeconds();
  const collectionMs = baseCollection.getMilliseconds();

  const collectionDateTime = new Date(
    collectionDate.getFullYear(),
    collectionDate.getMonth(),
    collectionDate.getDate(),
    collectionHours,
    collectionMinutes,
    collectionSeconds,
    collectionMs
  );
  const expiryDateTime = new Date(
    expiryDate.getFullYear(),
    expiryDate.getMonth(),
    expiryDate.getDate(),
    collectionHours,
    collectionMinutes,
    collectionSeconds,
    collectionMs
  );

  const volume = parseVolume(body.volume !== undefined ? body.volume : existing.volume) as number;
  const nextBloodType =
    body.bloodType !== undefined ? (body.bloodType as string) : existing.bloodType;
  const nextComponent =
    body.component !== undefined ? (body.component as string) : existing.component;

  try {
    const doc = await Blood.findByIdAndUpdate(
      id,
      {
        unitId: mergedUnitId,
        username: hospitalUser.username,
        bloodType: nextBloodType,
        component: nextComponent,
        volume,
        collectionDateTime,
        expiryDateTime,

        // Legacy fields.
        collectionDate: collectionDateTime,
        expiryDate: expiryDateTime,
      },
      { new: true, runValidators: true }
    ).exec();

    if (!doc) {
      res.status(404).json({ message: "Blood unit not found" });
      return;
    }

    const counts = await getCountsByBloodType();
    res.json(serializeBlood(doc, counts, "total"));
  } catch (e) {
    if (e && typeof e === "object" && "code" in e && (e as { code: number }).code === 11000) {
      res.status(400).json({ message: BLOOD_MSG.invalidUnitId });
      return;
    }
    throw e;
  }
}



export async function deleteBlood(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) {
    res.status(400).json({ message: "Invalid id format" });
    return;
  }
  const doc = await Blood.findByIdAndDelete(id).exec();
  if (!doc) {
    res.status(404).json({ message: "Blood unit not found" });
    return;
  }
  res.status(200).json({ ok: true });
}
