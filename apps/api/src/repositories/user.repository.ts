import { eq } from 'drizzle-orm';
import { db, users } from '@repo/db';
import type { NewUser, User } from '@repo/db';

/**
 * ユーザーのデータアクセス層。
 *
 * eq(users.email, email) のようにクエリビルダを使うことで、値は
 * プレースホルダとして DB へ渡る。文字列連結で SQL を組み立てないため、
 * SQL インジェクションが原理的に成立しない。
 *
 * 見つからない場合に例外ではなく undefined を返すのは、
 * 「存在しない」が異常ではなく呼び出し側の分岐材料だから
 * （register では重複チェック、login では認証失敗の判定に使う）。
 */
export const userRepository = {
  async findByEmail(email: string): Promise<User | undefined> {
    const rows = await db.select().from(users).where(eq(users.email, email)).limit(1);
    return rows[0];
  },

  async findById(id: string): Promise<User | undefined> {
    const rows = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return rows[0];
  },

  async create(data: NewUser): Promise<User> {
    const rows = await db.insert(users).values(data).returning();
    return rows[0]!;
  },
};
