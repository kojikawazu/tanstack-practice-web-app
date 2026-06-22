import type { CreateTaskInput, TaskQuery, UpdateTaskInput } from '@repo/shared';
import type { Task } from '@repo/db';
import { Errors } from '../lib/errors';
import { taskRepository } from '../repositories/task.repository';

export const taskService = {
  list(userId: string, q: TaskQuery) {
    return taskRepository.list(userId, q);
  },

  /**
   * 所有者スコープ込みの取得。他ユーザーのタスクは存在を秘匿して 404 にする（IDOR 対策）。
   */
  async getOwned(userId: string, id: string): Promise<Task> {
    const task = await taskRepository.findById(id);
    if (!task || task.userId !== userId) {
      throw Errors.notFound('タスクが見つかりません');
    }
    return task;
  },

  create(userId: string, input: CreateTaskInput): Promise<Task> {
    return taskRepository.create(userId, input);
  },

  async update(userId: string, id: string, input: UpdateTaskInput): Promise<Task> {
    await this.getOwned(userId, id);
    const updated = await taskRepository.update(id, input);
    if (!updated) throw Errors.notFound('タスクが見つかりません');
    return updated;
  },

  async remove(userId: string, id: string): Promise<void> {
    await this.getOwned(userId, id);
    await taskRepository.delete(id);
  },
};
