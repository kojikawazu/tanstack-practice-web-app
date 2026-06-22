import { zValidator } from '@hono/zod-validator';
import type { ValidationTargets } from 'hono';
import type { ZodSchema } from 'zod';

/**
 * @hono/zod-validator を統一エラー形式（{ error: { code, message, fields } }）でラップする。
 * バリデーション失敗時は 400 を返す。
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
