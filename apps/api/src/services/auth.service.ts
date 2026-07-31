import type { LoginInput, RegisterInput } from '@repo/shared';
import type { Session, User } from '@repo/db';
import { env } from '../env';
import { Errors } from '../lib/errors';
import { hashPassword, verifyPassword } from '../lib/password';
import { sessionRepository } from '../repositories/session.repository';
import { userRepository } from '../repositories/user.repository';

/**
 * 認証のビジネスロジック層。
 * 「パスワードは平文で保存しない」「セッションはサーバー側が正」という
 * 2つの原則がこのファイルに集約されている。
 */
export const authService = {
  async register(input: RegisterInput): Promise<User> {
    // メール重複は 409 Conflict。登録画面では「既に登録済み」と伝えないと
    // 利用者が先へ進めないため、ここは存在を明かす方が妥当と判断している
    // （ログイン失敗時に明かさないのとは扱いが異なる）。
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
    // 「ユーザーが存在しない」と「パスワードが違う」を1つの条件にまとめ、
    // 同じ 401 / 同じ文言を返す。分けて返すと、エラーの違いから
    // メールアドレスの登録有無を調べられてしまう（アカウント列挙）。
    if (!user || !verifyPassword(input.password, user.passwordHash)) {
      throw Errors.invalidCredentials();
    }
    return user;
  },

  // 有効期限はサーバーが決めて DB に保存する。Cookie の expires は
  // ブラウザ側の都合にすぎないので、期限の正本は必ずサーバーに置く。
  async createSession(userId: string): Promise<Session> {
    const expiresAt = new Date(Date.now() + env.SESSION_TTL * 1000);
    return sessionRepository.create(userId, expiresAt);
  },

  /**
   * セッション ID を検証し、有効ならユーザーを返す。期限切れは破棄して null。
   *
   * リクエストのたびに DB を引く方式。JWT と違い「ログアウトしたら即座に
   * 無効化できる」のが利点で、代わりに毎回 DB アクセスが発生する。
   * 例外ではなく null を返すのは、呼び出し側（ミドルウェア）にとって
   * 未認証が想定内の分岐だから。
   */
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
