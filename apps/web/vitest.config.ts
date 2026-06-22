import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vitest/config';

// ユニットテストは純粋な TS（JSX 描画なし）なので React プラグインは不要。
// esbuild が TS を変換する。コンポーネント描画テストを足す場合は plugin を追加する。
export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '@repo/shared': fileURLToPath(new URL('../../packages/shared/src/index.ts', import.meta.url)),
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test-setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
  },
});
