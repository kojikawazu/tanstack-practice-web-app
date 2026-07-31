import { Hono } from 'hono';
import { loginSchema, registerSchema } from '@repo/shared';
import { toUserDto } from '../lib/dto';
import { clearSessionCookie, readSessionId, setSessionCookie } from '../lib/session';
import { validate } from '../lib/validate';
import { requireAuth } from '../middleware/auth.middleware';
import { authService } from '../services/auth.service';

/**
 * 認証ルート。app.ts で '/api/auth' 配下にマウントされる。
 *
 * メソッドチェーンで書くのは Hono の型推論のためで、
 * 各ハンドラーの入出力型が積み上がった型が authRoute に付く
 * （RPC 機能を使う場合はこの型がクライアント側の補完になる）。
 *
 * ハンドラーの責務は「入力を受け取り、サービスを呼び、応答を返す」だけ。
 * 業務ロジックは services/、DB 操作は repositories/ にある。
 */
export const authRoute = new Hono()
  .post('/register', validate('json', registerSchema), async (c) => {
    // c.req.valid('json') は validate を通過した検証済みの値。
    // c.req.json() と違い型が付き、未検証の生データを触る事故を防げる。
    const input = c.req.valid('json');
    const user = await authService.register(input);
    // 登録直後にセッションを張るので、利用者は改めてログインしなくてよい
    const session = await authService.createSession(user.id);
    await setSessionCookie(c, session.id, session.expiresAt);
    // toUserDto を通して passwordHash を確実に除外する。
    // user をそのまま返すとハッシュが外部へ漏れる。
    return c.json(toUserDto(user), 201); // 201 Created
  })
  .post('/login', validate('json', loginSchema), async (c) => {
    const input = c.req.valid('json');
    const user = await authService.login(input);
    const session = await authService.createSession(user.id);
    await setSessionCookie(c, session.id, session.expiresAt);
    return c.json(toUserDto(user));
  })
  // ログアウトは「サーバー側のセッション削除」と「ブラウザの Cookie 削除」の
  // 両方が要る。Cookie を消すだけではセッション ID が有効なまま残り、
  // 盗まれた値で再利用できてしまう。
  .post('/logout', requireAuth, async (c) => {
    const sessionId = await readSessionId(c);
    if (sessionId) await authService.logout(sessionId);
    clearSessionCookie(c);
    return c.json({ ok: true });
  })
  // requireAuth が c.set('user', ...) した値をそのまま返すだけ。
  // フロントはこのエンドポイントの成否でログイン状態を判定する
  // （HttpOnly Cookie は JavaScript から読めないため）。
  .get('/me', requireAuth, (c) => {
    return c.json(c.get('user'));
  });
