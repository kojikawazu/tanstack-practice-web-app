import { zValidator } from '@hono/zod-validator';
import type { ValidationTargets } from 'hono';
import type { ZodSchema } from 'zod';

/**
 * @hono/zod-validator を統一エラー形式（{ error: { code, message, fields } }）でラップする。
 * バリデーション失敗時は 400 を返す。
 *
 * 素の zValidator は独自形式でエラーを返すため、そのままだと
 * onError が整形する AppError の形式と食い違い、クライアントが
 * 2種類のエラー形式に対応する羽目になる。それを避けるためのラッパー。
 *
 * flatten().fieldErrors は { title: ['1文字以上'] } のようにフィールド名を
 * キーとした形へ変換する。フロントはこれをそのまま各入力欄の下に出せる。
 *
 * ここが「信頼できない入力の最終ゲート」。フォーム側にも同じスキーマの
 * 検証があるが、あちらは UX 用であり、迂回できるため代替にはならない。
 */
export function validate<T extends ZodSchema>(
  target: keyof ValidationTargets,
  schema: T,
) {
  return zValidator(target, schema, (result, c) => {
    if (!result.success) {
      return c.json(
        {
          error: {
            code: 'VALIDATION',
            message: '入力が不正です',
            fields: result.error.flatten().fieldErrors,
          },
        },
        400,
      );
    }
  });
}
