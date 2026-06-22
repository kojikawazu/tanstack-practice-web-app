import js from '@eslint/js';
import tseslint from 'typescript-eslint';

/**
 * 共有 ESLint フラット設定（ベース）。
 * 各パッケージは必要に応じて追加プラグイン（react-hooks 等）を足す。
 */
export default tseslint.config(
  { ignores: ['dist/**', '**/routeTree.gen.ts', 'drizzle/**', 'coverage/**'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
    },
  },
);
