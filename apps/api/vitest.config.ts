import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
    // 認証/タスクのテストは DB に対する統合テスト。docker compose up + db:migrate を前提とする。
    fileParallelism: false,
  },
});
