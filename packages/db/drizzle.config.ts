import { resolve } from 'node:path';
import { config } from 'dotenv';
import { defineConfig } from 'drizzle-kit';

// モノレポルートの .env を読み込む（cwd = packages/db を想定）
config({ path: resolve(process.cwd(), '../../.env') });

export default defineConfig({
  schema: './src/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL ?? '',
  },
});
