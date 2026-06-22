import { expect, test } from '@playwright/test';

/**
 * E2E: 登録 → ログイン → タスク作成 → 一覧反映 → 仮想スクロール。
 * 前提: docker compose up + db:migrate + db:seed 済み、api（:3000）起動済み。
 * web は playwright.config.ts の webServer が自動起動する。
 */

test('seeded ユーザーでログインしてタスク一覧と仮想スクロールを確認', async ({ page }) => {
  await page.goto('/login');
  await page.locator('input[type="email"]').fill('demo@example.com');
  await page.locator('input[type="password"]').fill('password123');
  await page.getByRole('button', { name: 'ログイン' }).click();

  await expect(page.getByRole('heading', { name: 'タスク一覧' })).toBeVisible();
  // seed 済みの大量タスクが読み込まれている
  await expect(page.getByText(/件読み込み済み/)).toBeVisible();
});

test('新規登録したユーザーでタスクを作成できる', async ({ page }) => {
  const email = `e2e-${Date.now()}@example.com`;
  await page.goto('/register');

  // 登録フォームの textbox は [お名前, メールアドレス] の順
  const textboxes = page.getByRole('textbox');
  await textboxes.nth(0).fill('E2E User');
  await textboxes.nth(1).fill(email);
  await page.locator('input[type="password"]').fill('password123');
  await page.getByRole('button', { name: '登録' }).click();

  await expect(page.getByRole('heading', { name: 'タスク一覧' })).toBeVisible();

  await page.getByRole('button', { name: '新規タスク' }).click();
  // 作成フォームを開くと最初の textbox がタイトル
  await page.getByRole('textbox').first().fill('E2E で作成したタスク');
  await page.getByRole('button', { name: 'タスクを作成' }).click();

  await expect(page.getByText('E2E で作成したタスク')).toBeVisible();
});
