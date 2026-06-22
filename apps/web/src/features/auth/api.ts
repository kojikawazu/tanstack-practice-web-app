import { queryOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import type { LoginInput, RegisterInput, UserDto } from '@repo/shared';
import { api, ApiError } from '@/lib/api-client';
import { queryKeys } from '@/lib/query-keys';

/** /me。未認証(401)は null を返す（loader のガード判定に使う）。 */
export async function fetchMe(): Promise<UserDto | null> {
  try {
    return await api.get<UserDto>('/api/auth/me');
  } catch (e) {
    if (e instanceof ApiError && e.status === 401) return null;
    throw e;
  }
}

export const meQueryOptions = () =>
  queryOptions({
    queryKey: queryKeys.me,
    queryFn: fetchMe,
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

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
