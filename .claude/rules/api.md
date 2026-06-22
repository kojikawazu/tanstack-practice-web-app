---
description: Hono バックエンド API 設計・ルート構成
globs: "apps/api/src/**"
---

# API ルール（Hono）

## アーキテクチャ

- ルートベースのモジュラー構成
- Service 層でビジネスロジック、Repository 層でデータアクセスを分離する。
- Validator スキーマ（Zod）でリクエストバリデーション。

## ディレクトリ構成

```
src/
├── index.ts           # エントリポイント
├── app.ts             # Hono アプリ定義
├── routes/            # ルートハンドラー
├── middleware/         # カスタムミドルウェア
├── services/          # ビジネスロジック
├── repositories/      # データアクセス（Drizzle）
├── types/             # 型定義
├── lib/               # ユーティリティ
└── validators/        # Zod バリデーションスキーマ
```

## 共通方針

- RESTful 設計（リソース指向エンドポイント）
- レスポンス形式: JSON（`c.json()`）
- バリデーション: `@hono/zod-validator` ミドルウェア（スキーマは `packages/shared` と共有）
- ミドルウェア: `cors()`, `logger()`, `secureHeaders()` を標準で適用
- 認証: HttpOnly セッション Cookie をミドルウェアで検証。タスク等のリソースはサーバー側で `user_id` を突合する。
- 例外: グローバル `onError` + `notFound()` ハンドラー。`HTTPException` ベース。
- 環境変数: `process.env` または Hono `env()` ヘルパー
- センシティブ情報をログに含めない
