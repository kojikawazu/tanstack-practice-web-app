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
    validators: { onChange: loginSchema },
    onSubmit: async ({ value }) => {
      await login.mutateAsync(value);
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
