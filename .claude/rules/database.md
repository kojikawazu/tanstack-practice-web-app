---
description: Drizzle ORM 命名規約・マイグレーション・クエリ規約
globs: "packages/db/**,apps/api/src/repositories/**"
---

# データベースルール（Drizzle ORM / PostgreSQL）

## 命名規約

- テーブル名: snake_case・複数形（例: `users`, `task_comments`）— PostgreSQL の慣習に従う
- カラム名: snake_case（例: `user_id`, `created_at`）
- スキーマ定義側の TS プロパティは camelCase、DB カラムは snake_case にマッピングする（`pgTable` の第2引数で指定）
- スキーマは `packages/db/src/schema.ts` に集約する

## 共通フィールド

すべてのテーブルに以下のフィールドを含める:

| フィールド | 定義 | 説明 |
|-----------|------|------|
| id | `uuid('id').primaryKey().defaultRandom()` | 主キー（UUID） |
| createdAt | `timestamp('created_at').defaultNow().notNull()` | 作成日時 |
| updatedAt | `timestamp('updated_at').defaultNow().notNull().$onUpdate(() => new Date())` | 更新日時 |
| deletedAt | `timestamp('deleted_at')` | 論理削除日時（要件に応じて） |

## 論理削除

- 論理削除を採用する場合: `deletedAt` カラムを追加。
- 読み取りクエリには `isNull(table.deletedAt)` を必ず付与する。
- 共通の絞り込みはクエリヘルパーに切り出して一括適用する。

## マイグレーション

- `drizzle-kit generate` でスキーマ差分からマイグレーションを生成する。
- `drizzle-kit migrate` で適用する（開発・本番とも）。
- 生成された SQL は手動編集しない。**`schema.ts` を正**とし、変更は schema → generate → migrate の順で行う。

## クエリ・型

- Drizzle のクエリビルダ / プレースホルダを使用する。生 SQL の文字列結合は禁止（`sql` テンプレートのパラメータ化を使う）。
- 型は `$inferSelect` / `$inferInsert` から導出し、`packages/shared` 経由で front/api に共有する。
