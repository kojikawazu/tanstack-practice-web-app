# 要件仕様書

機能要件の一覧と受け入れ条件を定義する。背景・目的は [`01-business-requirements.md`](./01-business-requirements.md)、画面仕様は [`03-functional-specification.md`](./03-functional-specification.md) を参照。

## 目次

- [機能要件](#機能要件)
- [データ項目](#データ項目)
- [受け入れ条件](#受け入れ条件)

## 機能要件

各機能の末尾に、主に使う TanStack ライブラリを併記する。

### F-1: ユーザー登録

- メールアドレス・パスワード・名前で新規登録できる。
- 入力は Zod スキーマで検証する（front: TanStack Form / api: Hono ミドルウェア、同一スキーマを共有）。
- 関連: TanStack Form

### F-2: ログイン / ログアウト

- 登録済みユーザーがログインでき、HttpOnly セッション Cookie が発行される。
- ログアウトでセッションを破棄する。
- 関連: TanStack Form / TanStack Query

### F-3: 認証ガード

- 未認証ユーザーは保護ルート（タスク画面）にアクセスできず、ログイン画面へリダイレクトされる。
- ルート遷移前（`beforeLoad`）に認証状態を確認する。
- 関連: TanStack Router

### F-4: タスク作成 / 編集 / 削除

- ログインユーザーは自分のタスクを作成・編集・削除できる。
- タスクは タイトル / 説明 / ステータス / 優先度 / 期限 を持つ。
- 作成・編集は楽観的更新（optimistic update）で即時反映し、失敗時はロールバックする。
- 関連: TanStack Form / TanStack Query

### F-5: タスク一覧（ソート・フィルタ・列制御）

- 自分のタスクを一覧表示し、列ヘッダでソート、ステータス/優先度でフィルタできる。
- 表示する列を切り替えられる。
- 関連: TanStack Table / TanStack Query

### F-6: 大量タスクの仮想スクロール

- 数千件規模のタスク一覧でも、可視領域のみをレンダリングして滑らかにスクロールできる。
- 関連: TanStack Virtual（+ Table）

### F-7: ルート遷移時のデータ先読み

- ルートの loader でタスクデータをプリフェッチし、TanStack Query キャッシュへ載せる。
- 関連: TanStack Router / TanStack Query

## データ項目

主要な入出力データ項目。詳細なスキーマは [`05-data-specification.md`](./05-data-specification.md) を参照。

| 項目 | 必須 | 制約 |
|------|------|------|
| email | ✓ | メール形式・一意 |
| password | ✓ | 8 文字以上（保存はハッシュ） |
| name | ✓ | 1〜50 文字 |
| task.title | ✓ | 1〜120 文字 |
| task.description | - | 0〜2000 文字 |
| task.status | ✓ | `todo` / `in_progress` / `done` |
| task.priority | ✓ | `low` / `medium` / `high` |
| task.dueDate | - | ISO 8601 日付 |

## 受け入れ条件

- 未認証で `/tasks` にアクセスすると `/login` にリダイレクトされる。
- 登録 → ログイン → タスク作成 → 一覧反映 が一連で動作する。
- 他ユーザーのタスクは取得・更新・削除できない（サーバー側で `user_id` により制御。詳細は [`06-security-specification.md`](./06-security-specification.md)）。
- 数千件のタスク一覧でスクロールがカクつかない（仮想化が効いている）。
- バリデーションエラーがフォーム上に項目単位で表示される。
- テスト観点は [`08-test-specification.md`](./08-test-specification.md) を参照。
