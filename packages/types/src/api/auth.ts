import { AnyUser, Role } from '../models/User';

export interface RegisterRequest {
  email: string;
  password: string;
  role: Role;
  // User specifics
  firstName?: string;
  lastName?: string;
  // Org specifics
  organizationName?: string;
  registrationNumber?: string;
  // Hospital specifics
  hospitalName?: string;
  licenseNumber?: string;
  address?: string;
  
  // PKCE integration
  codeChallenge?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
  codeChallenge?: string;
}

export interface AuthCodeResponse {
  authorizationCode: string;
  expiresIn: number;
}

export interface TokenExchangeRequest {
  authorizationCode: string;
  codeVerifier: string;
}

export interface TokenResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: AnyUser;
}

export interface ProfileUpdateRequest {
  firstName?: string;
  lastName?: string;
  bloodGroup?: string;
  phoneNumber?: string;
  
  organizationName?: string;
  contactNumber?: string;
  website?: string;
  
  hospitalName?: string;
  address?: string;
  emergencyContact?: string;
}
