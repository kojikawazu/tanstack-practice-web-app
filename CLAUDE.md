# TanStack Practice Web App

TanStack を学習・検証するための練習用 Web アプリケーション

## Rules

明示的な指示がなくても、`.claude/rules/` 内のルールを常に守ってください。

| ファイル | スコープ | 内容 |
|---------|---------|------|
| shortcuts.md | 全体 | 指示ショートカット（PR出して、PR承認しました 等） |
| workflow.md | 全体 | 開発フロー（ブランチ運用・テスト必須） |
| quality-gate.md | 全体 | 品質ゲート（セルフレビュー・設計/実装レビュー） |
| documentation.md | 全体 | ドキュメント更新ルール |
| git.md | 全体 | GitHub Flow・ブランチ命名・push 禁止物 |
| testing.md | 全体 | テスト分類・原則・テストツール（Vitest/Playwright） |
| coding-standards.md | 全体 | コーディング規約（TypeScript strict・pnpm・ESLint/Prettier） |
| error-handling.md | 全体 | エラーハンドリング方針（バリデーション・例外・ログ） |
| security.md | 全体 | セキュリティ設計（認証・通信・インジェクション対策・シークレット管理） |
| frontend.md | apps/web | React + Vite + TanStack の設計・コンポーネント規約 |
| api.md | apps/api | Hono バックエンド API 設計・ルート構成 |
| database.md | packages/db, apps/api | Drizzle ORM 命名規約・マイグレーション・クエリ規約 |
