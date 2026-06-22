# タスク・進捗

開発タスク・マイルストーン・進捗を管理する。

## 目次

- [マイルストーン](#マイルストーン)
- [タスク一覧](#タスク一覧)
- [完了済み（実績）](#完了済み実績)
- [将来課題・ブロッカー](#将来課題ブロッカー)

## マイルストーン

| マイルストーン | 目標 | 状態 |
|------|------|------|
| M1: モノレポ・スキャフォールド | TanStack 5本柱が動く土台 | ✅ 完了 |
| M2: 機能の作り込み | フィルタ/ソート/UX 改善 | 未着手 |

## タスク一覧

| タスク | 状態 | 優先度 |
|--------|------|--------|
| UI 部品（モーダル/トースト等）の整備 | 未着手 | 中 |
| CI（GitHub Actions）で lint/typecheck/test/E2E | 未着手 | 中 |
| カーソルページングの dueDate null 周りのテスト追加 | 未着手 | 低 |
| 本番ビルド・デプロイ構成 | 未着手 | 低 |

## 完了済み（実績）

- モノレポ土台（pnpm workspaces + Turborepo / packages: config・shared・db、apps: api・web）
- packages/shared: Zod スキーマ + 型（front/api 共有）
- packages/db: Drizzle スキーマ（users/sessions/tasks）・マイグレーション・seed（5000件）
- apps/api: Hono + セッション Cookie 認証 + タスク CRUD（カーソルページング）。Vitest 統合 11 件
- apps/web: TanStack Router/Query/Table/Virtual/Form + TailwindCSS。Vitest 9 件・Playwright E2E 2 件
- 検証: `docker compose up` → migrate → seed → `pnpm dev` で全フロー動作確認済み

## 将来課題・ブロッカー

- React プラグインは `@vitejs/plugin-react-swc` を採用（babel 版は browserslist が Node 24 で require クラッシュするため）。
- E2E は chromium のローカルインストールが必要（`pnpm --filter web exec playwright install chromium`）。CI 導入時に組み込む。
