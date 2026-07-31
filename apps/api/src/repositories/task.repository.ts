import { and, asc, desc, eq, gt, isNull, lt, or, sql, type SQL } from 'drizzle-orm';
import { db, tasks } from '@repo/db';
import type { NewTask, Task } from '@repo/db';
import type { CreateTaskInput, TaskQuery, UpdateTaskInput } from '@repo/shared';

/**
 * タスクのデータアクセス層。このファイルの主題はキーセットページング。
 *
 * よくある OFFSET/LIMIT 方式には2つの弱点がある。
 * 1. OFFSET が大きいほど遅い。DB は読み飛ばす行も一度は走査するため。
 * 2. ページ送りの最中に行が挿入・削除されると、境界の行が重複したり
 *    飛ばされたりする（OFFSET は「位置」であって「どの行か」ではないため）。
 *
 * キーセット方式は「前ページの最後の行の値」を起点に `WHERE 値 > 起点` で
 * 続きを取る。常に索引を使って必要な範囲だけを読むので深いページでも
 * 速度が落ちず、途中で行が増減しても境界がずれない。
 */

// ソート可能な列のホワイトリスト。クライアントから来た文字列を
// そのまま列名に使わず、ここに定義した列オブジェクトへ変換する
// （任意の列名を渡されるのを防ぐ）。
const sortColumns = {
  createdAt: tasks.createdAt,
  dueDate: tasks.dueDate,
  priority: tasks.priority,
  title: tasks.title,
} as const;

/**
 * カーソルの中身。v はソートキーの値、id はタイブレーク用。
 * この2つを組にすることで「どの行の次から」を一意に表せる。
 * base64url にするのは中身を隠すためではなく（デコードすれば読める）、
 * URL に安全に載せられる形にするため。
 */
interface Cursor {
  v: string | null;
  id: string;
}

function encodeCursor(c: Cursor): string {
  return Buffer.from(JSON.stringify(c)).toString('base64url');
}

// カーソルはクライアントから届く（＝改変されうる）値なので、
// 壊れていても例外にせず null を返し、先頭から取り直す扱いにする。
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

/**
 * ORDER BY 式（dueDate は NULLS LAST 固定 + id でタイブレーク）
 *
 * 必ず id を第2キーに添えるのがキーセット方式の前提条件。
 * 例えば priority でソートすると 'high' の行が大量に並ぶが、
 * その中の順序が不定だと DB の気分次第で並びが変わり、
 * ページを跨いだ瞬間に同じ行が二度出たり消えたりする。
 * id で完全に順序を確定させることで、それを防いでいる。
 */
function buildOrderBy(field: TaskQuery['sortField'], dir: 'asc' | 'desc'): SQL[] {
  const col = sortColumns[field];
  const idTie = dir === 'asc' ? asc(tasks.id) : desc(tasks.id);
  if (field === 'dueDate') {
    const primary = dir === 'asc' ? sql`${col} asc nulls last` : sql`${col} desc nulls last`;
    return [primary, idTie];
  }
  return [dir === 'asc' ? asc(col) : desc(col), idTie];
}

/**
 * キーセット(カーソル)ページングの WHERE 述語。(sortValue, id) の複合キーで境界を表現する。
 *
 * 基本形は「ソート値が起点より先」OR「ソート値が同じで id が起点より後」。
 * 前半で次の値へ進み、後半で同値グループの続きを拾う。
 * ソート方向によって比較演算子が > と < で入れ替わる（cmp）。
 */
function keysetPredicate(
  field: TaskQuery['sortField'],
  dir: 'asc' | 'desc',
  cursor: Cursor,
): SQL | undefined {
  const col = sortColumns[field];
  const cmp = dir === 'asc' ? gt : lt;
  const idCmpAfterTie = dir === 'asc' ? gt(tasks.id, cursor.id) : lt(tasks.id, cursor.id);

  /**
   * dueDate は nullable + NULLS LAST のため特別扱い。
   * SQL では NULL との比較（NULL > 値）が真にも偽にもならず UNKNOWN になるため、
   * 素朴な不等号では NULL 行を正しく跨げない。
   * 「期限あり」の領域を全て出し切ってから「期限なし」の領域へ移る、
   * という並び順を、条件式で明示的に表現している。
   */
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
    // 所有者スコープは常に最初の条件。他の絞り込みは任意だが、これは必須。
    // schema.ts の複合インデックスも (userId, ソートキー) の順で張ってあり、
    // この WHERE + ORDER BY の組み合わせが索引だけで解決できるようにしている。
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
      // limit + 1 件取るのが定石。1件多く取れたら「次がある」と判断でき、
      // 総件数を数える COUNT クエリを別に投げずに済む。
      .limit(q.limit + 1);

    let nextCursor: string | null = null;
    if (rows.length > q.limit) {
      // 余分に取れた場合のみ次カーソルを作る。返すのは limit 件までに切り詰め、
      // カーソルは「返した最後の行」から作る（1件多い方の行ではない）。
      // ここを間違えると1件飛ばしになる。
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
