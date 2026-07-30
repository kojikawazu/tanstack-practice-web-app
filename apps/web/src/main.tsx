import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { RouterProvider } from '@tanstack/react-router';
import { createQueryClient } from '@/lib/query-client';
import { createAppRouter } from './router';
import './styles.css';

// QueryClient を先に作り、それをルーターへ渡す。
// こうすることで、ルートの loader / beforeLoad からも同じキャッシュを触れる
// （router.tsx の context 経由）。用語集: docs/10「Route context」。
const queryClient = createQueryClient();
const router = createAppRouter(queryClient);

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('#root が見つかりません');

/**
 * Provider の入れ子順に意味がある。
 * QueryClientProvider が外側でなければ、ルート配下のコンポーネントが
 * useQuery / useMutation でこの QueryClient を見つけられない。
 *
 * StrictMode は開発時のみ effect を2回実行して副作用の書き方を検査する。
 * 「取得が2回走る」ように見えるのはこれが原因で、本番ビルドでは起きない。
 */
createRoot(rootElement).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  </StrictMode>,
);
