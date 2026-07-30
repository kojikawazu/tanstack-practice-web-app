import { TASK_PRIORITY, TASK_STATUS, type TaskFilters } from '@repo/shared';
import { Label, Select } from '@/components/ui';
import { PRIORITY_LABEL, STATUS_LABEL } from './format';

/**
 * 絞り込みバー。自前の state を一切持たない「制御されたコンポーネント」。
 *
 * 値は props の filters（＝URL の検索パラメータ）が正で、変更は onChange で
 * 親へ返すだけ。ここで useState を持つと URL と画面表示の二重管理になり、
 * ブラウザバック時に食い違う。
 *
 * `''`（すべて）と undefined を変換しているのは、<select> が空文字しか
 * 扱えない一方、スキーマ上「絞り込みなし」は undefined だから。
 * 空文字のまま URL に載せると status='' という不正な値になってしまう。
 */
export function TaskFiltersBar({
  filters,
  onChange,
}: {
  filters: TaskFilters;
  onChange: (f: TaskFilters) => void;
}) {
  return (
    <div className="flex flex-wrap items-end gap-4">
      <div>
        <Label>ステータス</Label>
        <Select
          value={filters.status ?? ''}
          onChange={(e) => {
            const v = e.target.value;
            onChange({ ...filters, status: v === '' ? undefined : (v as TaskFilters['status']) });
          }}
        >
          <option value="">すべて</option>
          {TASK_STATUS.map((s) => (
            <option key={s} value={s}>
              {STATUS_LABEL[s]}
            </option>
          ))}
        </Select>
      </div>
      <div>
        <Label>優先度</Label>
        <Select
          value={filters.priority ?? ''}
          onChange={(e) => {
            const v = e.target.value;
            onChange({ ...filters, priority: v === '' ? undefined : (v as TaskFilters['priority']) });
          }}
        >
          <option value="">すべて</option>
          {TASK_PRIORITY.map((p) => (
            <option key={p} value={p}>
              {PRIORITY_LABEL[p]}
            </option>
          ))}
        </Select>
      </div>
    </div>
  );
}
