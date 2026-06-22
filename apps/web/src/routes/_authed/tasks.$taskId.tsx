import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { useSuspenseQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui';
import { taskDetailQueryOptions, useDeleteTask } from '@/features/tasks/api';
import { TaskEditForm } from '@/features/tasks/TaskEditForm';

export const Route = createFileRoute('/_authed/tasks/$taskId')({
  loader: ({ context, params }) =>
    context.queryClient.ensureQueryData(taskDetailQueryOptions(params.taskId)),
  component: TaskDetailPage,
});

function TaskDetailPage() {
  const { taskId } = Route.useParams();
  const navigate = useNavigate();
  const { data: task } = useSuspenseQuery(taskDetailQueryOptions(taskId));
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
