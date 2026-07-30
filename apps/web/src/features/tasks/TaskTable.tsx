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
// 仮想化のため全行を同じ高さに固定する。可変高さも扱えるが、
// 固定の方が位置計算が単純で、スクロール量の推定もぶれない。
const ROW_HEIGHT = 48;

/**
 * タスク一覧テーブル。TanStack の Table / Virtual / Query が交差する中心。
 *
 * 役割分担:
 * - Query (useInfiniteQuery) … サーバーからページ単位でデータを取得する
 * - Table (useReactTable)    … 列定義・表示列の状態を持つ（見た目は持たない）
 * - Virtual (useVirtualizer) … 可視範囲の行だけを DOM に描画する
 *
 * ソートと絞り込みは**このコンポーネントの状態ではない**。URL（filters）が正で、
 * ここは受け取って表示し、変更を onFiltersChange で親へ返すだけ。
 */
export function TaskTable({
  filters,
  onFiltersChange,
}: {
  filters: TaskFilters;
  onFiltersChange: (f: TaskFilters) => void;
}) {
  // ルートの loader と同じ queryOptions を渡すため、ここでは再取得が走らず
  // 温まったキャッシュをそのまま購読する（キーが一致することが条件）。
  const query = useInfiniteQuery(tasksInfiniteQueryOptions(filters));
  // filters を渡すと、mutation 側が「今表示しているリスト」のキャッシュを
  // 特定できるようになり、楽観的更新の対象にできる。
  const update = useUpdateTask(filters);
  const del = useDeleteTask(filters);

  // infinite query のデータは pages（ページの配列）の形で届くため、
  // テーブルへ渡す前に1本の配列へ平坦化する。
  // useMemo が必須: 毎回新しい配列を作ると useReactTable の data 参照が変わり、
  // 不要な再計算を誘発する。
  const rowsData = useMemo(
    () => query.data?.pages.flatMap((p) => p.items) ?? [],
    [query.data],
  );
  // 表示列の ON/OFF。サーバーと無関係な純粋な UI 状態なので useState でよい。
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});

  /**
   * TanStack Table は headless（見た目を持たない）。
   * <table> も CSS も描画せず、列・行・表示状態の計算だけを担う。
   * 実際のマークアップは下の CSS Grid で自前に組んでいる。
   *
   * - state / onColumnVisibilityChange … 表示列を「制御された状態」として外に出す
   * - getCoreRowModel … 加工なしの基本の行モデル。ソート・フィルタを
   *   クライアントでやる場合は getSortedRowModel 等を追加する
   * - manualSorting: true … ソートをテーブル内部で行わない宣言。
   *   本アプリの並べ替えはサーバー側（filters → query key → API）。
   *   これを外すとクライアント側でも並べ替えが走り、
   *   「読み込み済みの一部だけが並び替わる」不整合が起きる。
   */
  const table = useReactTable({
    data: rowsData,
    columns: taskColumns,
    state: { columnVisibility },
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    manualSorting: true,
  });

  const parentRef = useRef<HTMLDivElement>(null);
  const rows = table.getRowModel().rows;
  /**
   * TanStack Virtual: 5000 行あっても DOM に置くのは可視範囲ぶんだけにする。
   * - count … 全行数（実データではなく件数だけを渡す）
   * - getScrollElement … スクロールを監視する要素
   * - estimateSize … 各行の高さ。ここでは固定値
   * - overscan … 可視範囲の外に余分に描画する行数。
   *   0 にすると高速スクロール時に空白が見えるため、少し多めに確保する
   */
  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 12,
  });

  /**
   * 無限スクロール: 末尾 300px まで近づいたら次ページを取りに行く。
   *
   * ガードが2つとも要る。hasNextPage が無いと最終ページ以降も要求し続け、
   * isFetchingNextPage が無いとスクロール中に同じページを何度も並行取得する
   * （scroll イベントは連続で発火するため）。
   */
  const onScroll = useCallback(() => {
    const el = parentRef.current;
    if (!el) return;
    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 300;
    if (nearBottom && query.hasNextPage && !query.isFetchingNextPage) {
      void query.fetchNextPage();
    }
  }, [query]);

  // ヘッダークリックの並べ替え。同じ列なら昇順/降順を反転、別列なら昇順から。
  // ここで状態を持たず onFiltersChange に委ねる点が要で、
  // 結果は URL 更新 → query key 変化 → サーバーから取り直し、という流れになる。
  function toggleSort(field: TaskSortField) {
    if (filters.sortField === field) {
      onFiltersChange({ ...filters, sortDir: filters.sortDir === 'asc' ? 'desc' : 'asc' });
    } else {
      onFiltersChange({ ...filters, sortField: field, sortDir: 'asc' });
    }
  }

  // 表示中の列から Grid の列幅を組み立てる。ヘッダーと各行で同じ値を使うことで、
  // <table> を使わずに桁を揃えている（headless ゆえに自前で面倒を見る部分）。
  // 末尾の 200px は列定義に含めていない「操作」列のぶん。
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

        {/*
          仮想化された行。
          外側の div に「全行ぶんの高さ」(getTotalSize) を与えてスクロールバーの
          長さを実際の件数どおりに見せ、内側では可視範囲の行だけを絶対配置する。
          位置指定に top ではなく transform: translateY を使うのは、
          レイアウト再計算を避けてスクロール中の描画を軽くするため。
        */}
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
                {/*
                  flexRender は列定義の cell（文字列・関数・コンポーネントの
                  いずれでもよい）を実際に描画するためのヘルパー。
                  自分で cell(...) を呼ぶとコンポーネントの場合に壊れる。
                */}
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
