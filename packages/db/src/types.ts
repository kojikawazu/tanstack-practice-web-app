/**
 * スキーマから導出する型。手で interface を書かないのが要点で、
 * schema.ts を変更すればここも自動的に追従し、定義のずれが起きない。
 *
 * $inferSelect と $inferInsert は用途が違う。
 * - Select … 取得した行の型。既定値も採番済みなので全項目が揃う
 * - Insert … 挿入時の型。既定値や自動採番の列は省略可能になる
 * 例えば id や createdAt は Select では必須、Insert では任意。
 */
import type { sessions, tasks, users } from './schema';

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type Session = typeof sessions.$inferSelect;
export type NewSession = typeof sessions.$inferInsert;

export type Task = typeof tasks.$inferSelect;
export type NewTask = typeof tasks.$inferInsert;
