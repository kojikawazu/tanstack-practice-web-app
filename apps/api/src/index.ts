import { env } from './env';
import { serve } from '@hono/node-server';
import { app } from './app';

/**
 * サーバー起動のエントリポイント。
 *
 * Hono 自体は Web 標準の Request → Response を扱うだけで、
 * ポートを開く機能を持たない。実行環境ごとのアダプター
 * （ここでは Node.js 用の @hono/node-server）が app.fetch を受け取り、
 * HTTP サーバーへ繋ぐ。この分離のおかげで同じ app が
 * Node / Bun / Cloudflare Workers など別の環境でも動く。
 */
serve({ fetch: app.fetch, port: env.PORT }, (info) => {
  console.log(`API listening on http://localhost:${info.port}`);
});
