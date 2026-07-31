import type { Task, User } from '@repo/db';
import type { TaskDto, UserDto } from '@repo/shared';

/**
 * DB の行 → API レスポンスの変換。
 *
 * 「返さないものを書かない」のではなく「返すものだけを書く」形にしているのが要点。
 * スプレッド（{ ...user }）で組み立てると、後で列を追加したときに
 * 意図せず外部へ出てしまう。明示列挙なら列追加時にここは変わらず、安全側に倒れる。
 *
 * Date → ISO 文字列の変換もここで行う。JSON に Date 型は無いため、
 * 変換場所を1箇所に決めておかないと形式が揺れる。
 */

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
