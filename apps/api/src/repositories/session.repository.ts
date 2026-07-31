import { eq } from 'drizzle-orm';
import { db, sessions } from '@repo/db';
import type { Session } from '@repo/db';

/**
 * セッションのデータアクセス層。
 * ここには業務判断（期限切れかどうか等）を置かず、DB 操作だけを担う。
 * 判断は service 層（auth.service.ts の validateSession）の役目。
 */
export const sessionRepository = {
  // returning() で挿入後の行（DB が採番した id や既定値を含む）を受け取る。
  // insert は必ず1行返るので `!` で undefined を外している。
  async create(userId: string, expiresAt: Date): Promise<Session> {
    const rows = await db.insert(sessions).values({ userId, expiresAt }).returning();
    return rows[0]!;
  },

  async findById(id: string): Promise<Session | undefined> {
    const rows = await db.select().from(sessions).where(eq(sessions.id, id)).limit(1);
    return rows[0];
  },

  async delete(id: string): Promise<void> {
    await db.delete(sessions).where(eq(sessions.id, id));
  },
};
