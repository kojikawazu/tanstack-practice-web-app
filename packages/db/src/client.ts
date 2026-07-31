import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

/**
 * DB 接続の生成。
 *
 * このモジュールは import された時点で接続情報を読むため、
 * 呼び出し側は事前に .env をロードしておく必要がある
 * （apps/api は env.ts、CLI は load-env.ts がその役目）。
 * import の順序が動作に影響する数少ない箇所。
 */
const url = process.env.DATABASE_URL;
if (!url) {
  throw new Error('DATABASE_URL is not set. ルートの .env を確認してください。');
}

// postgres.js のコネクション。seed/CLI で確実にクローズできるよう client も公開する。
// drizzle() はこの接続を包んで型付きのクエリビルダにするだけで、
// 接続の生存管理は postgres.js 側が持つ。長時間動くサーバーは
// 接続を張りっぱなしにしてよいが、CLI は end() しないとプロセスが終わらない。
export const queryClient = postgres(url);
export const db = drizzle(queryClient, { schema });
export { schema };
export type Database = typeof db;
