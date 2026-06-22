import type { TaskFilters } from '@repo/shared';

/** Query キーの一元管理（loader と component で同じキーを共有する） */
export const queryKeys = {
  me: ['me'] as const,
  taskList: (filters: TaskFilters) => ['tasks', filters] as const,
  taskDetail: (id: string) => ['task', id] as const,
};
