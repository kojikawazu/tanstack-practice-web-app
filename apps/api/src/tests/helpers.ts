import { randomUUID } from 'node:crypto';
import { app } from '../app';

/** Set-Cookie ヘッダから `name=value` 部分を取り出して Cookie ヘッダに再利用する */
export function extractCookie(res: Response): string {
  const setCookie = res.headers.get('set-cookie');
  if (!setCookie) throw new Error('Set-Cookie がありません');
  return setCookie.split(';')[0]!;
}

export function uniqueEmail(): string {
  return `test-${randomUUID()}@example.com`;
}

/** 新規ユーザーを登録し、セッション Cookie を返す */
export async function registerAndGetCookie(): Promise<{ cookie: string; email: string }> {
  const email = uniqueEmail();
  const res = await app.request('/api/auth/register', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email, password: 'password123', name: 'Tester' }),
  });
  if (res.status !== 201) throw new Error(`register 失敗: ${res.status}`);
  return { cookie: extractCookie(res), email };
}

export function jsonHeaders(cookie?: string): Record<string, string> {
  const h: Record<string, string> = { 'content-type': 'application/json' };
  if (cookie) h.cookie = cookie;
  return h;
}
