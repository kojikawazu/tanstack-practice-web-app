import { createMiddleware } from 'hono/factory';
import { Errors } from '../lib/errors';
import { toUserDto } from '../lib/dto';
import { readSessionId } from '../lib/session';
import { authService } from '../services/auth.service';

/**
 * セッション Cookie を検証し、ユーザーを c.var.user に格納する。
 * 未認証・期限切れは 401。認可（リソース所有者チェック）は各サービスで行う。
 *
 * createMiddleware を使うと、c.set した値の型が後続ハンドラーへ伝わる
 * （型定義は types/hono.d.ts の ContextVariableMap で宣言している）。
 * これにより、ハンドラー側の c.get('user') が型付きかつ非 null で扱える。
 *
 * `await next()` を呼ばずに throw すれば後続は実行されない。
 * ミドルウェアで処理を打ち切るとはそういう意味で、
 * ここを通過したハンドラーは「認証済み」を前提にしてよい。
 */
export const requireAuth = createMiddleware(async (c, next) => {
  const sessionId = await readSessionId(c);
  if (!sessionId) throw Errors.unauthorized();

  const user = await authService.validateSession(sessionId);
  if (!user) throw Errors.unauthorized();

  c.set('user', toUserDto(user));
  await next();
});
