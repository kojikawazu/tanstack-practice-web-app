import { eq } from 'drizzle-orm';
import { db, sessions } from '@repo/db';
import type { Session } from '@repo/db';

export const sessionRepository = {
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
