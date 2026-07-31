import { resolve } from 'node:path';
import { config } from 'dotenv';
import { z } from 'zod';

// このモジュールを各エントリ（app.ts / index.ts）の最初に import することで、
// @repo/db の client.ts が DATABASE_URL を読む前に .env をロードする。
config({ path: resolve(process.cwd(), '../../.env') });

/**
 * 環境変数もユーザー入力と同じく「外から来る値」なので Zod で検証する。
 * z.coerce.number() は文字列（環境変数は常に文字列）を数値へ変換する指定。
 */
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  DATABASE_URL: z.string().min(1),
  SESSION_SECRET: z.string().min(16, 'SESSION_SECRET は16文字以上にしてください'),
  SESSION_TTL: z.coerce.number().int().positive().default(604800),
  CORS_ORIGIN: z.string().url(),
});

/**
 * 起動時に一度だけ検証し、不正なら即座に落とす（fail-fast）。
 * 設定漏れをリクエスト処理中の実行時エラーではなく起動失敗として
 * 気づけるようにするための設計。
 * 以降 env は検証済みの型付きオブジェクトなので、process.env を
 * 直接読まずにこれを使う（undefined チェックが不要になる）。
 */
const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
  console.error('環境変数が不正です:', parsed.error.flatten().fieldErrors);
  throw new Error('Invalid environment variables');
}

export const env = parsed.data;
