import path from "path";
import dotenv from "dotenv";

// Load .env from apps/api/ (this file lives at apps/api/dist/server.js once
// compiled, so go up one level to find .env). Loading happens BEFORE we
// import createApp so any module that reads process.env at import time
// sees the values.
dotenv.config({ path: path.join(__dirname, "..", ".env") });

import { createApp } from "./app";
import { connectMongo, disconnectMongo } from "./db/connection";

async function main() {
  const port = Number(process.env.PORT) || 4000;
  const mongoUri = process.env.MONGODB_URI ?? "";

  // Connect to MongoDB FIRST. If it fails, exit before binding the port —
  // we don't want to serve traffic with a broken DB.
  await connectMongo(mongoUri);

  const app = createApp();
  const server = app.listen(port, "0.0.0.0", () => {
    // eslint-disable-next-line no-console
    console.log(`[api] listening on http://0.0.0.0:${port}`);
  });

  // Graceful shutdown: close HTTP server, then disconnect from Mongo.
  const shutdown = async (signal: string) => {
    // eslint-disable-next-line no-console
    console.log(`[api] received ${signal}, shutting down...`);
    server.close(async () => {
      await disconnectMongo();
      process.exit(0);
    });
  };

  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));
}

main().catch(err => {
  // eslint-disable-next-line no-console
  console.error("[api] failed to start:", err);
  process.exit(1);
});
