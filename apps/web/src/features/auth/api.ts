import { queryOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import type { LoginInput, RegisterInput, UserDto } from '@repo/shared';
import { api, ApiError } from '@/lib/api-client';
import { queryKeys } from '@/lib/query-keys';

/**
 * /me。未認証(401)は null を返す（loader のガード判定に使う）。
 *
 * 401 を例外のままにしないのが要点。ガードにとって「未ログイン」は
 * 想定内の分岐であって異常ではないため、null という値に変換して
 * `if (!user)` で扱えるようにしている。それ以外のエラーは再送出する。
 *
 * セッションは HttpOnly Cookie にあり JavaScript から読めないので、
 * ログイン状態はこのようにサーバーへ問い合わせて判定する。
 */
export async function fetchMe(): Promise<UserDto | null> {
  try {
    return await api.get<UserDto>('/api/auth/me');
  } catch (e) {
    if (e instanceof ApiError && e.status === 401) return null;
    throw e;
  }
}

/**
 * ログインユーザー情報。全ルートのガードが毎回参照するため、
 * staleTime を 5 分と長めに取って画面遷移のたびの再取得を避ける
 * （QueryClient 既定の 30 秒を、この用途に合わせて上書きしている）。
 */
export const meQueryOptions = () =>
  queryOptions({
    queryKey: queryKeys.me,
    queryFn: fetchMe,
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

/**
 * ログイン。成功レスポンスのユーザーを setQueryData で me キャッシュへ直接書く。
 * invalidateQueries だと /me を取り直す往復が1回増えるが、
 * ここは応答が既に最新のユーザーなので、そのまま反映すれば足りる。
 */
export function useLogin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: LoginInput) => api.post<UserDto>('/api/auth/login', input),
    onSuccess: (user) => qc.setQueryData(queryKeys.me, user),
  });
}

export function useRegister() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: RegisterInput) => api.post<UserDto>('/api/auth/register', input),
    onSuccess: (user) => qc.setQueryData(queryKeys.me, user),
  });
}

/**
 * ログアウト。qc.clear() でキャッシュを全消去するのが重要。
 * これを怠ると、別ユーザーでログインした直後に前のユーザーの
 * タスク一覧が一瞬表示されうる（キャッシュが残っているため）。
 * 認証状態が変わるときはキャッシュを破棄する、と覚えるとよい。
 */
export function useLogout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.post<{ ok: boolean }>('/api/auth/logout'),
    onSuccess: () => {
      qc.setQueryData(queryKeys.me, null);
      qc.clear();
    },
  });
}
