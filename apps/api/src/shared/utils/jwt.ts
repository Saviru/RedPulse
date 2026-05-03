import jwt from "jsonwebtoken";
import crypto from "crypto";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";
const JWT_EXPIRES_IN = "7d";

/**
 * Generate a JWT token for a user
 * @param username The unique username of the user
 * @param role The role of the user (USER or HOSPITAL)
 * @returns A signed JWT token
 */
export const generateToken = (username: string, role: string): string => {
  return jwt.sign({ username, role }, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });
};

/**
 * Verify a JWT token
 * @param token The token to verify
 * @returns The decoded payload or null if invalid
 */
export const verifyToken = (token: string): any => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
};

/**
 * Generate a random authorization code for PKCE
 */
export const generateAuthorizationCode = (): string => {
  return crypto.randomBytes(32).toString('hex');
};

/**
 * Verify PKCE code challenge
 */
export const verifyCodeChallenge = (codeVerifier: string, codeChallenge: string): boolean => {
  // Simple check for now, can be improved to support S256 if needed
  // Current mobile implementation sends plain challenge
  return codeVerifier === codeChallenge;
};
