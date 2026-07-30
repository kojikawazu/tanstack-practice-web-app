import { createColumnHelper } from '@tanstack/react-table';
import type { TaskDto } from '@repo/shared';
import { formatDate, PRIORITY_LABEL, STATUS_LABEL } from './format';

// createColumnHelper は列定義に型を効かせるためのヘルパー。
// accessor('title') の 'title' は TaskDto のキーに限定され、
// cell の getValue() もその型で返る（'titel' などの綴り間違いは型エラー）。
const helper = createColumnHelper<TaskDto>();

/**
 * データ列の定義。操作列は TaskTable 側で描画する（フックを使うため）。
 *
 * 列定義に「見た目」を書かないのが headless の流儀。ここが持つのは
 * 識別子・見出し・値の整形だけで、幅や配置は描画側の責務。
 * cell で STATUS_LABEL / formatDate を通し、DB の値を日本語表示に変換している。
 */
export const taskColumns = [
  helper.accessor('title', { header: 'タイトル', cell: (i) => i.getValue() }),
  helper.accessor('status', { header: 'ステータス', cell: (i) => STATUS_LABEL[i.getValue()] }),
  helper.accessor('priority', { header: '優先度', cell: (i) => PRIORITY_LABEL[i.getValue()] }),
  helper.accessor('dueDate', { header: '期限', cell: (i) => formatDate(i.getValue()) }),
  helper.accessor('createdAt', { header: '作成日', cell: (i) => formatDate(i.getValue()) }),
];
