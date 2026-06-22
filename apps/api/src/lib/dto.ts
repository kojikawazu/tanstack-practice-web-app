import type { Task, User } from '@repo/db';
import type { TaskDto, UserDto } from '@repo/shared';

/** DB の Date を ISO 文字列にして API DTO へ変換する。password_hash は含めない。 */
export function toUserDto(u: User): UserDto {
  return {
    id: u.id,
    email: u.email,
    name: u.name,
    createdAt: u.createdAt.toISOString(),
  };
}

export function toTaskDto(t: Task): TaskDto {
  return {
    id: t.id,
    title: t.title,
    description: t.description,
    status: t.status,
    priority: t.priority,
    dueDate: t.dueDate ? t.dueDate.toISOString() : null,
    createdAt: t.createdAt.toISOString(),
    updatedAt: t.updatedAt.toISOString(),
  };
}
