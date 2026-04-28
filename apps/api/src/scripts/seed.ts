import { connectDatabase } from "../config/database";
import { env } from "../config/env";
import { OrganizationModel } from "../models/Organization";
import { UserModel } from "../models/User";

async function seed() {
  await connectDatabase(env.MONGODB_URI);

  const [organizationUser, hospitalUser, normalUser] = await Promise.all([
    UserModel.findOneAndUpdate(
      { email: "org@redpulse.local" },
      { name: "RedPulse Org Admin", email: "org@redpulse.local", role: "ORGANIZATION" },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    ),
    UserModel.findOneAndUpdate(
      { email: "hospital@redpulse.local" },
      { name: "City General Hospital Admin", email: "hospital@redpulse.local", role: "HOSPITAL" },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    ),
    UserModel.findOneAndUpdate(
      { email: "user@redpulse.local" },
      { name: "Volunteer User", email: "user@redpulse.local", role: "USER" },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    ),
  ]);

  const hospitals = await Promise.all([
    OrganizationModel.findOneAndUpdate(
      { name: "City General Hospital", type: "HOSPITAL" },
      { ownerUserId: hospitalUser._id, name: "City General Hospital", type: "HOSPITAL" },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    ),
    OrganizationModel.findOneAndUpdate(
      { name: "St. Mary's Medical Center", type: "HOSPITAL" },
      { ownerUserId: hospitalUser._id, name: "St. Mary's Medical Center", type: "HOSPITAL" },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    ),
    OrganizationModel.findOneAndUpdate(
      { name: "Red Cross Blood Bank", type: "HOSPITAL" },
      { ownerUserId: hospitalUser._id, name: "Red Cross Blood Bank", type: "HOSPITAL" },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    ),
  ]);

  await OrganizationModel.findOneAndUpdate(
    { name: "RedPulse Foundation", type: "ORGANIZATION" },
    { ownerUserId: organizationUser._id, name: "RedPulse Foundation", type: "ORGANIZATION" },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );

  // eslint-disable-next-line no-console
  console.log("Seed complete. Use these Expo auth IDs:");
  // eslint-disable-next-line no-console
  console.log(`EXPO_PUBLIC_ORGANIZATION_ID=${organizationUser._id.toString()}`);
  // eslint-disable-next-line no-console
  console.log(`EXPO_PUBLIC_HOSPITAL_ID=${hospitals[0]._id.toString()}`);
  // eslint-disable-next-line no-console
  console.log(`EXPO_PUBLIC_USER_ID=${normalUser._id.toString()}`);

  process.exit(0);
}

seed().catch((error) => {
  // eslint-disable-next-line no-console
  console.error("Seed failed:", error);
  process.exit(1);
});
