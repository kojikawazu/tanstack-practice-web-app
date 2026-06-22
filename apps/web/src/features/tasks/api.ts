import {
  infiniteQueryOptions,
  queryOptions,
  useMutation,
  useQueryClient,
  type InfiniteData,
} from '@tanstack/react-query';
import type {
  CreateTaskInput,
  Paginated,
  TaskDto,
  TaskFilters,
  UpdateTaskInput,
} from '@repo/shared';
import { api } from '@/lib/api-client';
import { queryKeys } from '@/lib/query-keys';

type TaskPage = Paginated<TaskDto>;
type TaskInfinite = InfiniteData<TaskPage, string | null>;

const PAGE_SIZE = 50;

function buildQueryString(filters: TaskFilters, cursor: string | null): string {
  const p = new URLSearchParams();
  if (filters.status) p.set('status', filters.status);
  if (filters.priority) p.set('priority', filters.priority);
  p.set('sortField', filters.sortField);
  p.set('sortDir', filters.sortDir);
  p.set('limit', String(PAGE_SIZE));
  if (cursor) p.set('cursor', cursor);
  return p.toString();
}

/** 一覧（カーソル無限ページング）。loader と component で共有する。 */
export const tasksInfiniteQueryOptions = (filters: TaskFilters) =>
  infiniteQueryOptions({
    queryKey: queryKeys.taskList(filters),
    queryFn: ({ pageParam }) =>
      api.get<TaskPage>(`/api/tasks?${buildQueryString(filters, pageParam)}`),
    initialPageParam: null as string | null,
    getNextPageParam: (last) => last.nextCursor,
  });

export const taskDetailQueryOptions = (id: string) =>
  queryOptions({
    queryKey: queryKeys.taskDetail(id),
    queryFn: () => api.get<TaskDto>(`/api/tasks/${id}`),
  });

function applyPatch(task: TaskDto, input: UpdateTaskInput): TaskDto {
  return {
    ...task,
    ...(input.title !== undefined ? { title: input.title } : {}),
    ...(input.description !== undefined ? { description: input.description } : {}),
    ...(input.status !== undefined ? { status: input.status } : {}),
    ...(input.priority !== undefined ? { priority: input.priority } : {}),
    ...(input.dueDate !== undefined ? { dueDate: input.dueDate } : {}),
  };
}

export function useCreateTask(filters: TaskFilters) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateTaskInput) => api.post<TaskDto>('/api/tasks', input),
    // 作成位置はソート・サーバ採番に依存するため、楽観更新せず invalidate で確定させる
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.taskList(filters) }),
  });
}

/**
 * 更新（楽観的更新）。表示中リスト（filters 指定時）と詳細キャッシュを即時反映し、
 * 失敗時はロールバック、確定時に invalidate する。
 */
export function useUpdateTask(filters?: TaskFilters) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateTaskInput }) =>
      api.patch<TaskDto>(`/api/tasks/${id}`, input),
    onMutate: async ({ id, input }) => {
      const listKey = filters ? queryKeys.taskList(filters) : null;
      const detailKey = queryKeys.taskDetail(id);
      await qc.cancelQueries({ queryKey: ['tasks'] });
      await qc.cancelQueries({ queryKey: detailKey });

      const prevList = listKey ? qc.getQueryData<TaskInfinite>(listKey) : undefined;
      if (listKey && prevList) {
        qc.setQueryData<TaskInfinite>(listKey, {
          ...prevList,
          pages: prevList.pages.map((page) => ({
            ...page,
            items: page.items.map((t) => (t.id === id ? applyPatch(t, input) : t)),
          })),
        });
      }
      const prevDetail = qc.getQueryData<TaskDto>(detailKey);
      if (prevDetail) qc.setQueryData(detailKey, applyPatch(prevDetail, input));

      return { listKey, prevList, detailKey, prevDetail };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.listKey && ctx.prevList) qc.setQueryData(ctx.listKey, ctx.prevList);
      if (ctx?.detailKey && ctx.prevDetail) qc.setQueryData(ctx.detailKey, ctx.prevDetail);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ['tasks'] }),
  });
}

/** 削除（楽観的にリストから除去） */
export function useDeleteTask(filters?: TaskFilters) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete<void>(`/api/tasks/${id}`),
    onMutate: async (id) => {
      const listKey = filters ? queryKeys.taskList(filters) : null;
      await qc.cancelQueries({ queryKey: ['tasks'] });
      const prevList = listKey ? qc.getQueryData<TaskInfinite>(listKey) : undefined;
      if (listKey && prevList) {
        qc.setQueryData<TaskInfinite>(listKey, {
          ...prevList,
          pages: prevList.pages.map((page) => ({
            ...page,
            items: page.items.filter((t) => t.id !== id),
          })),
        });
      }
      return { listKey, prevList };
    },
    onError: (_err, _id, ctx) => {
      if (ctx?.listKey && ctx.prevList) qc.setQueryData(ctx.listKey, ctx.prevList);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ['tasks'] }),
  });
}
