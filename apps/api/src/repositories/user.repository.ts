import { eq } from 'drizzle-orm';
import { db, users } from '@repo/db';
import type { NewUser, User } from '@repo/db';

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
