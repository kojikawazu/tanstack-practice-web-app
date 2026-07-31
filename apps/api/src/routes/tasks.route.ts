import { Hono } from 'hono';
import { createTaskSchema, taskQuerySchema, updateTaskSchema } from '@repo/shared';
import { toTaskDto } from '../lib/dto';
import { validate } from '../lib/validate';
import { requireAuth } from '../middleware/auth.middleware';
import { taskService } from '../services/task.service';

/**
 * タスクルート。RESTful なリソース指向で、パスは app.ts が '/api/tasks' に付ける。
 *
 * 全エンドポイントが認証必須なので、個別に付けず .use(requireAuth) で
 * まとめて適用している。ルートごとに付け忘れる事故を防ぐための書き方。
 *
 * 認可（そのタスクが本人のものか）はここではなく service 層が担当する。
 * 認証＝誰か、認可＝何をしてよいか、を層で分けている。
 */
export const tasksRoute = new Hono()
  .use(requireAuth)
  .get('/', validate('query', taskQuerySchema), async (c) => {
    const user = c.get('user');
    // クエリ文字列も Zod で検証する。taskQuerySchema はフロントの
    // validateSearch と同一（@repo/shared）で、既定値もここで補われる。
    const q = c.req.valid('query');
    // 一覧は必ず user.id でスコープする。クライアントから渡された
    // ユーザー ID は信用せず、セッションから得た値だけを使う。
    const { items, nextCursor } = await taskService.list(user.id, q);
    return c.json({ items: items.map(toTaskDto), nextCursor });
  })
  .post('/', validate('json', createTaskSchema), async (c) => {
    const user = c.get('user');
    const input = c.req.valid('json');
    const task = await taskService.create(user.id, input);
    return c.json(toTaskDto(task), 201);
  })
  .get('/:id', async (c) => {
    const user = c.get('user');
    const task = await taskService.getOwned(user.id, c.req.param('id'));
    return c.json(toTaskDto(task));
  })
  .patch('/:id', validate('json', updateTaskSchema), async (c) => {
    const user = c.get('user');
    const input = c.req.valid('json');
    const task = await taskService.update(user.id, c.req.param('id'), input);
    return c.json(toTaskDto(task));
  })
  .delete('/:id', async (c) => {
    const user = c.get('user');
    await taskService.remove(user.id, c.req.param('id'));
    // 204 No Content は本文を持たないので c.json ではなく c.body(null, 204)。
    // フロントの api-client も 204 を json() せず undefined を返す実装になっている。
    return c.body(null, 204);
  });
