import { Hono } from 'hono';
import { createTaskSchema, taskQuerySchema, updateTaskSchema } from '@repo/shared';
import { toTaskDto } from '../lib/dto';
import { validate } from '../lib/validate';
import { requireAuth } from '../middleware/auth.middleware';
import { taskService } from '../services/task.service';

export const tasksRoute = new Hono()
  .use(requireAuth)
  .get('/', validate('query', taskQuerySchema), async (c) => {
    const user = c.get('user');
    const q = c.req.valid('query');
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
    return c.body(null, 204);
  });
