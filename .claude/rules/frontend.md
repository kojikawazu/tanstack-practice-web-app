---
description: React (Vite) フロントエンド設計・コンポーネント規約
globs: "apps/web/src/components/**,apps/web/src/routes/**,apps/web/src/hooks/**,apps/web/src/lib/**"
---

# フロントエンドルール（React + Vite + TanStack）

## コンポーネント設計

プロジェクト規模・ドメイン数に応じて以下のいずれかを選択する:

| パターン | 構成 | 採用基準 |
|---|---|---|
| **アトミックデザイン** | Atoms / Molecules / Organisms / Pages | 小〜中規模・ドメインが少ない |
| **ドメイン別構成** | features/ 配下にドメイン単位で分割 | 中〜大規模・ドメインが多い |

## ロジック分離

- ステートフルなロジックは**カスタムフック**（`hooks/`）に切り出す。コンポーネントは UI 描画に専念する。
- ユーティリティ・API クライアント・定数は `lib/` に配置する。

## TanStack 利用方針

- **Router**: ファイルベース or コード定義のルートを `routes/` に配置。認証ガードは `beforeLoad` で実施し、loader でデータをプリフェッチする。
- **Query**: サーバー状態は TanStack Query で一元管理する（`useState` でのサーバーデータ保持を避ける）。更新は楽観的更新 + 失敗時ロールバック、`invalidateQueries` でキャッシュ整合。
- **Table / Virtual**: 一覧は TanStack Table で列定義・ソート/フィルタを宣言的に組む。大量行は TanStack Virtual で仮想化する。
- **Form**: フォームは TanStack Form + Zod スキーマ（`packages/shared`）で構築し、検証はサーバーと同一スキーマを共有する。

## スタイリング

- **TailwindCSS**（ユーティリティクラス）でスタイリングする。アドホックな CSS ファイルの追加は最小限にする。
- 繰り返すクラスの組み合わせはコンポーネントに切り出して再利用する（`@apply` の濫用は避ける）。

## インポート

- `@/` パスエイリアスを使用する（Vite + tsconfig で設定済み）。

## テスト

- ユニットテスト: Vitest + @testing-library/react
- E2E: Playwright（`e2e/` ディレクトリ）
- Base URL: `http://localhost:5173`
