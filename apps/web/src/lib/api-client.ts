import type { ApiErrorBody } from '@repo/shared';

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
  // credentials:'include' で別オリジン(:3000)へ HttpOnly セッション Cookie を送る
  const res = await fetch(`${BASE_URL}${path}`, { credentials: 'include', ...init });

  if (res.status === 204) return undefined as T;

  const data: unknown = await res.json().catch(() => null);
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
