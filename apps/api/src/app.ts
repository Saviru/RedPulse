import express, { type Request, type Response, type NextFunction } from "express";
import cors from "cors";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import multer from "multer";

// ---------------------------------------------------------------------------
// File uploads
// ---------------------------------------------------------------------------
// Resolve uploads dir relative to compiled output (dist/). The directory is
// created at startup so the first upload doesn't fail with ENOENT.
const uploadsDir = path.join(__dirname, "..", "..", "uploads");
fs.mkdirSync(uploadsDir, { recursive: true });

const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "application/pdf",
]);

const ALLOWED_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".pdf"]);

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (_req, file, cb) => {
    // Cryptographically random filename. We deliberately drop the
    // user-supplied basename to avoid path tricks and double extensions.
    const ext = path.extname(file.originalname).toLowerCase();
    const safeExt = ALLOWED_EXTENSIONS.has(ext) ? ext : "";
    const random = crypto.randomBytes(16).toString("hex");
    cb(null, `${random}${safeExt}`);
  },
});

const fileFilter: multer.Options["fileFilter"] = (_req, file, cb) => {
  // NOTE: file.mimetype is supplied by the client and can be spoofed. This
  // is a first-pass filter. For production, also verify magic bytes (e.g.
  // via the `file-type` package) before serving the file back.
  if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
    cb(new Error(`Invalid file type: ${file.mimetype}`));
    return;
  }

  const ext = path.extname(file.originalname).toLowerCase();
  if (!ALLOWED_EXTENSIONS.has(ext)) {
    cb(new Error(`Invalid file extension: ${ext}`));
    return;
  }

  cb(null, true);
};

export const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB per file
});

// Routes are imported AFTER `upload` is defined because they pull it in.
import { feedbackRoutes } from "./routes/feedbackRoutes";

// ---------------------------------------------------------------------------
// CORS
// ---------------------------------------------------------------------------
function buildCorsOrigins(): string[] {
  const fromEnv = (process.env.CORS_ORIGINS ?? "")
    .split(",")
    .map(s => s.trim())
    .filter(Boolean);

  // Sensible local-dev defaults so the mobile/web client just works during
  // development. Override in production via the CORS_ORIGINS env var.
  const defaults = [
    "http://localhost:8081",
    "http://localhost:19006",
    "http://127.0.0.1:8081",
    "http://10.0.2.2:8081",
  ];

  return fromEnv.length > 0 ? fromEnv : defaults;
}

export function createApp() {
  const app = express();

  const allowedOrigins = buildCorsOrigins();
  app.use(
    cors({
      origin(origin, cb) {
        // Allow requests with no Origin header (e.g. native mobile clients,
        // curl). Browsers always send Origin for cross-origin requests.
        if (!origin) {
          cb(null, true);
          return;
        }
        if (allowedOrigins.includes(origin)) {
          cb(null, true);
          return;
        }
        cb(new Error(`Origin not allowed: ${origin}`));
      },
      credentials: true,
    }),
  );

  // Explicit body-size cap so a single big request can't exhaust memory.
  app.use(express.json({ limit: "1mb" }));

  // Serve uploaded files. NOTE: there is no auth here yet; once we have real
  // sessions we should gate this and check ownership before streaming a file.
  app.use("/uploads", express.static(uploadsDir));

  app.get("/health", (_req, res) => {
    res.json({ ok: true });
  });

  app.use(feedbackRoutes);

  // Fallback for unmatched routes.
  app.use((_req, res) => {
    res.status(404).json({ error: "Not found" });
  });

  // Centralized error handler.
  app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    const e = err as { status?: number; message?: string };
    const status = typeof e?.status === "number" ? e.status : 500;
    const message = e?.message || "Internal server error.";
    res.status(status).json({ error: message });
  });

  return app;
}
