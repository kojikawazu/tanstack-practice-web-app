import { createFileRoute, Link, redirect } from '@tanstack/react-router';
import { z } from 'zod';
import { meQueryOptions } from '@/features/auth/api';
import { LoginForm } from '@/features/auth/LoginForm';

const searchSchema = z.object({
  redirect: z.string().optional(),
});

export const Route = createFileRoute('/login')({
  validateSearch: searchSchema,
  beforeLoad: async ({ context }) => {
    const user = await context.queryClient.ensureQueryData(meQueryOptions());
    if (user) throw redirect({ to: '/tasks' });
  },
  component: LoginPage,
});

function LoginPage() {
  const { redirect: redirectTo } = Route.useSearch();
  return (
    <div className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-4">
      <h1 className="mb-6 text-2xl font-bold">ログイン</h1>
      <LoginForm redirectTo={redirectTo} />
      <p className="mt-4 text-sm text-gray-600">
        アカウントがない場合は{' '}
        <Link to="/register" className="text-indigo-600 hover:underline">
          新規登録
        </Link>
      </p>
    </div>
  );
}
