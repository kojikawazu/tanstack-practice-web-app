import { z } from 'zod';
import {
  SORT_DIRECTIONS,
  TASK_PRIORITY,
  TASK_SORT_FIELDS,
  TASK_STATUS,
} from './enums';

export const taskStatusSchema = z.enum(TASK_STATUS);
export const taskPrioritySchema = z.enum(TASK_PRIORITY);

/** タスク作成の入力（docs/06 のバリデーション表に一致） */
export const createTaskSchema = z.object({
  title: z.string().trim().min(1).max(120),
  description: z.string().max(2000).default(''),
  status: taskStatusSchema.default('todo'),
  priority: taskPrioritySchema.default('medium'),
  // ISO 8601 日付文字列（任意）。null で「期限なし」。
  dueDate: z.string().datetime({ offset: true }).nullable().default(null),
});
export type CreateTaskInput = z.infer<typeof createTaskSchema>;

/** タスク更新（部分更新） */
export const updateTaskSchema = createTaskSchema.partial();
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;

/**
 * 一覧クエリ。ソート・フィルタ・カーソルページング。
 * TanStack Router の validateSearch と api の zValidator('query') で共有する。
 */
export const taskQuerySchema = z.object({
  status: taskStatusSchema.optional(),
  priority: taskPrioritySchema.optional(),
  sortField: z.enum(TASK_SORT_FIELDS).default('createdAt'),
  sortDir: z.enum(SORT_DIRECTIONS).default('desc'),
  /** カーソル: 前ページ最後の `${sortValue}|${id}`（複合キーでタイブレーク） */
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});
export type TaskQuery = z.infer<typeof taskQuerySchema>;

/** フィルタ・ソートのみ（cursor/limit を除いた URL 保持用） */
export const taskFiltersSchema = taskQuerySchema.pick({
  status: true,
  priority: true,
  sortField: true,
  sortDir: true,
});
export type TaskFilters = z.infer<typeof taskFiltersSchema>;
