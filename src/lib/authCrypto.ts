import { SignJWT, jwtVerify } from 'jose';
import bcrypt from 'bcryptjs';
import { UserRole } from '@/types/auth';

const getJwtSecret = () => {
  return new TextEncoder().encode(
    process.env.JWT_SECRET || 'crm_super_secret_jwt_key_2026_change_in_production'
  );
};

export interface TokenPayload {
  sub: string;
  email: string;
  role: UserRole;
  company_id: string | null;
  name?: string;
  department?: string;
  must_change_password?: boolean;
  [key: string]: any;
}

/**
 * Checks whether a string is already a valid bcrypt hash
 */
export function isBcryptHash(value?: string | null): boolean {
  if (!value || typeof value !== 'string') return false;
  return /^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}$/.test(value);
}

/**
 * Hashes a plaintext password using bcrypt with salt rounds 10
 */
export async function hashPassword(plainText: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(plainText, salt);
}

/**
 * Compares plaintext password against stored password.
 * Supports transparent upgrade: returns `needsRehash: true` if matches via legacy plaintext.
 */
export async function verifyPassword(
  plainText: string,
  storedValue?: string | null
): Promise<{ matches: boolean; needsRehash: boolean }> {
  if (!storedValue || !plainText) return { matches: false, needsRehash: false };

  if (isBcryptHash(storedValue)) {
    const matches = await bcrypt.compare(plainText, storedValue);
    return { matches, needsRehash: false };
  }

  // Legacy plaintext comparison
  const matches = plainText === storedValue;
  return { matches, needsRehash: matches };
}

/**
 * Creates a signed JWT token valid for 30 days
 */
export async function signAuthToken(payload: TokenPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('30d')
    .sign(getJwtSecret());
}

/**
 * Verifies a JWT token and returns its decoded payload
 */
export async function verifyAuthToken(token: string): Promise<TokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getJwtSecret());
    return payload as unknown as TokenPayload;
  } catch {
    return null;
  }
}
