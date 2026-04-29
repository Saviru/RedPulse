import mongoose from "mongoose";

let isConnecting = false;

/**
 * Connect to MongoDB. Safe to call once at server startup; will throw on
 * connection failure so the process can exit rather than serving traffic
 * with a broken DB.
 */
export async function connectMongo(uri: string): Promise<void> {
  if (!uri) {
    throw new Error(
      "MONGODB_URI is not set. Copy apps/api/.env.example to apps/api/.env and fill it in.",
    );
  }

  if (mongoose.connection.readyState === 1) return; // already connected
  if (isConnecting) return;

  isConnecting = true;
  try {
    mongoose.set("strictQuery", true);
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 10_000,
    });
    // eslint-disable-next-line no-console
    console.log(`[db] connected to MongoDB (${mongoose.connection.name})`);
  } finally {
    isConnecting = false;
  }
}

export function disconnectMongo(): Promise<void> {
  return mongoose.disconnect();
}
