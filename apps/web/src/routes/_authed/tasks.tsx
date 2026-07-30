import { useState } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { taskFiltersSchema, type TaskFilters } from '@repo/shared';
import { Button } from '@/components/ui';
import { tasksInfiniteQueryOptions } from '@/features/tasks/api';
import { TaskCreateForm } from '@/features/tasks/TaskCreateForm';
import { TaskFiltersBar } from '@/features/tasks/TaskFilters';
import { TaskTable } from '@/features/tasks/TaskTable';

/**
 * タスク一覧ルート。TanStack Router の「URL を状態の正にする」設計の実例。
 *
 * 絞り込み・ソートを useState ではなく URL のクエリ文字列に置いている。
 * こうするとリロード・ブラウザバック・URL 共有で同じ画面が再現でき、
 * さらに「URL が変わる → loader が再実行される → Query が再取得する」
 * という一方向の流れに乗せられる。
 */
export const Route = createFileRoute('/_authed/tasks')({
  // validateSearch: 生のクエリ文字列を Zod で検証し、既定値を補って型付きにする。
  // 不正な値や欠落があっても既定値に落ちるので、以降は安全に扱える。
  // このスキーマは API 側の zValidator('query') とも共有している（@repo/shared）。
  validateSearch: taskFiltersSchema,
  // loaderDeps: 「search が変わったら loader をやり直す」と宣言する。
  // 書かないと初回しか走らず、絞り込み変更が先読みに反映されない。
  loaderDeps: ({ search }) => search,
  // loader: 描画前にデータを取得しておく。ensureInfiniteQueryData は
  // 下の useInfiniteQuery と同じキーのキャッシュを温めるので、
  // コンポーネント側は待たずに描画できる（ウォーターフォール回避）。
  loader: ({ context, deps }) =>
    context.queryClient.ensureInfiniteQueryData(tasksInfiniteQueryOptions(deps)),
  component: TasksPage,
});

function TasksPage() {
  // useSearch は validateSearch 済みの値を返すため、既に型付き・既定値適用済み。
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  // 作成フォームの開閉は URL に残す必要がない一時的な UI 状態なので useState でよい。
  // 「サーバー状態は Query、URL に残したい状態は search、それ以外は useState」が使い分けの基準。
  const [showCreate, setShowCreate] = useState(false);

  // 絞り込み変更は setState ではなく URL の更新として表現する。
  // これが loaderDeps → loader → query key の連鎖を駆動する。
  const setFilters = (f: TaskFilters) => {
    void navigate({ search: f });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">タスク一覧</h1>
        <Button onClick={() => setShowCreate((v) => !v)}>
          {showCreate ? '閉じる' : '新規タスク'}
        </Button>
      </div>

      {showCreate && <TaskCreateForm filters={search} onCreated={() => setShowCreate(false)} />}

      <TaskFiltersBar filters={search} onChange={setFilters} />
      <TaskTable filters={search} onFiltersChange={setFilters} />
    </div>
  );
}
