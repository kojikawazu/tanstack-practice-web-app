import { describe, expect, it } from 'vitest';
import type { Paginated, TaskDto } from '@repo/shared';
import { app } from '../app';
import { jsonHeaders, registerAndGetCookie } from './helpers';

async function createTask(cookie: string, overrides: Record<string, unknown> = {}) {
  const res = await app.request('/api/tasks', {
    method: 'POST',
    headers: jsonHeaders(cookie),
    body: JSON.stringify({ title: 'テストタスク', priority: 'high', ...overrides }),
  });
  return res;
}

describe('tasks', () => {
  it('正常系: 作成 → 取得 → 更新 → 削除', async () => {
    const { cookie } = await registerAndGetCookie();

    const created = await createTask(cookie, { title: '買い物' });
    expect(created.status).toBe(201);
    const task = (await created.json()) as TaskDto;
    expect(task.title).toBe('買い物');
    expect(task.priority).toBe('high');
    expect(task.status).toBe('todo');

    const got = await app.request(`/api/tasks/${task.id}`, { headers: { cookie } });
    expect(got.status).toBe(200);

    const patched = await app.request(`/api/tasks/${task.id}`, {
      method: 'PATCH',
      headers: jsonHeaders(cookie),
      body: JSON.stringify({ status: 'done' }),
    });
    expect(patched.status).toBe(200);
    expect(((await patched.json()) as TaskDto).status).toBe('done');

    const deleted = await app.request(`/api/tasks/${task.id}`, {
      method: 'DELETE',
      headers: { cookie },
    });
    expect(deleted.status).toBe(204);

    const gone = await app.request(`/api/tasks/${task.id}`, { headers: { cookie } });
    expect(gone.status).toBe(404);
  });

  it('正常系: 一覧はカーソルページングを返す', async () => {
    const { cookie } = await registerAndGetCookie();
    for (let i = 0; i < 3; i++) await createTask(cookie, { title: `task-${i}` });

    const res = await app.request('/api/tasks?limit=2', { headers: { cookie } });
    expect(res.status).toBe(200);
    const page = (await res.json()) as Paginated<TaskDto>;
    expect(page.items.length).toBe(2);
    expect(page.nextCursor).toBeTypeOf('string');

    const next = await app.request(`/api/tasks?limit=2&cursor=${encodeURIComponent(page.nextCursor!)}`, {
      headers: { cookie },
    });
    const page2 = (await next.json()) as Paginated<TaskDto>;
    expect(page2.items.length).toBeGreaterThanOrEqual(1);
    // ページ間でアイテムが重複しない
    const ids1 = new Set(page.items.map((t) => t.id));
    expect(page2.items.some((t) => ids1.has(t.id))).toBe(false);
  });

  it('準正常系: タイトル空はバリデーション 400', async () => {
    const { cookie } = await registerAndGetCookie();
    const res = await createTask(cookie, { title: '' });
    expect(res.status).toBe(400);
  });

  it('異常系: 未認証では 401', async () => {
    const res = await app.request('/api/tasks');
    expect(res.status).toBe(401);
  });

  it('異常系: 他ユーザーのタスクは 404（存在秘匿）', async () => {
    const owner = await registerAndGetCookie();
    const created = await createTask(owner.cookie, { title: 'secret' });
    const task = (await created.json()) as TaskDto;

    const other = await registerAndGetCookie();
    const res = await app.request(`/api/tasks/${task.id}`, { headers: { cookie: other.cookie } });
    expect(res.status).toBe(404);
  });
});
