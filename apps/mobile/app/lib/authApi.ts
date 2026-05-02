import { requestJson } from "./api";
import type { BloodGroup } from "./bloodRequestApi";

export type UserRole = "user" | "hospital" | "organization";

export interface AuthUser {
  username: string;
  email: string;
  role: UserRole;
  displayName?: string;
  phone?: string;
  bloodGroup?: string;
  hospitalName?: string;
  totalDonations?: number;
  city?: string;
  address?: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface RegisterInput {
  email: string;
  password: string;
  role: UserRole;
  displayName?: string;
  phone?: string;
  bloodGroup?: BloodGroup;
  hospitalName?: string;
}

export const loginApi = (body: LoginInput): Promise<{ token: string; user: AuthUser }> =>
  requestJson<{ token: string; user: AuthUser }>("/auth/login", {
    method: "POST",
    body: JSON.stringify(body),
  });

export const registerApi = (body: RegisterInput): Promise<{ token: string; user: AuthUser }> =>
  requestJson<{ token: string; user: AuthUser }>("/auth/register", {
    method: "POST",
    body: JSON.stringify(body),
  });

export const meApi = (): Promise<AuthUser> =>
  requestJson<AuthUser>("/auth/me", { method: "GET", auth: true });

export default function Ignore() { return null; }
