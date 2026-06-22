import { resolve } from 'node:path';
import { config } from 'dotenv';
import { z } from 'zod';

// このモジュールを各エントリ（app.ts / index.ts）の最初に import することで、
// @repo/db の client.ts が DATABASE_URL を読む前に .env をロードする。
config({ path: resolve(process.cwd(), '../../.env') });

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  DATABASE_URL: z.string().min(1),
  SESSION_SECRET: z.string().min(16, 'SESSION_SECRET は16文字以上にしてください'),
  SESSION_TTL: z.coerce.number().int().positive().default(604800),
  CORS_ORIGIN: z.string().url(),
});

const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
  console.error('環境変数が不正です:', parsed.error.flatten().fieldErrors);
  throw new Error('Invalid environment variables');
}

export const env = parsed.data;
