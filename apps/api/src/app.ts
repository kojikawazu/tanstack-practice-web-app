import { env } from './env';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { HTTPException } from 'hono/http-exception';
import { logger } from 'hono/logger';
import { secureHeaders } from 'hono/secure-headers';
import { AppError } from './lib/errors';
import { authRoute } from './routes/auth.route';
import { tasksRoute } from './routes/tasks.route';

export const app = new Hono();

app.use('*', logger());
app.use('*', secureHeaders());
// 別オリジン(:5173)からの Cookie 付きリクエストを許可。origin:'*' は credentials と併用不可。
app.use('*', cors({ origin: env.CORS_ORIGIN, credentials: true }));

app.get('/health', (c) => c.json({ status: 'ok' }));
app.route('/api/auth', authRoute);
app.route('/api/tasks', tasksRoute);

app.onError((err, c) => {
  if (err instanceof AppError) {
    return c.json(
      { error: { code: err.code, message: err.message, fields: err.fields } },
      err.status,
    );
  }
  if (err instanceof HTTPException) {
    return c.json({ error: { code: 'HTTP_ERROR', message: err.message } }, err.status);
  }
  console.error(err);
  return c.json(
    { error: { code: 'INTERNAL', message: 'サーバーエラーが発生しました' } },
    500,
  );
});

app.notFound((c) =>
  c.json({ error: { code: 'NOT_FOUND', message: 'エンドポイントが見つかりません' } }, 404),
);
