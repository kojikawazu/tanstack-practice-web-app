/**
 * タスクのステータス・優先度の値域。
 * この単一定数を Drizzle の pgEnum と Zod の z.enum の両方に流用し、
 * DB / API / フロントで値がズレないようにする（[[database]] / [[security]] ルール準拠）。
 */
export const TASK_STATUS = ['todo', 'in_progress', 'done'] as const;
export type TaskStatus = (typeof TASK_STATUS)[number];

export const TASK_PRIORITY = ['low', 'medium', 'high'] as const;
export type TaskPriority = (typeof TASK_PRIORITY)[number];

/** 一覧のソート可能なキー */
export const TASK_SORT_FIELDS = ['createdAt', 'dueDate', 'priority', 'title'] as const;
export type TaskSortField = (typeof TASK_SORT_FIELDS)[number];

export const SORT_DIRECTIONS = ['asc', 'desc'] as const;
export type SortDirection = (typeof SORT_DIRECTIONS)[number];
