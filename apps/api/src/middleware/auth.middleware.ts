import { createMiddleware } from 'hono/factory';
import { Errors } from '../lib/errors';
import { toUserDto } from '../lib/dto';
import { readSessionId } from '../lib/session';
import { authService } from '../services/auth.service';

/**
 * セッション Cookie を検証し、ユーザーを c.var.user に格納する。
 * 未認証・期限切れは 401。認可（リソース所有者チェック）は各サービスで行う。
 */
export const requireAuth = createMiddleware(async (c, next) => {
  const sessionId = await readSessionId(c);
  if (!sessionId) throw Errors.unauthorized();

  const user = await authService.validateSession(sessionId);
  if (!user) throw Errors.unauthorized();

  c.set('user', toUserDto(user));
  await next();
});
