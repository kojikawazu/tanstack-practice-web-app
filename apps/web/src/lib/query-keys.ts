import type { TaskFilters } from '@repo/shared';

/**
 * Query キーの一元管理（loader と component で同じキーを共有する）。
 *
 * キーは配列で、前方一致で範囲指定できるのが要点。
 * `['tasks', filters]` としておけば、invalidateQueries({ queryKey: ['tasks'] })
 * で絞り込み違いの全リストをまとめて無効化できる。
 *
 * 文字列を直書きせずここに集約するのは、キーが1文字でもずれると
 * 「別のキャッシュ」として扱われ、先読みが効かない・更新が反映されないという
 * 原因の分かりにくい不具合になるため。
 */
export const queryKeys = {
  me: ['me'] as const,
  taskList: (filters: TaskFilters) => ['tasks', filters] as const,
  taskDetail: (id: string) => ['task', id] as const,
};
