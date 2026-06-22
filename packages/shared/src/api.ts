import type { TaskPriority, TaskStatus } from './enums';

/** API が返すユーザー DTO（password_hash は含めない） */
export interface UserDto {
  id: string;
  email: string;
  name: string;
  createdAt: string;
}

/** API が返すタスク DTO（日時は ISO 文字列） */
export interface TaskDto {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string | null;
  createdAt: string;
  updatedAt: string;
}

/** カーソルページングのレスポンス */
export interface Paginated<T> {
  items: T[];
  nextCursor: string | null;
}

/** 統一エラーレスポンス（api の onError が返す形） */
export interface ApiErrorBody {
  error: {
    code: string;
    message: string;
    /** フィールド単位のバリデーションエラー（Zod 由来） */
    fields?: Record<string, string[]>;
  };
}
