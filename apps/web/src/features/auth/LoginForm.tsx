import { useForm } from '@tanstack/react-form';
import { useNavigate } from '@tanstack/react-router';
import { loginSchema } from '@repo/shared';
import { Button, FieldError, Label, TextInput } from '@/components/ui';
import { ApiError } from '@/lib/api-client';
import { fieldErrorMessages } from '@/lib/form';
import { useLogin } from './api';

export function LoginForm({ redirectTo }: { redirectTo?: string }) {
  const login = useLogin();
  const navigate = useNavigate();

  const form = useForm({
    defaultValues: { email: '', password: '' },
    // @repo/shared の loginSchema をそのまま使う。API 側も同じスキーマで検証するため、
    // 「クライアントは通るがサーバーで弾かれる」というずれが起きない。
    validators: { onChange: loginSchema },
    onSubmit: async ({ value }) => {
      // mutateAsync は失敗時に例外を投げる。ここで catch していないのは、
      // TanStack Form が送信中の例外を捕捉して isSubmitting を戻してくれるため。
      // エラー表示は下の login.isError（mutation の状態）が担当する。
      await login.mutateAsync(value);
      // ガードが付けた ?redirect= があれば元の画面へ、無ければ一覧へ
      await navigate({ to: redirectTo ?? '/tasks' });
    },
  });

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        e.stopPropagation();
        void form.handleSubmit();
      }}
    >
      <form.Field name="email">
        {(field) => (
          <div>
            <Label>メールアドレス</Label>
            <TextInput
              type="email"
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={(e) => field.handleChange(e.target.value)}
            />
            <FieldError messages={fieldErrorMessages(field.state.meta.errors)} />
          </div>
        )}
      </form.Field>

      <form.Field name="password">
        {(field) => (
          <div>
            <Label>パスワード</Label>
            <TextInput
              type="password"
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={(e) => field.handleChange(e.target.value)}
            />
            <FieldError messages={fieldErrorMessages(field.state.meta.errors)} />
          </div>
        )}
      </form.Field>

      {/*
        2種類のエラーを区別している。
        - フィールド単位の入力エラー … FieldError（form が持つ）
        - 通信・認証の失敗 … ここ（mutation が持つ）
        認証失敗は「どちらの入力が悪いか」を教えない共通メッセージにする。
        メール有無が分かると総当たりの手掛かりになるため（サーバー側も同方針）。
      */}
      {login.isError && (
        <p className="text-sm text-red-600">
          {login.error instanceof ApiError ? login.error.message : 'ログインに失敗しました'}
        </p>
      )}

      <form.Subscribe selector={(s) => ({ canSubmit: s.canSubmit, isSubmitting: s.isSubmitting })}>
        {({ canSubmit, isSubmitting }) => (
          <Button type="submit" className="w-full" disabled={!canSubmit || isSubmitting}>
            {isSubmitting ? '送信中…' : 'ログイン'}
          </Button>
        )}
      </form.Subscribe>
    </form>
  );
}
