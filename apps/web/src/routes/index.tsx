import { createFileRoute, redirect } from '@tanstack/react-router';

// ルートは /tasks へ。未認証なら _authed ガードが /login へ飛ばす。
export const Route = createFileRoute('/')({
  beforeLoad: () => {
    throw redirect({ to: '/tasks' });
  },
});
