import { createFileRoute, Outlet, redirect, useNavigate } from '@tanstack/react-router';
import { meQueryOptions, useLogout } from '@/features/auth/api';
import { Button } from '@/components/ui';

/**
 * 認証ガードの集約点（pathless layout route）。
 *
 * ファイル名の先頭 `_` は「URL に現れないレイアウトルート」を意味する。
 * `_authed/tasks.tsx` の URL は `/tasks` であり `/_authed/tasks` ではない。
 * URL を変えずに「子ルート共通の処理」を1箇所へ集約するための仕組みで、
 * ここでは認証ガードと共通ヘッダーがそれにあたる。
 *
 * beforeLoad は描画前に走るため、未認証ユーザーに一瞬でも中身を見せない。
 * ただしこれはあくまで UX 用のガードで、実際の認可はサーバーが決める
 * （ブラウザ側の判定は改変できるため、これだけに頼ってはいけない）。
 *
 * 用語集: docs/10「Pathless layout route」「beforeLoad」。
 */
export const Route = createFileRoute('/_authed')({
  beforeLoad: async ({ context, location }) => {
    // ensureQueryData: キャッシュがあれば即座に返し、無ければ取得を待つ。
    // useQuery と違い Promise を返すので、描画前の判定に使える。
    const user = await context.queryClient.ensureQueryData(meQueryOptions());
    if (!user) {
      // redirect は return ではなく throw する。以降の処理を確実に止めるため。
      // 元の URL を search に載せ、ログイン後に戻れるようにする。
      throw redirect({ to: '/login', search: { redirect: location.href } });
    }
    // 返した値は route context にマージされ、子ルートと
    // Route.useRouteContext() から参照できる（下の AuthedLayout を参照）。
    return { user };
  },
  component: AuthedLayout,
});

function AuthedLayout() {
  // beforeLoad が返した user をここで受け取る。
  // このコンポーネントが描画される時点でガードは通過済みなので、
  // user は必ず存在する（null チェックが要らない）。
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
            // mutateAsync は Promise を返すため await できる（mutate は返さない）。
            // ログアウト完了を待ってから遷移し、キャッシュ破棄と画面遷移の順序を保つ。
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
