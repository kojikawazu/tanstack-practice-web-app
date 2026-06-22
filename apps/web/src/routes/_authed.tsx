import { createFileRoute, Outlet, redirect, useNavigate } from '@tanstack/react-router';
import { meQueryOptions, useLogout } from '@/features/auth/api';
import { Button } from '@/components/ui';

/**
 * 認証ガードの集約点（pathless layout route）。
 * beforeLoad で /me を ensure し、未認証なら /login へリダイレクト（UX 用。最終判定はサーバー）。
 */
export const Route = createFileRoute('/_authed')({
  beforeLoad: async ({ context, location }) => {
    const user = await context.queryClient.ensureQueryData(meQueryOptions());
    if (!user) {
      throw redirect({ to: '/login', search: { redirect: location.href } });
    }
    return { user };
  },
  component: AuthedLayout,
});

function AuthedLayout() {
  const { user } = Route.useRouteContext();
  const logout = useLogout();
  const navigate = useNavigate();

  return (
    <div>
      <header className="flex items-center justify-between border-b border-gray-200 bg-white px-6 py-3">
        <span className="font-semibold">タスク管理</span>
        <div className="flex items-center gap-3 text-sm">
          <span className="text-gray-600">{user.name}</span>
          <Button
            className="bg-gray-200 text-gray-800 hover:bg-gray-300"
            onClick={async () => {
              await logout.mutateAsync();
              await navigate({ to: '/login' });
            }}
          >
            ログアウト
          </Button>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-6">
        <Outlet />
      </main>
    </div>
  );
}
