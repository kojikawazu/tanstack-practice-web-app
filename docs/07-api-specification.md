# API 仕様書

エンドポイント・リクエスト/レスポンス形式・認証・エラーハンドリングを定義する。データモデルは [`05-data-specification.md`](./05-data-specification.md)、認証/認可方針は [`06-security-specification.md`](./06-security-specification.md) を参照。

## 目次

- [前提](#前提)
- [エンドポイント一覧](#エンドポイント一覧)
- [リクエスト/レスポンス形式](#リクエストレスポンス形式)
- [認証・エラーハンドリング](#認証エラーハンドリング)

## 前提

- 方式: **REST**（Hono で実装）。
- ベース URL: `VITE_API_BASE_URL`（例 `http://localhost:3000`）配下に `/api`。
- 認証: HttpOnly セッション Cookie。フロントは `credentials: 'include'` で送信。
- リクエスト/レスポンスとも JSON。バリデーションは front/api 共有の Zod スキーマ（[`06`](./06-security-specification.md#入力バリデーション)）。

## エンドポイント一覧

| メソッド | パス | 用途 | 認証 |
|---------|------|------|------|
| POST | `/api/auth/register` | ユーザー登録 | 不要 |
| POST | `/api/auth/login` | ログイン（Cookie 発行） | 不要 |
| POST | `/api/auth/logout` | ログアウト（セッション破棄） | 必須 |
| GET | `/api/auth/me` | 現在のユーザー取得（認証状態確認） | 必須 |
| GET | `/api/tasks` | タスク一覧（ソート/フィルタ/ページング） | 必須 |
| POST | `/api/tasks` | タスク作成 | 必須 |
| GET | `/api/tasks/:id` | タスク詳細 | 必須 |
| PATCH | `/api/tasks/:id` | タスク更新 | 必須 |
| DELETE | `/api/tasks/:id` | タスク削除 | 必須 |

`GET /api/tasks` のクエリパラメータ（想定）: `status` / `priority` / `sort`（例 `dueDate:asc`）/ `cursor` または `page` + `limit`。大量データはカーソルベースを推奨（TanStack Virtual と相性が良い）。

## リクエスト/レスポンス形式

```jsonc
// POST /api/auth/login (request)
{ "email": "user@example.com", "password": "********" }

// POST /api/tasks (request)
{ "title": "買い物", "description": "", "status": "todo", "priority": "medium", "dueDate": "2026-07-01" }

// Task (response)
{
  "id": "uuid",
  "title": "買い物",
  "description": "",
  "status": "todo",
  "priority": "medium",
  "dueDate": "2026-07-01T00:00:00Z",
  "createdAt": "2026-06-22T00:00:00Z",
  "updatedAt": "2026-06-22T00:00:00Z"
}

// GET /api/tasks (response, カーソルページング)
{ "items": [ /* Task[] */ ], "nextCursor": "uuid|null" }
```

<!-- 記入: 実装でフィールド名・ページング方式が確定したら整合させる -->

## 認証・エラーハンドリング

- 認証: 各保護エンドポイントで Cookie のセッションを検証。未認証/期限切れは `401`。
- 認可: 他ユーザーのリソースは `403`（もしくは存在秘匿のため `404`）。
- エラーレスポンスは形式を統一する（例 `{ "error": { "code": "...", "message": "..." } }`）。

| ステータス | 状況 |
|-----------|------|
| 400 | バリデーションエラー（Zod 検証失敗） |
| 401 | 未認証・セッション切れ |
| 403 | 権限なし（他ユーザーのリソース） |
| 404 | リソースが存在しない |
| 409 | 一意制約違反（email 重複など） |
| 500 | サーバー内部エラー |
