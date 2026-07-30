import { createFileRoute, redirect } from '@tanstack/react-router';

/**
 * `/` は実体を持たず /tasks へ転送するだけのルート。
 * ここで認証判定はしない。転送先の /tasks が `_authed` 配下にあるため、
 * 未認証なら _authed の beforeLoad が /login へ飛ばしてくれる。
 * 認証判定を1箇所（_authed）に集約するための、あえての「素通し」。
 */
export const Route = createFileRoute('/')({
  beforeLoad: () => {
    throw redirect({ to: '/tasks' });
  },
});
