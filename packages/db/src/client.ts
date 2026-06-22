import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

const url = process.env.DATABASE_URL;
if (!url) {
  throw new Error('DATABASE_URL is not set. ルートの .env を確認してください。');
}

// postgres.js のコネクション。seed/CLI で確実にクローズできるよう client も公開する。
export const queryClient = postgres(url);
export const db = drizzle(queryClient, { schema });
export { schema };
export type Database = typeof db;
