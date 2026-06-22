import { z } from 'zod';

/**
 * 認証系の入力スキーマ。バリデーションルールは docs/06-security-specification.md の表に一致させる。
 * api（@hono/zod-validator）と web（TanStack Form）の双方でこのスキーマを共有する。
 */
export const registerSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(255),
  password: z.string().min(8, 'パスワードは8文字以上で入力してください').max(128),
  name: z.string().trim().min(1).max(50),
});
export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(255),
  password: z.string().min(1, 'パスワードを入力してください').max(128),
});
export type LoginInput = z.infer<typeof loginSchema>;
