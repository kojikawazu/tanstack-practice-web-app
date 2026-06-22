import type { LoginInput, RegisterInput } from '@repo/shared';
import type { Session, User } from '@repo/db';
import { env } from '../env';
import { Errors } from '../lib/errors';
import { hashPassword, verifyPassword } from '../lib/password';
import { sessionRepository } from '../repositories/session.repository';
import { userRepository } from '../repositories/user.repository';

export const authService = {
  async register(input: RegisterInput): Promise<User> {
    const existing = await userRepository.findByEmail(input.email);
    if (existing) throw Errors.conflict('このメールアドレスは既に登録されています');
    return userRepository.create({
      email: input.email,
      name: input.name,
      passwordHash: hashPassword(input.password),
    });
  },

  async login(input: LoginInput): Promise<User> {
    const user = await userRepository.findByEmail(input.email);
    if (!user || !verifyPassword(input.password, user.passwordHash)) {
      throw Errors.invalidCredentials();
    }
    return user;
  },

  async createSession(userId: string): Promise<Session> {
    const expiresAt = new Date(Date.now() + env.SESSION_TTL * 1000);
    return sessionRepository.create(userId, expiresAt);
  },

  /** セッション ID を検証し、有効ならユーザーを返す。期限切れは破棄して null。 */
  async validateSession(sessionId: string): Promise<User | null> {
    const session = await sessionRepository.findById(sessionId);
    if (!session) return null;
    if (session.expiresAt.getTime() < Date.now()) {
      await sessionRepository.delete(sessionId);
      return null;
    }
    const user = await userRepository.findById(session.userId);
    return user ?? null;
  },

  async logout(sessionId: string): Promise<void> {
    await sessionRepository.delete(sessionId);
  },
};
