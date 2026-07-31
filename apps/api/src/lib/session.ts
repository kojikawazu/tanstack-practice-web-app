import type { Context } from 'hono';
import { deleteCookie, getSignedCookie, setSignedCookie } from 'hono/cookie';
import { env } from '../env';

export const SESSION_COOKIE = 'sid';

/**
 * HttpOnly + 署名付きセッション Cookie。
 * SameSite=Lax: localhost のポート差は same-site のため、別オリジン(:5173↔:3000)でも送信される。
 * Secure は本番のみ（ローカル http で動かすため）。
 *
 * 各オプションが防いでいるもの:
 * - httpOnly … JavaScript から document.cookie で読めなくする。
 *   XSS を受けてもセッション ID を盗み出せない。
 * - 署名 (setSignedCookie) … 値の改ざんを検出する。他人のセッション ID を
 *   推測して差し替えても、署名が合わなければ拒否される。
 * - sameSite: 'Lax' … 他サイトからの POST に Cookie を付けない。CSRF 対策。
 * - secure … HTTPS でのみ送信する。開発は http なので本番だけ有効にしている。
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

/**
 * Cookie の取り出し。署名検証に失敗すると false が返るため、
 * 文字列であることを確かめてから返す（改ざんされた値を通さない）。
 */
export async function readSessionId(c: Context): Promise<string | null> {
  const value = await getSignedCookie(c, env.SESSION_SECRET, SESSION_COOKIE);
  return typeof value === 'string' ? value : null;
}

export function clearSessionCookie(c: Context): void {
  deleteCookie(c, SESSION_COOKIE, { path: '/' });
}
