import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { useSuspenseQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui';
import { taskDetailQueryOptions, useDeleteTask } from '@/features/tasks/api';
import { TaskEditForm } from '@/features/tasks/TaskEditForm';

/**
 * タスク詳細（編集）ルート。
 * ファイル名の `$taskId` が動的セグメントで、URL の `/tasks/xxx` の xxx を受け取る。
 * ファイル名にドットを使う `tasks.$taskId.tsx` は、`_authed/tasks` の下に
 * ネストしたルートを平坦な1ファイルで表現する記法。
 */
export const Route = createFileRoute('/_authed/tasks/$taskId')({
  // loader で先に取得しておくことで、下の useSuspenseQuery が待たずに済む。
  // 一覧の「編集」リンクは defaultPreload:'intent' によりホバー時点でこれを走らせる。
  loader: ({ context, params }) =>
    context.queryClient.ensureQueryData(taskDetailQueryOptions(params.taskId)),
  component: TaskDetailPage,
});

function TaskDetailPage() {
  const { taskId } = Route.useParams();
  const navigate = useNavigate();
  // useSuspenseQuery は useQuery と違い data が必ず存在する（undefined にならない）。
  // 未取得なら Suspense で中断するためで、loader が先に取得済みの本画面では
  // 実際には中断せず即座に描画される。isLoading 分岐が要らないのが利点。
  const { data: task } = useSuspenseQuery(taskDetailQueryOptions(taskId));
  // 詳細画面からの削除は filters を渡さない → 一覧の楽観的更新は行わず、
  // onSettled の invalidateQueries で一覧を再取得して整合させる。
  const del = useDeleteTask();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <Link to="/tasks" className="text-sm text-indigo-600 hover:underline">
          ← 一覧へ戻る
        </Link>
        <Button
          className="bg-red-600 hover:bg-red-500"
          onClick={async () => {
            await del.mutateAsync(task.id);
            await navigate({ to: '/tasks' });
          }}
        >
          削除
        </Button>
      </div>

      <h1 className="text-xl font-bold">タスクを編集</h1>
      <TaskEditForm task={task} onSaved={() => navigate({ to: '/tasks' })} />
    </div>
  );
}
