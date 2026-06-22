import { useState } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { taskFiltersSchema, type TaskFilters } from '@repo/shared';
import { Button } from '@/components/ui';
import { tasksInfiniteQueryOptions } from '@/features/tasks/api';
import { TaskCreateForm } from '@/features/tasks/TaskCreateForm';
import { TaskFiltersBar } from '@/features/tasks/TaskFilters';
import { TaskTable } from '@/features/tasks/TaskTable';

export const Route = createFileRoute('/_authed/tasks')({
  // ソート・フィルタ状態を URL に保持（Zod 検証 + デフォルト適用）
  validateSearch: taskFiltersSchema,
  loaderDeps: ({ search }) => search,
  loader: ({ context, deps }) =>
    context.queryClient.ensureInfiniteQueryData(tasksInfiniteQueryOptions(deps)),
  component: TasksPage,
});

function TasksPage() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const [showCreate, setShowCreate] = useState(false);

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
