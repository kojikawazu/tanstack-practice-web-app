import { and, asc, desc, eq, gt, isNull, lt, or, sql, type SQL } from 'drizzle-orm';
import { db, tasks } from '@repo/db';
import type { NewTask, Task } from '@repo/db';
import type { CreateTaskInput, TaskQuery, UpdateTaskInput } from '@repo/shared';

const sortColumns = {
  createdAt: tasks.createdAt,
  dueDate: tasks.dueDate,
  priority: tasks.priority,
  title: tasks.title,
} as const;

interface Cursor {
  v: string | null;
  id: string;
}

function encodeCursor(c: Cursor): string {
  return Buffer.from(JSON.stringify(c)).toString('base64url');
}

function decodeCursor(s: string): Cursor | null {
  try {
    const parsed = JSON.parse(Buffer.from(s, 'base64url').toString()) as Cursor;
    if (typeof parsed.id !== 'string') return null;
    return parsed;
  } catch {
    return null;
  }
}

/** 行から現在のソートキー値を取り出して文字列化（カーソル用） */
function cursorValue(field: TaskQuery['sortField'], row: Task): string | null {
  switch (field) {
    case 'createdAt':
      return row.createdAt.toISOString();
    case 'dueDate':
      return row.dueDate ? row.dueDate.toISOString() : null;
    case 'priority':
      return row.priority;
    case 'title':
      return row.title;
  }
}

/** ORDER BY 式（dueDate は NULLS LAST 固定 + id でタイブレーク） */
function buildOrderBy(field: TaskQuery['sortField'], dir: 'asc' | 'desc'): SQL[] {
  const col = sortColumns[field];
  const idTie = dir === 'asc' ? asc(tasks.id) : desc(tasks.id);
  if (field === 'dueDate') {
    const primary = dir === 'asc' ? sql`${col} asc nulls last` : sql`${col} desc nulls last`;
    return [primary, idTie];
  }
  return [dir === 'asc' ? asc(col) : desc(col), idTie];
}

/** キーセット(カーソル)ページングの WHERE 述語。(sortValue, id) の複合キーで境界を表現する。 */
function keysetPredicate(
  field: TaskQuery['sortField'],
  dir: 'asc' | 'desc',
  cursor: Cursor,
): SQL | undefined {
  const col = sortColumns[field];
  const cmp = dir === 'asc' ? gt : lt;
  const idCmpAfterTie = dir === 'asc' ? gt(tasks.id, cursor.id) : lt(tasks.id, cursor.id);

  // dueDate は nullable + NULLS LAST のため特別扱い
  if (field === 'dueDate') {
    if (cursor.v === null) {
      // 既に null 領域。null 同士は id 順で続きを取る
      return and(isNull(tasks.dueDate), idCmpAfterTie);
    }
    const v = new Date(cursor.v);
    return or(
      cmp(tasks.dueDate, v),
      and(eq(tasks.dueDate, v), idCmpAfterTie),
      // 非 null 領域の次に null 領域（NULLS LAST）が続く
      isNull(tasks.dueDate),
    );
  }

  // 非 null カラム（createdAt は Date、title/priority は string）
  const value: unknown = field === 'createdAt' ? new Date(cursor.v as string) : cursor.v;
  return or(cmp(col, value as never), and(eq(col, value as never), idCmpAfterTie));
}

export const taskRepository = {
  async list(
    userId: string,
    q: TaskQuery,
  ): Promise<{ items: Task[]; nextCursor: string | null }> {
    const conditions: SQL[] = [eq(tasks.userId, userId)];
    if (q.status) conditions.push(eq(tasks.status, q.status));
    if (q.priority) conditions.push(eq(tasks.priority, q.priority));

    const cursor = q.cursor ? decodeCursor(q.cursor) : null;
    if (cursor) {
      const predicate = keysetPredicate(q.sortField, q.sortDir, cursor);
      if (predicate) conditions.push(predicate);
    }

    const rows = await db
      .select()
      .from(tasks)
      .where(and(...conditions))
      .orderBy(...buildOrderBy(q.sortField, q.sortDir))
      .limit(q.limit + 1);

    let nextCursor: string | null = null;
    if (rows.length > q.limit) {
      const last = rows[q.limit - 1]!;
      rows.length = q.limit;
      nextCursor = encodeCursor({ v: cursorValue(q.sortField, last), id: last.id });
    }
    return { items: rows, nextCursor };
  },

  async findById(id: string): Promise<Task | undefined> {
    const rows = await db.select().from(tasks).where(eq(tasks.id, id)).limit(1);
    return rows[0];
  },

  async create(userId: string, input: CreateTaskInput): Promise<Task> {
    const values: NewTask = {
      userId,
      title: input.title,
      description: input.description,
      status: input.status,
      priority: input.priority,
      dueDate: input.dueDate ? new Date(input.dueDate) : null,
    };
    const rows = await db.insert(tasks).values(values).returning();
    return rows[0]!;
  },

  async update(id: string, input: UpdateTaskInput): Promise<Task | undefined> {
    const patch: Partial<NewTask> = {};
    if (input.title !== undefined) patch.title = input.title;
    if (input.description !== undefined) patch.description = input.description;
    if (input.status !== undefined) patch.status = input.status;
    if (input.priority !== undefined) patch.priority = input.priority;
    if (input.dueDate !== undefined) patch.dueDate = input.dueDate ? new Date(input.dueDate) : null;

    if (Object.keys(patch).length === 0) {
      return this.findById(id);
    }
    const rows = await db.update(tasks).set(patch).where(eq(tasks.id, id)).returning();
    return rows[0];
  },

  async delete(id: string): Promise<void> {
    await db.delete(tasks).where(eq(tasks.id, id));
  },
};
