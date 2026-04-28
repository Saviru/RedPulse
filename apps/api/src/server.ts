import { app } from "./app";
import { connectDatabase } from "./config/database";
import { env } from "./config/env";

async function bootstrap() {
  await connectDatabase(env.MONGODB_URI);
  app.listen(env.PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`API running on port ${env.PORT}`);
  });
}

bootstrap().catch((err) => {
  // eslint-disable-next-line no-console
  console.error("Failed to start API", err);
  process.exit(1);
});
