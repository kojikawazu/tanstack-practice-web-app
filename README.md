# TanStack Practice Web App

TanStack を学習・検証するための練習用 Web アプリケーション

TanStack 5本柱（**Router / Query / Table / Virtual / Form**）を、認証付きタスク管理アプリを通して実践的に試すモノレポです。

## 概要

- **フロント** (`apps/web`): React + Vite + TypeScript + TanStack(Router/Query/Table/Virtual/Form) + TailwindCSS
- **API** (`apps/api`): Hono + セッション Cookie 認証 + タスク CRUD
- **DB**: PostgreSQL（Docker） / Drizzle ORM（`packages/db`）
- **共有** (`packages/shared`): Zod スキーマ・型を front/api で共有
- **モノレポ**: pnpm workspaces + Turborepo

仕様の詳細は [docs/README.md](docs/README.md) を参照。

## セットアップ

前提: Node.js 24+ / pnpm 10+ / Docker

```bash
pnpm install
cp .env.example .env          # 必要に応じて値を編集
pnpm db:up                    # PostgreSQL コンテナ起動（docker compose）
pnpm db:generate              # Drizzle マイグレーション生成
pnpm db:migrate               # マイグレーション適用
pnpm db:seed                  # デモユーザー + タスク5000件を投入
```

> `pnpm install` 時に esbuild / SWC / Tailwind のビルドスクリプト承認を求められたら `pnpm approve-builds` で許可する（root の `pnpm.onlyBuiltDependencies` に設定済み）。

**デモアカウント**（seed 投入後）: `demo@example.com` / `password123`

## 使い方

```bash
pnpm dev                      # web(:5173) と api(:3000) を並行起動（Turborepo）
```

ブラウザで http://localhost:5173 を開く。

### テスト

```bash
pnpm test                     # 全ワークスペースのユニット/統合（Vitest）
pnpm --filter web test:e2e    # E2E（Playwright。事前に chromium 取得が必要）
#   pnpm --filter web exec playwright install chromium
```

### その他

```bash
pnpm typecheck                # 型チェック
pnpm lint                     # ESLint
pnpm db:down                  # DB コンテナ停止
```

## ドキュメント

- 仕様書一覧: [docs/README.md](docs/README.md)
- 開発ルール: `.claude/rules/`
