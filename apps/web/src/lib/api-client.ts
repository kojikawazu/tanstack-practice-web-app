import type { ApiErrorBody } from '@repo/shared';

/**
 * API 通信の共通クライアント。
 *
 * TanStack Query は「いつ・どう取得するか」を管理するライブラリで、
 * 通信そのものは持たない。取得手段（ここでは fetch）は自前で用意し、
 * queryFn / mutationFn から呼び出す、という分担になる。
 */

// Vite の環境変数はビルド時に埋め込まれ、VITE_ 接頭辞のものだけが
// クライアントへ公開される（秘密情報を置いてはいけない仕組み）。
const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000';

/** API エラー。フォームのフィールドエラーマッピングにも使う。 */
export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly fields?: Record<string, string[]>,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  // credentials:'include' で別オリジン(:3000)へ HttpOnly セッション Cookie を送る。
  // 既定の 'same-origin' のままだと Cookie が送られず、全て 401 になる。
  // サーバー側も cors({ credentials: true }) と対で設定が必要。
  const res = await fetch(`${BASE_URL}${path}`, { credentials: 'include', ...init });

  // 204 No Content は本文が無いので、json() を呼ぶと例外になる（DELETE の応答）
  if (res.status === 204) return undefined as T;

  const data: unknown = await res.json().catch(() => null);
  // fetch は 4xx/5xx でも reject しない。ここで明示的に例外へ変換することで、
  // Query 側の isError / onError が期待どおり動くようにしている。
  if (!res.ok) {
    const body = data as ApiErrorBody | null;
    throw new ApiError(
      res.status,
      body?.error?.code ?? 'ERROR',
      body?.error?.message ?? 'リクエストに失敗しました',
      body?.error?.fields,
    );
  }
  return data as T;
}

function jsonInit(method: string, body?: unknown): RequestInit {
  return {
    method,
    headers: { 'content-type': 'application/json' },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  };
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) => request<T>(path, jsonInit('POST', body)),
  patch: <T>(path: string, body: unknown) => request<T>(path, jsonInit('PATCH', body)),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
};
