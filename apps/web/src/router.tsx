import { createRouter } from '@tanstack/react-router';
import type { QueryClient } from '@tanstack/react-query';
import { routeTree } from './routeTree.gen';

/**
 * ルーターの生成。
 *
 * - routeTree: routes/ 配下のファイルから自動生成されたルート定義
 *   （routeTree.gen.ts。生成物なので手で編集しない）。
 * - context: 全ルートの beforeLoad / loader から参照できる値。
 *   QueryClient を渡すことで、描画前のデータ先読みが可能になる。
 * - defaultPreload: 'intent' は「ホバー・フォーカスした時点で先読み」。
 *   クリック前に loader が走るため、遷移が体感的に速くなる。
 * - scrollRestoration: 戻る操作でスクロール位置を復元する。
 */
export function createAppRouter(queryClient: QueryClient) {
  return createRouter({
    routeTree,
    context: { queryClient },
    defaultPreload: 'intent',
    scrollRestoration: true,
  });
}

/**
 * 生成したルーターの型をライブラリへ登録する（module augmentation）。
 * これにより `<Link to="/tasks/$taskId" params={{ taskId }} />` のような
 * パス・パラメータ・検索パラメータが型検査される。TanStack Router の
 * 型安全性はこの宣言が要で、書かないと to が単なる string になる。
 */
declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof createAppRouter>;
  }
}
