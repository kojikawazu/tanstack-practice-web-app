/**
 * TanStack Form の field.state.meta.errors を表示用の文字列配列に正規化する。
 * Standard Schema（Zod）連携時、要素は文字列または { message } オブジェクトになりうる。
 */
export function fieldErrorMessages(errors: readonly unknown[]): string[] {
  return errors
    .filter((e): e is NonNullable<unknown> => e != null)
    .map((e) => {
      if (typeof e === 'string') return e;
      if (typeof e === 'object' && 'message' in e && typeof e.message === 'string') {
        return e.message;
      }
      return String(e);
    });
}
