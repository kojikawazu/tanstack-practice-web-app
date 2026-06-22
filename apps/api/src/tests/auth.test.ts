import { describe, expect, it } from 'vitest';
import { app } from '../app';
import { extractCookie, jsonHeaders, uniqueEmail } from './helpers';

describe('auth', () => {
  it('正常系: 登録 → me → ログアウト', async () => {
    const email = uniqueEmail();
    const register = await app.request('/api/auth/register', {
      method: 'POST',
      headers: jsonHeaders(),
      body: JSON.stringify({ email, password: 'password123', name: 'Alice' }),
    });
    expect(register.status).toBe(201);
    const body = (await register.json()) as { email: string; name: string };
    expect(body.email).toBe(email);
    expect(body.name).toBe('Alice');
    expect(body).not.toHaveProperty('passwordHash');

    const cookie = extractCookie(register);
    const me = await app.request('/api/auth/me', { headers: { cookie } });
    expect(me.status).toBe(200);
    expect(((await me.json()) as { email: string }).email).toBe(email);

    const logout = await app.request('/api/auth/logout', { method: 'POST', headers: { cookie } });
    expect(logout.status).toBe(200);

    // ログアウト後はセッション無効 → 401
    const meAfter = await app.request('/api/auth/me', { headers: { cookie } });
    expect(meAfter.status).toBe(401);
  });

  it('正常系: 登録したユーザーでログインできる', async () => {
    const email = uniqueEmail();
    await app.request('/api/auth/register', {
      method: 'POST',
      headers: jsonHeaders(),
      body: JSON.stringify({ email, password: 'password123', name: 'Bob' }),
    });
    const login = await app.request('/api/auth/login', {
      method: 'POST',
      headers: jsonHeaders(),
      body: JSON.stringify({ email, password: 'password123' }),
    });
    expect(login.status).toBe(200);
  });

  it('準正常系: バリデーションエラーは 400 とフィールド情報を返す', async () => {
    const res = await app.request('/api/auth/register', {
      method: 'POST',
      headers: jsonHeaders(),
      body: JSON.stringify({ email: 'not-an-email', password: 'short', name: '' }),
    });
    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: { code: string; fields?: Record<string, string[]> } };
    expect(body.error.code).toBe('VALIDATION');
    expect(body.error.fields).toBeDefined();
  });

  it('準正常系: 重複メールは 409', async () => {
    const email = uniqueEmail();
    const payload = JSON.stringify({ email, password: 'password123', name: 'Carol' });
    await app.request('/api/auth/register', { method: 'POST', headers: jsonHeaders(), body: payload });
    const dup = await app.request('/api/auth/register', { method: 'POST', headers: jsonHeaders(), body: payload });
    expect(dup.status).toBe(409);
  });

  it('異常系: 誤ったパスワードは 401', async () => {
    const email = uniqueEmail();
    await app.request('/api/auth/register', {
      method: 'POST',
      headers: jsonHeaders(),
      body: JSON.stringify({ email, password: 'password123', name: 'Dave' }),
    });
    const login = await app.request('/api/auth/login', {
      method: 'POST',
      headers: jsonHeaders(),
      body: JSON.stringify({ email, password: 'wrong-password' }),
    });
    expect(login.status).toBe(401);
  });

  it('異常系: Cookie なしで /me は 401', async () => {
    const res = await app.request('/api/auth/me');
    expect(res.status).toBe(401);
  });
});
