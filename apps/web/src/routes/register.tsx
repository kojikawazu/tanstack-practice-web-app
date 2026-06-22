import { createFileRoute, Link, redirect } from '@tanstack/react-router';
import { meQueryOptions } from '@/features/auth/api';
import { RegisterForm } from '@/features/auth/RegisterForm';

export const Route = createFileRoute('/register')({
  beforeLoad: async ({ context }) => {
    const user = await context.queryClient.ensureQueryData(meQueryOptions());
    if (user) throw redirect({ to: '/tasks' });
  },
  component: RegisterPage,
});

function RegisterPage() {
  return (
    <div className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-4">
      <h1 className="mb-6 text-2xl font-bold">新規登録</h1>
      <RegisterForm />
      <p className="mt-4 text-sm text-gray-600">
        既にアカウントがある場合は{' '}
        <Link to="/login" className="text-indigo-600 hover:underline">
          ログイン
        </Link>
      </p>
    </div>
  );
}
