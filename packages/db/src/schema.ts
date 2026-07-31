import { relations } from 'drizzle-orm';
import {
  index,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import { TASK_PRIORITY, TASK_STATUS } from '@repo/shared/enums';

/**
 * Drizzle のスキーマ定義。このファイルが DB 構造の「正」。
 *
 * 手順は schema.ts の編集 → `pnpm db:generate`（差分から SQL を生成）
 * → `pnpm db:migrate`（適用）の順。生成された SQL を手で直すと
 * スキーマ定義と実際の DB がずれ、次回の差分生成が壊れる。
 *
 * TS 側は camelCase、DB 側は snake_case という命名の使い分けを、
 * `uuid('id')` のように文字列引数で対応付けている。
 */

// 値域は @repo/shared の単一定数を流用（Zod と DB で一致させる）。
// これにより「Zod は通るが DB の enum に無い」といった不整合が起きない。
export const taskStatus = pgEnum('task_status', TASK_STATUS);
export const taskPriority = pgEnum('task_priority', TASK_PRIORITY);

export const users = pgTable(
  'users',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    email: varchar('email', { length: 255 }).notNull().unique(),
    passwordHash: varchar('password_hash').notNull(),
    name: varchar('name', { length: 50 }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('users_email_idx').on(t.email)],
);

/**
 * セッション表。認証状態をサーバー側で保持するための実体。
 * onDelete: 'cascade' により、ユーザー削除時にセッションも自動で消える
 * （孤立行が残らないよう DB 側の制約で担保する）。
 */
export const sessions = pgTable(
  'sessions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('sessions_user_id_idx').on(t.userId)],
);

export const tasks = pgTable(
  'tasks',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    title: varchar('title', { length: 120 }).notNull(),
    description: text('description').notNull().default(''),
    status: taskStatus('status').notNull().default('todo'),
    priority: taskPriority('priority').notNull().default('medium'),
    dueDate: timestamp('due_date', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    // $onUpdate は Drizzle が UPDATE のたびに値を差し込む仕組み。
    // DB のトリガーではなくアプリ側で解決しているため、
    // Drizzle を通さない直接の UPDATE では更新されない点に注意。
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    index('tasks_user_id_idx').on(t.userId),
    // ソート/フィルタ用の複合インデックス（userId スコープ + キー）。
    // 列の順序に意味がある。必ず userId で絞ってから並べ替えるので、
    // (userId, キー) の順にすると絞り込みと整列を索引だけで処理できる。
    // 逆順だと userId での絞り込みに索引が効かない。
    index('tasks_user_status_idx').on(t.userId, t.status),
    index('tasks_user_priority_idx').on(t.userId, t.priority),
    index('tasks_user_created_idx').on(t.userId, t.createdAt),
    index('tasks_user_due_idx').on(t.userId, t.dueDate),
  ],
);

/**
 * リレーション定義。外部キー制約（references）とは別物で、
 * こちらは Drizzle のクエリ API（db.query.users.findMany({ with: ... })）で
 * 関連データを引くための宣言。本アプリは明示的な select を使っているため
 * 現状は未使用だが、テーブル間の関係を読み取れる資料として残している。
 */
export const usersRelations = relations(users, ({ many }) => ({
  sessions: many(sessions),
  tasks: many(tasks),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, { fields: [sessions.userId], references: [users.id] }),
}));

export const tasksRelations = relations(tasks, ({ one }) => ({
  user: one(users, { fields: [tasks.userId], references: [users.id] }),
}));
