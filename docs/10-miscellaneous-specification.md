# その他仕様書

用語集・コーディング規約・参照資料をまとめる。標準仕様書（01〜09）に収まらない補足を置く。

## 目次

- [用語集](#用語集)
- [コーディング規約・命名](#コーディング規約命名)
- [参照資料・ライブラリ](#参照資料ライブラリ)
- [その他注記](#その他注記)

## 用語集

このプロジェクトで使う用語を、実装例と結び付けて説明する。用語を見つけたら、まずここで「何か」と「このアプリではどこで使うか」を確認する。

### TanStack Router

| 用語 | 意味 | このプロジェクトでの例 |
|---|---|---|
| File-based routing | `routes/` のファイルパスから URL とルート定義を生成する仕組み。生成結果は [`routeTree.gen.ts`](../apps/web/src/routeTree.gen.ts)（自動生成のため手で編集しない）。 | `routes/_authed/tasks.$taskId.tsx` が `/tasks/:taskId`、[`routes/login.tsx`](../apps/web/src/routes/login.tsx) が `/login`。 |
| Pathless layout route | ファイル名を `_` で始めた、URL に現れないレイアウト用ルート。子ルート共通の処理を1箇所に集約する。 | 認証ガードとヘッダーを持つ [`_authed.tsx`](../apps/web/src/routes/_authed.tsx)。URL は `/tasks` のままで `_authed` は現れない。 |
| `beforeLoad` | ルートの描画前に走るフック。認証判定やリダイレクトなど、「そもそも表示してよいか」をここで決める。返した値は route context に載る。 | [`_authed.tsx`](../apps/web/src/routes/_authed.tsx) が `/me` を確認し、未認証なら `throw redirect({ to: '/login' })`。あくまで UX 用で、最終的な認可判定はサーバー側。 |
| `loader` / `loaderDeps` | ルート表示時にデータを先読みするフック。`loaderDeps` で「何が変わったら再実行するか」を宣言する。 | [`_authed/tasks.tsx`](../apps/web/src/routes/_authed/tasks.tsx) が `loaderDeps: ({ search }) => search` として、絞り込み変更時に一覧を再取得する。 |
| Route context | ルート間で受け渡す型付きの値。ルーター生成時に注入し、`beforeLoad` で追加できる。 | [`router.tsx`](../apps/web/src/router.tsx) が `context: { queryClient }` を注入し、loader から `context.queryClient` を使う。 |
| `validateSearch` | URL のクエリ文字列をスキーマで検証・既定値補完して、型付きの検索パラメータとして扱う仕組み。**URL を状態の正にする**ための入口。 | [`_authed/tasks.tsx`](../apps/web/src/routes/_authed/tasks.tsx) の `validateSearch: taskFiltersSchema`。絞り込み・ソートがそのまま URL に残り、リロードや共有で再現できる。 |
| `defaultPreload: 'intent'` | リンクにホバー・フォーカスした時点で、その先のルートの loader を先読みする設定。 | [`router.tsx`](../apps/web/src/router.tsx)。一覧の「編集」リンクにカーソルを置いた時点で詳細の取得が始まる。 |

### TanStack Query

| 用語 | 意味 | このプロジェクトでの例 |
|---|---|---|
| Query key | キャッシュを識別する配列。同じキー＝同じキャッシュなので、**loader と コンポーネントで一致させる**ことが要。 | [`query-keys.ts`](../apps/web/src/lib/query-keys.ts) に一元管理。一覧キーは `['tasks', filters]` で、絞り込みが変わればキャッシュも別になる。 |
| `queryOptions` / `infiniteQueryOptions` | キーと取得関数をひとまとめにして使い回すためのヘルパー。loader の先読みとコンポーネントの購読で同じ定義を共有できる。 | [`features/tasks/api.ts`](../apps/web/src/features/tasks/api.ts) の `tasksInfiniteQueryOptions` / `taskDetailQueryOptions`。 |
| `staleTime` | 取得したデータを「新鮮」とみなす時間。この間は再取得しない。 | [`query-client.ts`](../apps/web/src/lib/query-client.ts) で 30 秒。あわせて `retry: false`・`refetchOnWindowFocus: false` にしている。 |
| Infinite query / cursor | ページを継ぎ足しながら読み込むクエリ。`getNextPageParam` が次ページの目印（カーソル）を返す。 | [`features/tasks/api.ts`](../apps/web/src/features/tasks/api.ts) の `getNextPageParam: (last) => last.nextCursor`。データは `data.pages` に配列で積まれる。 |
| Mutation | サーバー状態を変更する操作（作成・更新・削除）。`useMutation` で実行し、結果をキャッシュへ反映する。 | `useCreateTask` / `useUpdateTask` / `useDeleteTask`（[`features/tasks/api.ts`](../apps/web/src/features/tasks/api.ts)）。 |
| 楽観的更新（Optimistic update） | サーバー応答を待たずに先へ画面を更新し、失敗したら元に戻す手法。`onMutate` で先に書き換え、`onError` でロールバックする。 | 更新・削除は `onMutate` でキャッシュを書き換え、`onError` で `prevList` / `prevDetail` に戻す。**作成は楽観更新しない**（並び順とサーバー採番に依存するため、`invalidateQueries` で確定させる）。 |
| `cancelQueries` | 楽観的更新の前に進行中の再取得を打ち切る操作。これを省くと、古いレスポンスが後から届いて書き換えを上書きしてしまう。 | `useUpdateTask` の `onMutate` 冒頭。 |
| `invalidateQueries` | 該当キーのキャッシュを「古い」と印付けし、再取得させる操作。楽観的更新の**確定**にも使う。 | 各 mutation の `onSettled` で `['tasks']` を invalidate。 |
| `ensureQueryData` | キャッシュがあればそれを返し、無ければ取得して待つ API。loader からの先読みに使う。 | [`_authed.tsx`](../apps/web/src/routes/_authed.tsx) の `/me`、[`_authed/tasks.tsx`](../apps/web/src/routes/_authed/tasks.tsx) の `ensureInfiniteQueryData`。 |

### TanStack Table / Virtual

| 用語 | 意味 | このプロジェクトでの例 |
|---|---|---|
| Headless UI | 見た目を持たず、状態とロジックだけを提供する設計。マークアップと CSS は利用側が全部書く。 | TanStack Table は `<table>` を描画しない。[`TaskTable.tsx`](../apps/web/src/features/tasks/TaskTable.tsx) は CSS Grid で自前描画している。 |
| Column definition | 列の識別子・ヘッダー・セル描画をまとめた宣言。`createColumnHelper` で型安全に組む。 | [`columns.tsx`](../apps/web/src/features/tasks/columns.tsx)。操作列はフックを使う都合で `TaskTable` 側に置いている。 |
| `flexRender` | 列定義の header / cell（文字列・関数・コンポーネントのいずれか）を実際に描画するヘルパー。 | [`TaskTable.tsx`](../apps/web/src/features/tasks/TaskTable.tsx) のヘッダー・セル描画。 |
| Row model | 元データからソート・フィルタ等を適用して描画対象の行を導く仕組み。`getCoreRowModel` は加工なしの基本形。 | `getCoreRowModel: getCoreRowModel()`。 |
| `manualSorting` | ソートをクライアントで行わず、サーバーに任せる指定。 | `manualSorting: true`。ソート状態は URL（`filters`）→ query key → API へ流れるため、テーブル内部で並べ替えない。 |
| Column visibility | 列の表示・非表示を持つテーブル状態。 | `columnVisibility` state と `col.getToggleVisibilityHandler()` によるチェックボックス。 |
| 仮想化（Virtualization） | 可視範囲の行だけを DOM に描画し、残りは高さだけ確保する手法。数千行でも DOM 数を一定に保てる。 | `useVirtualizer`（[`TaskTable.tsx`](../apps/web/src/features/tasks/TaskTable.tsx)）。seed で 5000 件を投入して効果を確認できる。 |
| `estimateSize` / `overscan` | 各行の推定高さと、可視範囲の外に余分に描画する行数。`overscan` はスクロール時のちらつき対策。 | `estimateSize: () => 48`、`overscan: 12`。 |
| `getTotalSize` / `virtualItem.start` | 全行ぶんのスクロール高さと、各仮想行の描画位置。位置は `transform: translateY()` で与える。 | スクロールコンテナ内の絶対配置。 |

### TanStack Form

| 用語 | 意味 | このプロジェクトでの例 |
|---|---|---|
| `useForm` | フォームの値・検証・送信をまとめて管理するフック。 | [`TaskCreateForm.tsx`](../apps/web/src/features/tasks/TaskCreateForm.tsx)、[`TaskEditForm.tsx`](../apps/web/src/features/tasks/TaskEditForm.tsx)。 |
| `form.Field` | 1フィールドの状態（値・エラー・touched）を購読する単位。render props で入力要素を描画する。 | `<form.Field name="title">{(field) => ...}</form.Field>`。 |
| `form.Subscribe` | フォーム全体の状態のうち、必要な部分だけを購読して再描画範囲を絞る仕組み。 | 送信ボタンが `canSubmit` / `isSubmitting` だけを購読。 |
| Standard Schema | Zod などの検証ライブラリを共通インターフェースで受け取る規格。TanStack Form は `validators` にスキーマをそのまま渡せる。 | `validators: { onChange: taskFormSchema }`。エラー要素は文字列とオブジェクトのどちらもありうるため、[`lib/form.ts`](../apps/web/src/lib/form.ts) で表示用に正規化している。 |
| フォーム用スキーマ | 共有スキーマを土台にしつつ、入力欄の都合（`<input type="date">` は文字列）に合わせて調整したスキーマ。 | [`task-form-schema.ts`](../apps/web/src/features/tasks/task-form-schema.ts)。`title` は共有スキーマの `shape` を流用し、`dueDate` のみ文字列として扱って送信時に ISO へ変換する。 |

### バックエンド（Hono）

| 用語 | 意味 | このプロジェクトでの例 |
|---|---|---|
| Hono | Web 標準の `Request` / `Response` を土台にした軽量 Web フレームワーク。 | [`app.ts`](../apps/api/src/app.ts) がミドルウェア・ルート・エラーハンドラを組み立てる。 |
| Context (`c`) | 1リクエストぶんの入出力を持つオブジェクト。`c.json()` で応答し、`c.set` / `c.var` で値を持ち回る。 | 認証ミドルウェアが `c.set('user', ...)`、型は [`types/hono.d.ts`](../apps/api/src/types/hono.d.ts) で宣言。 |
| Middleware | ルートハンドラの前後に挟む共通処理。`await next()` の前後で処理を書く。 | `logger()` / `secureHeaders()` / `cors()`（[`app.ts`](../apps/api/src/app.ts)）と [`requireAuth`](../apps/api/src/middleware/auth.middleware.ts)。 |
| `zValidator` | Zod スキーマでリクエスト（json / query / param）を検証するミドルウェア。 | [`lib/validate.ts`](../apps/api/src/lib/validate.ts) が統一エラー形式（400）でラップしている。 |
| `onError` / `notFound` | 例外と未定義パスをアプリ全体で受ける終端ハンドラ。 | [`app.ts`](../apps/api/src/app.ts)。`AppError` → 定義済みのコード、それ以外 → 500（詳細はログのみで、レスポンスには出さない）。 |
| 統一エラーレスポンス | `{ error: { code, message, fields } }` に固定した応答形式。クライアントが機械的に扱える。 | [`lib/errors.ts`](../apps/api/src/lib/errors.ts) の `AppError` / `Errors`。フロント側は [`api-client.ts`](../apps/web/src/lib/api-client.ts) の `ApiError` で受ける。 |
| Service / Repository | ビジネスロジック層とデータアクセス層。ルートは入出力に専念する。 | [`services/task.service.ts`](../apps/api/src/services/task.service.ts) と [`repositories/task.repository.ts`](../apps/api/src/repositories/task.repository.ts)。 |
| DTO (Data Transfer Object) | API が外部へ返してよい形だけを定義した型。DB の行をそのまま返さない。 | [`lib/dto.ts`](../apps/api/src/lib/dto.ts)。`Date` を ISO 文字列に直し、`passwordHash` は含めない。 |
| セッション Cookie | セッション ID を HttpOnly Cookie に入れて認証する方式。JavaScript から読めないため XSS でのトークン奪取に強い。 | [`lib/session.ts`](../apps/api/src/lib/session.ts)。署名付き・`SameSite=Lax`・`Secure` は本番のみ。 |
| CORS と `credentials` | 別オリジン間で Cookie を送るための設定。`credentials: true` と `origin: '*'` は併用できない。 | API 側は `cors({ origin: env.CORS_ORIGIN, credentials: true })`、フロント側は `fetch(..., { credentials: 'include' })`。 |

### データベース（Drizzle ORM / PostgreSQL）

| 用語 | 意味 | このプロジェクトでの例 |
|---|---|---|
| スキーマ定義 | TS でテーブルを宣言し、そこから型とマイグレーションを導出する仕組み。**`schema.ts` が正**。 | [`packages/db/src/schema.ts`](../packages/db/src/schema.ts)。TS は camelCase、DB カラムは snake_case で対応付ける。 |
| `$inferSelect` / `$inferInsert` | スキーマから取得用・挿入用の型を導出するヘルパー。 | [`packages/db/src/types.ts`](../packages/db/src/types.ts) の `Task` / `NewTask`。 |
| マイグレーション | スキーマ差分を SQL として記録し、DB に適用する仕組み。生成 SQL は手で編集しない。 | `pnpm db:generate` → `pnpm db:migrate`。 |
| `pgEnum` | PostgreSQL の列挙型。 | `task_status` / `task_priority`。値域は `@repo/shared` の定数を流用し、Zod と DB で一致させている。 |
| 複合インデックス | 複数カラムをまとめた索引。絞り込みと並べ替えの組み合わせを効かせる。 | `tasks_user_status_idx`・`tasks_user_priority_idx` など、`userId` スコープ + キーの形。 |
| キーセットページング（カーソル） | 「前ページの最後の値」を起点に次を取る方式。`OFFSET` と違い、深いページでも件数に比例して遅くならず、途中挿入で行がずれない。 | [`task.repository.ts`](../apps/api/src/repositories/task.repository.ts) の `keysetPredicate`。カーソルは `(ソート値, id)` の複合キーを base64url にしたもの。 |
| タイブレーク | ソート値が同じ行の順序を確定させるための第2キー。これが無いとページ跨ぎで行の重複・欠落が起きる。 | すべての ORDER BY に `id` を付けている。 |
| NULLS LAST | NULL を末尾に置く並び順の指定。 | `dueDate`（期限なし）のソート。カーソル側でも NULL 領域を特別扱いしている。 |

### 共有・テスト

| 用語 | 意味 | このプロジェクトでの例 |
|---|---|---|
| 共有スキーマ | front / api で同一の Zod スキーマを使い、検証仕様を1箇所に保つ設計。 | [`packages/shared/src/task.schema.ts`](../packages/shared/src/task.schema.ts)。`taskFiltersSchema` は Router の `validateSearch`・Query のキー・API の `zValidator('query')` の**3箇所**で共有される。 |
| クライアント検証とサーバー検証 | クライアント側は UX 向上のため、サーバー側は信頼できない入力の最終ゲートとして行う。**同じスキーマでも役割が違い、サーバー側は省略できない**。 | フォームの `validators` と API の `zValidator`。 |
| UT (Unit Test) | DB やネットワークを使わず、単一の機能単位を検証するテスト。 | web は対象と同階層の `*.test.ts`（[`format.test.ts`](../apps/web/src/features/tasks/format.test.ts)、[`form.test.ts`](../apps/web/src/lib/form.test.ts)）。 |
| インテグレーションテスト | 実際の DB を含め、層をまたいで検証するテスト。Hono は `app.request()` でサーバーを起動せずに HTTP を模擬できる。 | [`apps/api/src/tests/`](../apps/api/src/tests/)。[`helpers.ts`](../apps/api/src/tests/helpers.ts) が登録してセッション Cookie を取り回す。 |
| E2E (End-to-End Test) | ブラウザから画面を操作し、利用者のシナリオを通しで検証するテスト。 | [`apps/web/e2e/tasks.spec.ts`](../apps/web/e2e/tasks.spec.ts)。`pnpm --filter web test:e2e`。 |
| Locator | Playwright で要素を表すオブジェクト。`click` や `expect` の時点で解決し、自動待機・再試行する。 | `page.getByRole('heading', { name: 'タスク一覧' })` など。 |
| Seed | 開発・テスト用の初期データ投入。 | [`packages/db/src/seed.ts`](../packages/db/src/seed.ts)。`demo@example.com` とタスク 5000 件（仮想スクロールの確認用）。 |

### モノレポ

| 用語 | 意味 | このプロジェクトでの例 |
|---|---|---|
| pnpm workspace | 複数パッケージを1リポジトリで管理し、内部パッケージを `workspace:*` で参照する仕組み。 | [`pnpm-workspace.yaml`](../pnpm-workspace.yaml)。`@repo/db` / `@repo/shared` / `@repo/config`。 |
| Turborepo | ワークスペース横断のタスク実行と依存関係・キャッシュを扱うツール。 | [`turbo.json`](../turbo.json)。`pnpm dev` で web と api を並行起動する。 |
| パスエイリアス | インポートパスを短く固定する設定。相対パスの `../../` を避ける。 | web の `@/`（Vite + tsconfig で設定済み）。 |

## コーディング規約・命名

<!-- 記入: 言語・命名規則・ディレクトリ配置のルール -->

## 参照資料・ライブラリ

<!-- 記入: 主要ライブラリの用途・外部ドキュメントへの索引 -->

| ライブラリ / 資料 | 用途 |
|-----------|------|
|  |  |

## その他注記

<!-- 記入: 上記に分類されない補足・付録 -->
