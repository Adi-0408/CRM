/**
 * JWT Authentication Library using `jose`
 * Replaces the localStorage-based custom JWT with httpOnly cookie-based JWT.
 * Token payload includes: userId, companyId, role, email, platformRole
 */
import { SignJWT, jwtVerify, JWTPayload } from 'jose';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'itpl-crm-saas-super-secret-key-change-in-production-2026'
);
const JWT_EXPIRY = '7d';
const COOKIE_NAME = 'crm_session';

export interface JWTClaims extends JWTPayload {
  userId: string;
  email: string;
  name: string;
  role: string;
  companyId?: string;        // null/undefined for super admins
  platformRole?: string;     // 'super_admin' | 'support' | 'user'
  department?: string;
  isDemo?: boolean;
}

/**
 * Sign a new JWT with the given claims. Returns the token string.
 */
export async function signJWT(claims: Omit<JWTClaims, 'iat' | 'exp'>): Promise<string> {
  return new SignJWT(claims as JWTPayload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(JWT_EXPIRY)
    .sign(JWT_SECRET);
}

/**
 * Verify and decode a JWT. Returns null if invalid or expired.
 */
export async function verifyJWT(token: string): Promise<JWTClaims | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as JWTClaims;
  } catch {
    return null;
  }
}

/**
 * Build a Set-Cookie header string for the session cookie.
 */
export function buildSessionCookie(token: string, maxAgeSeconds = 7 * 24 * 3600): string {
  return `${COOKIE_NAME}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAgeSeconds}`;
}

/**
 * Build a cookie string that clears the session cookie.
 */
export function clearSessionCookie(): string {
  return `${COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;
}

export { COOKIE_NAME };
