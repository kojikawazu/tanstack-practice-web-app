import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';

/**
 * パスワードハッシュ（node:crypto の scrypt / ネイティブ依存なし）。
 * 形式: `${salt(hex)}:${hash(hex)}`。packages/db の seed.ts と同一フォーマット。
 */
export function hashPassword(password: string): string {
  const salt = randomBytes(16);
  const derived = scryptSync(password, salt, 64);
  return `${salt.toString('hex')}:${derived.toString('hex')}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [saltHex, hashHex] = stored.split(':');
  if (!saltHex || !hashHex) return false;
  const salt = Buffer.from(saltHex, 'hex');
  const expected = Buffer.from(hashHex, 'hex');
  const derived = scryptSync(password, salt, expected.length);
  return expected.length === derived.length && timingSafeEqual(expected, derived);
}
