import type { QueryClient } from '@tanstack/react-query';
import { createRootRouteWithContext, Outlet } from '@tanstack/react-router';

/** 全ルートの beforeLoad / loader から `context` として参照できる値の型 */
export interface RouterContext {
  queryClient: QueryClient;
}

/**
 * ルートルート（全ページの最上位）。
 * createRootRouteWithContext<T>() と型引数を与えることで、子ルートの
 * loader / beforeLoad で `context.queryClient` が型付きで使えるようになる。
 * 関数呼び出しが2段（...WithContext<T>()({...})）なのは、型引数だけ先に
 * 与えて残りを推論させるための書き方。
 */
export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootComponent,
});

function RootComponent() {
  return (
    // Outlet は「子ルートがここに描画される」という差し込み口。
    // ルートの入れ子構造がそのまま UI の入れ子になる。
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <Outlet />
    </div>
  );
}
