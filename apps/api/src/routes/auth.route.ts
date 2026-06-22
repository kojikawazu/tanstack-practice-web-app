import { Hono } from 'hono';
import { loginSchema, registerSchema } from '@repo/shared';
import { toUserDto } from '../lib/dto';
import { clearSessionCookie, readSessionId, setSessionCookie } from '../lib/session';
import { validate } from '../lib/validate';
import { requireAuth } from '../middleware/auth.middleware';
import { authService } from '../services/auth.service';

export const authRoute = new Hono()
  .post('/register', validate('json', registerSchema), async (c) => {
    const input = c.req.valid('json');
    const user = await authService.register(input);
    const session = await authService.createSession(user.id);
    await setSessionCookie(c, session.id, session.expiresAt);
    return c.json(toUserDto(user), 201);
  })
  .post('/login', validate('json', loginSchema), async (c) => {
    const input = c.req.valid('json');
    const user = await authService.login(input);
    const session = await authService.createSession(user.id);
    await setSessionCookie(c, session.id, session.expiresAt);
    return c.json(toUserDto(user));
  })
  .post('/logout', requireAuth, async (c) => {
    const sessionId = await readSessionId(c);
    if (sessionId) await authService.logout(sessionId);
    clearSessionCookie(c);
    return c.json({ ok: true });
  })
  .get('/me', requireAuth, (c) => {
    return c.json(c.get('user'));
  });
