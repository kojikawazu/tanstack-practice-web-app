import { describe, expect, it } from 'vitest';
import { fieldErrorMessages } from './form';

describe('fieldErrorMessages', () => {
  it('正常系: 文字列の配列はそのまま返す', () => {
    expect(fieldErrorMessages(['必須です'])).toEqual(['必須です']);
  });

  it('正常系: { message } オブジェクトから message を取り出す', () => {
    expect(fieldErrorMessages([{ message: '8文字以上' }])).toEqual(['8文字以上']);
  });

  it('準正常系: null / undefined は除外する', () => {
    expect(fieldErrorMessages([null, undefined, 'x'])).toEqual(['x']);
  });

  it('準正常系: 空配列は空配列', () => {
    expect(fieldErrorMessages([])).toEqual([]);
  });
});
