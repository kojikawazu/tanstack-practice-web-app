import type { TaskPriority, TaskStatus } from '@repo/shared';

/**
 * 表示用の変換をまとめたモジュール。コンポーネントから整形処理を追い出すことで、
 * DOM を用意しなくてもテストできる（format.test.ts）。
 *
 * Record<TaskStatus, string> と型付けしておくと、@repo/shared に
 * ステータスを追加したときにラベルの書き漏れが型エラーとして検出される。
 */
export const STATUS_LABEL: Record<TaskStatus, string> = {
  todo: '未着手',
  in_progress: '進行中',
  done: '完了',
};

export const PRIORITY_LABEL: Record<TaskPriority, string> = {
  low: '低',
  medium: '中',
  high: '高',
};

export function formatDate(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

/**
 * ISO 文字列 → <input type="date"> の値（YYYY-MM-DD）
 *
 * 以下2つは API 契約（ISO 8601）と <input type="date">（YYYY-MM-DD）の
 * 橋渡しで、フォームの入口と出口で対になっている。
 * どちらも UTC 基準で扱う（toISOString / 末尾 Z）。ローカル時刻を混ぜると
 * 時差の影響で日付が1日ずれるため、変換の基準を片方に統一している。
 */
export function toDateInputValue(iso: string | null): string {
  if (!iso) return '';
  return new Date(iso).toISOString().slice(0, 10);
}

/** <input type="date"> の値 → ISO 文字列（空なら null） */
export function dateInputToIso(value: string): string | null {
  if (!value) return null;
  return new Date(`${value}T00:00:00.000Z`).toISOString();
}
