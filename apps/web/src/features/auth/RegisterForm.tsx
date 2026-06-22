import { useForm } from '@tanstack/react-form';
import { useNavigate } from '@tanstack/react-router';
import { registerSchema } from '@repo/shared';
import { Button, FieldError, Label, TextInput } from '@/components/ui';
import { ApiError } from '@/lib/api-client';
import { fieldErrorMessages } from '@/lib/form';
import { useRegister } from './api';

export function RegisterForm() {
  const register = useRegister();
  const navigate = useNavigate();

  const form = useForm({
    defaultValues: { email: '', password: '', name: '' },
    validators: { onChange: registerSchema },
    onSubmit: async ({ value }) => {
      await register.mutateAsync(value);
      await navigate({ to: '/tasks' });
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
      <form.Field name="name">
        {(field) => (
          <div>
            <Label>お名前</Label>
            <TextInput
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={(e) => field.handleChange(e.target.value)}
            />
            <FieldError messages={fieldErrorMessages(field.state.meta.errors)} />
          </div>
        )}
      </form.Field>

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
            <Label>パスワード（8文字以上）</Label>
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

      {register.isError && (
        <p className="text-sm text-red-600">
          {register.error instanceof ApiError ? register.error.message : '登録に失敗しました'}
        </p>
      )}

      <form.Subscribe selector={(s) => ({ canSubmit: s.canSubmit, isSubmitting: s.isSubmitting })}>
        {({ canSubmit, isSubmitting }) => (
          <Button type="submit" className="w-full" disabled={!canSubmit || isSubmitting}>
            {isSubmitting ? '送信中…' : '登録'}
          </Button>
        )}
      </form.Subscribe>
    </form>
  );
}
