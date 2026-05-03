import dotenv from "dotenv";
import { existsSync } from "fs";
import path from "path";

/**
 * Load `.env` from the API package folder first, then cwd.
 * When you run `pnpm --filter redpulse-api dev` from the repo root, cwd may be
 * the workspace root, so `dotenv/config` alone would miss `apps/redpulse-api/.env`.
 */
const loadEnv = (): void => {
  const candidates = [
    path.join(process.cwd(), "apps", "redpulse-api", ".env"),
    path.join(process.cwd(), ".env"),
  ];

  for (const filePath of candidates) {
    if (existsSync(filePath)) {
      dotenv.config({ path: filePath });
      return;
    }
  }

  dotenv.config();
};

loadEnv();

const parseNumber = (raw: string | undefined, fallback: number): number => {
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export const env = {
  port: parseNumber(process.env.PORT, 4000),
  mongoUri: (process.env.MONGO_URI ?? "").trim(),
  jwtSecret: (process.env.JWT_SECRET ?? "").trim(),
  jwtExpiresIn: (process.env.JWT_EXPIRES_IN ?? "7d").trim(),
  firebaseProjectId: process.env.FIREBASE_PROJECT_ID ?? "",
  firebaseClientEmail: process.env.FIREBASE_CLIENT_EMAIL ?? "",
  firebasePrivateKey: (process.env.FIREBASE_PRIVATE_KEY ?? "").replace(/\\n/g, "\n"),
};

export const validateEnv = (): void => {
  if (!env.mongoUri) throw new Error("MONGO_URI is required");
  if (!env.jwtSecret) throw new Error("JWT_SECRET is required");
};
