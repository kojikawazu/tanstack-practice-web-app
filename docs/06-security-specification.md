# セキュリティ仕様書

認証・認可・入力バリデーション・データ保護方針を定義する。

## 目次

- [認証](#認証)
- [認可（権限制御）](#認可権限制御)
- [入力バリデーション](#入力バリデーション)
- [データ保護](#データ保護)
- [脆弱性対策](#脆弱性対策)

## 認証

**サーバーサイドセッション + HttpOnly Cookie 方式**を採用する。

- ログイン成功時、`sessions` テーブルにセッションを作成し、その ID を Cookie で返す。
- Cookie 属性: `HttpOnly` / `Secure`（本番）/ `SameSite=Lax` / 適切な `Max-Age`。
- JS から Cookie を読めないため、トークンを localStorage に置く方式の XSS リスクを回避する。
- 各リクエストで Cookie のセッション ID を検証し、期限切れ・不正なら 401。
- ログアウトでサーバー側セッションを破棄し、Cookie を失効させる。

## 認可（権限制御）

- タスクは所有者（`user_id`）のみ取得・更新・削除できる。**サーバー側で必ず `user_id` を突合**する（クライアントの画面制御だけに依存しない）。
- 他人の `taskId` を直接指定しても 403/404 を返す（IDOR 対策）。
- 認証ガード（TanStack Router `beforeLoad`）はあくまで UX 向上のためであり、権限の最終判定はサーバーが行う。

## 入力バリデーション

- **Zod スキーマを `packages/shared` に定義し、front（TanStack Form）と api（Hono ミドルウェア）の双方で同一スキーマを使用**する。
- サーバー側バリデーションを正とする（クライアント検証はスキップ可能と仮定する）。

| フィールド | ルール |
|-----------|--------|
| email | メール形式・255 文字以内・一意 |
| password | 8 文字以上 |
| name | 1〜50 文字 |
| task.title | 1〜120 文字 |
| task.description | 0〜2000 文字 |
| task.status | `todo` / `in_progress` / `done` のいずれか |
| task.priority | `low` / `medium` / `high` のいずれか |

## データ保護

- パスワードは **scrypt（Node 標準 `node:crypto`）** でハッシュ化して保存する（平文・可逆暗号は禁止）。salt を `randomBytes(16)` で生成し `salt(hex):hash(hex)` 形式で保存、検証は `timingSafeEqual`。ネイティブ依存を避ける選択。代替候補: argon2id。実装は `apps/api/src/lib/password.ts`。
- `SESSION_SECRET` などの秘匿情報は環境変数で管理し、リポジトリにコミットしない（[`../.claude/rules/git.md`](../.claude/rules/git.md)）。
- 秘匿値をフロント（`VITE_` 変数）に渡さない。

## 脆弱性対策

| 脅威 | 対策 |
|------|------|
| XSS | HttpOnly Cookie / React の自動エスケープ / 危険な `dangerouslySetInnerHTML` を避ける |
| CSRF | `SameSite=Lax` Cookie。状態変更系で必要なら CSRF トークンを併用 |
| SQLi | Drizzle のパラメータ化クエリ（生 SQL 連結を避ける） |
| IDOR | サーバー側で `user_id` を突合（[認可](#認可権限制御)参照） |
| ブルートフォース | ログイン試行のレート制限を検討 |
| CORS | `CORS_ORIGIN` で許可オリジンを限定し、credentials を許可 |
