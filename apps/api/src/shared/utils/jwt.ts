import jwt from 'jsonwebtoken';
import { randomBytes, createHash } from 'crypto';

const JWT_SECRET = process.env.JWT_SECRET || 'testjwtkey123';
const EXPIRES_IN = '1d';

export const generateToken = (userId: string, role: string) => {
  return jwt.sign({ id: userId, role }, JWT_SECRET, {
    expiresIn: EXPIRES_IN,
  });
};

export const generateAuthorizationCode = (): string => {
  return randomBytes(32).toString('hex');
};

export const verifyCodeChallenge = (codeVerifier: string, codeChallenge: string): boolean => {
  // S256 standard format: BASE64URL-ENCODE(SHA256(ASCII(code_verifier)))
  const hash = createHash('sha256').update(codeVerifier).digest('base64');

  // base64url compatible
  const base64UrlHash = hash
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  return base64UrlHash === codeChallenge;
};
