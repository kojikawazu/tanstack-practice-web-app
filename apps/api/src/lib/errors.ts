import type { ContentfulStatusCode } from 'hono/utils/http-status';

/**
 * アプリ共通エラー。onError で統一レスポンスへ整形する。
 *
 * status（HTTP ステータス）と code（機械可読な識別子）を両方持つのが要点。
 * ステータスは大分類にすぎず、401 でも「未ログイン」と「認証情報が誤り」では
 * クライアントの出し分けが変わる。code があれば文言に依存せず分岐できる。
 */
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

/**
 * よく使うエラーをファクトリとしてまとめる。
 * 各所で new AppError(...) を書くとステータスや文言が揺れるため、
 * 「どの状況でどのステータスを返すか」の判断をここへ集約している。
 */
export const Errors = {
  unauthorized: () => new AppError(401, 'UNAUTHORIZED', '認証が必要です'),
  invalidCredentials: () =>
    new AppError(401, 'INVALID_CREDENTIALS', 'メールアドレスまたはパスワードが違います'),
  forbidden: () => new AppError(403, 'FORBIDDEN', '権限がありません'),
  notFound: (message = '見つかりません') => new AppError(404, 'NOT_FOUND', message),
  conflict: (message: string) => new AppError(409, 'CONFLICT', message),
};
