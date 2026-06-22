import { describe, expect, it } from 'vitest';
import { dateInputToIso, formatDate, STATUS_LABEL, toDateInputValue } from './format';

describe('format', () => {
  it('正常系: ISO 文字列を日本語日付に整形する', () => {
    expect(formatDate('2026-06-22T00:00:00.000Z')).toContain('2026');
  });

  it('準正常系: null は em dash を返す', () => {
    expect(formatDate(null)).toBe('—');
  });

  it('正常系: date input 値 ↔ ISO の往復', () => {
    const iso = dateInputToIso('2026-06-22');
    expect(iso).toBe('2026-06-22T00:00:00.000Z');
    expect(toDateInputValue(iso)).toBe('2026-06-22');
  });

  it('準正常系: 空文字は null（期限なし）', () => {
    expect(dateInputToIso('')).toBeNull();
    expect(toDateInputValue(null)).toBe('');
  });

  it('正常系: ステータスラベルが定義されている', () => {
    expect(STATUS_LABEL.in_progress).toBe('進行中');
  });
});
