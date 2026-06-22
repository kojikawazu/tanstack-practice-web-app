import { z } from 'zod';
import { createTaskSchema, TASK_PRIORITY, TASK_STATUS } from '@repo/shared';

/**
 * フォーム用スキーマ。title/description は共有スキーマの shape を流用し、
 * dueDate のみ <input type="date"> 向けに文字列（YYYY-MM-DD or ''）として扱う。
 * 送信時に dateInputToIso で ISO へ変換する。
 */
export const taskFormSchema = z.object({
  title: createTaskSchema.shape.title,
  description: z.string().max(2000),
  status: z.enum(TASK_STATUS),
  priority: z.enum(TASK_PRIORITY),
  dueDate: z.string(),
});

export type TaskFormValues = z.infer<typeof taskFormSchema>;
