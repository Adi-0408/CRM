import crypto from 'crypto';

/**
 * Enterprise Password Security Utility using Node.js crypto scrypt
 * Format: `<hex-salt>:<hex-hash>`
 */

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password.trim(), salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, storedHash?: string | null): boolean {
  if (!storedHash || !password) return false;

  const cleanPassword = password.trim();

  // Backward compatibility: If legacy plaintext password exists
  if (!storedHash.includes(':')) {
    return cleanPassword === storedHash.trim();
  }

  try {
    const [salt, key] = storedHash.split(':');
    if (!salt || !key) return false;
    const keyBuffer = Buffer.from(key, 'hex');
    const derivedKey = crypto.scryptSync(cleanPassword, salt, 64);
    return crypto.timingSafeEqual(keyBuffer, derivedKey);
  } catch (err) {
    console.error('Password verification error:', err);
    return false;
  }
}
