import { TASK_PRIORITY, TASK_STATUS, type TaskFilters } from '@repo/shared';
import { Label, Select } from '@/components/ui';
import { PRIORITY_LABEL, STATUS_LABEL } from './format';

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
