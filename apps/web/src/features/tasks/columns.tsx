import { createColumnHelper } from '@tanstack/react-table';
import type { TaskDto } from '@repo/shared';
import { formatDate, PRIORITY_LABEL, STATUS_LABEL } from './format';

const helper = createColumnHelper<TaskDto>();

// データ列の定義。操作列は TaskTable 側で描画する（フックを使うため）。
export const taskColumns = [
  helper.accessor('title', { header: 'タイトル', cell: (i) => i.getValue() }),
  helper.accessor('status', { header: 'ステータス', cell: (i) => STATUS_LABEL[i.getValue()] }),
  helper.accessor('priority', { header: '優先度', cell: (i) => PRIORITY_LABEL[i.getValue()] }),
  helper.accessor('dueDate', { header: '期限', cell: (i) => formatDate(i.getValue()) }),
  helper.accessor('createdAt', { header: '作成日', cell: (i) => formatDate(i.getValue()) }),
];
