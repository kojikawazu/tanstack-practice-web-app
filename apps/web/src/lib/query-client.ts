import { QueryClient } from '@tanstack/react-query';

/**
 * アプリ全体で共有する QueryClient（サーバー状態のキャッシュ本体）。
 *
 * 既定値の意図:
 * - staleTime: 30 秒間は取得済みデータを「新鮮」とみなし、再取得しない。
 *   0（ライブラリ既定）だとマウントのたびに再取得が走る。
 * - retry: false — 学習用途では失敗を隠さず即座に見せたいため。
 *   本番アプリなら一時的なネットワーク断に備えて数回リトライする方が親切。
 * - refetchOnWindowFocus: false — タブを切り替えるたびの再取得を止める。
 *   開発中に「なぜか再取得される」混乱を避ける狙い。
 *
 * ここは既定値であり、個別のクエリ側で上書きできる
 * （例: features/auth/api.ts の meQueryOptions は staleTime 5 分）。
 */
export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        retry: false,
        refetchOnWindowFocus: false,
      },
    },
  });
}
