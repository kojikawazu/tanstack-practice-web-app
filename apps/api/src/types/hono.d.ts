import type { UserDto } from '@repo/shared';

// 認証ミドルウェアが c.set('user', ...) で格納する型を拡張
declare module 'hono' {
  interface ContextVariableMap {
    user: UserDto;
  }
}
