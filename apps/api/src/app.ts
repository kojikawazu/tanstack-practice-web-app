import { env } from './env';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { HTTPException } from 'hono/http-exception';
import { logger } from 'hono/logger';
import { secureHeaders } from 'hono/secure-headers';
import { AppError } from './lib/errors';
import { authRoute } from './routes/auth.route';
import { tasksRoute } from './routes/tasks.route';

/**
 * Hono アプリの組み立て。
 *
 * 先頭で './env' を import しているのは副作用が目的。このモジュールが
 * .env を読み、環境変数を検証してから他の import（DB クライアント等）が
 * 走る必要があるため、import の順序自体に意味がある。
 *
 * index.ts（サーバー起動）と app.ts（アプリ定義）を分けているのは、
 * テストからポートを開かずに app.request() で叩けるようにするため。
 */
export const app = new Hono();

/**
 * ミドルウェアは登録順に外側から実行される（`await next()` の前が往路、
 * 後が復路）。ここでは全て `*` に付けているので、順序が実行順を決める。
 * logger を最初に置くと、後続で例外が起きてもリクエストの記録は残る。
 */
app.use('*', logger());
// secureHeaders は X-Content-Type-Options や X-Frame-Options 等の
// 防御的なヘッダーを既定で付与する
app.use('*', secureHeaders());
// 別オリジン(:5173)からの Cookie 付きリクエストを許可。origin:'*' は credentials と併用不可。
// フロント側の fetch(credentials:'include') と対で初めて Cookie が届く。
app.use('*', cors({ origin: env.CORS_ORIGIN, credentials: true }));

// 認証不要の死活監視用エンドポイント
app.get('/health', (c) => c.json({ status: 'ok' }));
// route() でサブアプリをパス配下にマウントする。各ルート側は
// 自分のプレフィックスを知らずに済み、URL 構成をここへ集約できる。
app.route('/api/auth', authRoute);
app.route('/api/tasks', tasksRoute);

/**
 * 全ルートの例外の受け皿。各ハンドラーで try/catch を書かず、
 * サービス層が throw した AppError をここで一括して JSON へ整形する。
 *
 * 分岐の順序が重要で、AppError → HTTPException → それ以外（想定外）と
 * 具体的なものから並べる。最後の 500 でだけ console.error でスタックを
 * 記録し、レスポンスには内部情報を出さない（漏洩防止）。
 */
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

// 未定義パスも同じ { error: { code, message } } 形式で返し、
// クライアントがエラー処理を1本化できるようにする
app.notFound((c) =>
  c.json({ error: { code: 'NOT_FOUND', message: 'エンドポイントが見つかりません' } }, 404),
);
