export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL ?? "http://localhost:4000/api";

export const APP_AUTH = {
  organization: {
    id: process.env.EXPO_PUBLIC_ORGANIZATION_ID ?? "",
    role: "ORGANIZATION" as const,
  },
  hospital: {
    id: process.env.EXPO_PUBLIC_HOSPITAL_ID ?? "",
    role: "HOSPITAL" as const,
  },
  user: {
    id: process.env.EXPO_PUBLIC_USER_ID ?? "",
    role: "USER" as const,
  },
};
