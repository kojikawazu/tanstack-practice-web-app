import type { Context } from 'hono';
import { deleteCookie, getSignedCookie, setSignedCookie } from 'hono/cookie';
import { env } from '../env';

export const SESSION_COOKIE = 'sid';

/**
 * HttpOnly + 署名付きセッション Cookie。
 * SameSite=Lax: localhost のポート差は same-site のため、別オリジン(:5173↔:3000)でも送信される。
 * Secure は本番のみ（ローカル http で動かすため）。
 */
export async function setSessionCookie(
  c: Context,
  sessionId: string,
  expiresAt: Date,
): Promise<void> {
  await setSignedCookie(c, SESSION_COOKIE, sessionId, env.SESSION_SECRET, {
    httpOnly: true,
    sameSite: 'Lax',
    path: '/',
    secure: env.NODE_ENV === 'production',
    expires: expiresAt,
  });
}

export async function readSessionId(c: Context): Promise<string | null> {
  const value = await getSignedCookie(c, env.SESSION_SECRET, SESSION_COOKIE);
  return typeof value === 'string' ? value : null;
}

export function clearSessionCookie(c: Context): void {
  deleteCookie(c, SESSION_COOKIE, { path: '/' });
}
