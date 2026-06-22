import { useCallback, useMemo, useRef, useState } from 'react';
import { Link } from '@tanstack/react-router';
import { useInfiniteQuery } from '@tanstack/react-query';
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type VisibilityState,
} from '@tanstack/react-table';
import { useVirtualizer } from '@tanstack/react-virtual';
import type { TaskFilters, TaskSortField } from '@repo/shared';
import { tasksInfiniteQueryOptions, useDeleteTask, useUpdateTask } from './api';
import { taskColumns } from './columns';

const SORTABLE = new Set<TaskSortField>(['title', 'dueDate', 'priority', 'createdAt']);
const ROW_HEIGHT = 48;

export function TaskTable({
  filters,
  onFiltersChange,
}: {
  filters: TaskFilters;
  onFiltersChange: (f: TaskFilters) => void;
}) {
  const query = useInfiniteQuery(tasksInfiniteQueryOptions(filters));
  const update = useUpdateTask(filters);
  const del = useDeleteTask(filters);

  const rowsData = useMemo(
    () => query.data?.pages.flatMap((p) => p.items) ?? [],
    [query.data],
  );
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});

  const table = useReactTable({
    data: rowsData,
    columns: taskColumns,
    state: { columnVisibility },
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    manualSorting: true, // ソートはサーバ側（filters → query key）
  });

  const parentRef = useRef<HTMLDivElement>(null);
  const rows = table.getRowModel().rows;
  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 12,
  });

  const onScroll = useCallback(() => {
    const el = parentRef.current;
    if (!el) return;
    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 300;
    if (nearBottom && query.hasNextPage && !query.isFetchingNextPage) {
      void query.fetchNextPage();
    }
  }, [query]);

  function toggleSort(field: TaskSortField) {
    if (filters.sortField === field) {
      onFiltersChange({ ...filters, sortDir: filters.sortDir === 'asc' ? 'desc' : 'asc' });
    } else {
      onFiltersChange({ ...filters, sortField: field, sortDir: 'asc' });
    }
  }

  const visibleColumns = table.getVisibleLeafColumns();
  const gridTemplate =
    visibleColumns
      .map((c) => (c.id === 'title' ? 'minmax(220px, 2fr)' : 'minmax(100px, 1fr)'))
      .join(' ') + ' 200px';

  return (
    <div>
      <div className="mb-2 flex flex-wrap items-center gap-3 text-xs text-gray-600">
        <span className="font-medium">表示列:</span>
        {table.getAllLeafColumns().map((col) => (
          <label key={col.id} className="flex items-center gap-1">
            <input
              type="checkbox"
              checked={col.getIsVisible()}
              onChange={col.getToggleVisibilityHandler()}
            />
            {String(col.columnDef.header)}
          </label>
        ))}
        <span className="ml-auto text-gray-500">{rowsData.length} 件読み込み済み</span>
      </div>

      <div
        ref={parentRef}
        onScroll={onScroll}
        className="h-[600px] overflow-auto rounded-md border border-gray-200 bg-white"
      >
        {/* ヘッダ（sticky） */}
        <div
          className="sticky top-0 z-10 grid items-center border-b border-gray-200 bg-gray-50 text-sm font-medium"
          style={{ gridTemplateColumns: gridTemplate }}
        >
          {table.getHeaderGroups()[0]?.headers.map((h) => {
            const field = h.column.id as TaskSortField;
            const sortable = SORTABLE.has(field);
            const active = filters.sortField === field;
            return (
              <div key={h.id} className="px-3 py-2 text-left">
                {sortable ? (
                  <button
                    type="button"
                    className="inline-flex items-center gap-1 hover:text-indigo-600"
                    onClick={() => toggleSort(field)}
                  >
                    {flexRender(h.column.columnDef.header, h.getContext())}
                    {active && <span>{filters.sortDir === 'asc' ? '▲' : '▼'}</span>}
                  </button>
                ) : (
                  flexRender(h.column.columnDef.header, h.getContext())
                )}
              </div>
            );
          })}
          <div className="px-3 py-2">操作</div>
        </div>

        {/* 仮想化された行 */}
        <div style={{ height: `${virtualizer.getTotalSize()}px`, position: 'relative' }}>
          {virtualizer.getVirtualItems().map((vi) => {
            const row = rows[vi.index]!;
            const task = row.original;
            return (
              <div
                key={row.id}
                className="absolute left-0 grid w-full items-center border-b border-gray-100 text-sm"
                style={{
                  height: `${ROW_HEIGHT}px`,
                  transform: `translateY(${vi.start}px)`,
                  gridTemplateColumns: gridTemplate,
                }}
              >
                {row.getVisibleCells().map((cell) => (
                  <div key={cell.id} className="truncate px-3">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </div>
                ))}
                <div className="flex gap-2 px-3 text-xs">
                  <button
                    type="button"
                    className="text-indigo-600 hover:underline"
                    onClick={() =>
                      update.mutate({
                        id: task.id,
                        input: { status: task.status === 'done' ? 'todo' : 'done' },
                      })
                    }
                  >
                    {task.status === 'done' ? '未完了に' : '完了に'}
                  </button>
                  <Link
                    to="/tasks/$taskId"
                    params={{ taskId: task.id }}
                    className="text-gray-600 hover:underline"
                  >
                    編集
                  </Link>
                  <button
                    type="button"
                    className="text-red-600 hover:underline"
                    onClick={() => del.mutate(task.id)}
                  >
                    削除
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-2 text-xs text-gray-500">
        {query.isFetchingNextPage
          ? '読み込み中…'
          : query.hasNextPage
            ? 'スクロールで続きを読み込みます'
            : 'すべて読み込みました'}
      </div>
    </div>
  );
}
