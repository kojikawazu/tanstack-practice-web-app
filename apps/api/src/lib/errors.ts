import type { ContentfulStatusCode } from 'hono/utils/http-status';

/** アプリ共通エラー。onError で統一レスポンスへ整形する。 */
export class AppError extends Error {
  constructor(
    public readonly status: ContentfulStatusCode,
    public readonly code: string,
    message: string,
    public readonly fields?: Record<string, string[]>,
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export const Errors = {
  unauthorized: () => new AppError(401, 'UNAUTHORIZED', '認証が必要です'),
  invalidCredentials: () =>
    new AppError(401, 'INVALID_CREDENTIALS', 'メールアドレスまたはパスワードが違います'),
  forbidden: () => new AppError(403, 'FORBIDDEN', '権限がありません'),
  notFound: (message = '見つかりません') => new AppError(404, 'NOT_FOUND', message),
  conflict: (message: string) => new AppError(409, 'CONFLICT', message),
};
