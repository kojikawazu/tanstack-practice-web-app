import type { CreateTaskInput, TaskQuery, UpdateTaskInput } from '@repo/shared';
import type { Task } from '@repo/db';
import { Errors } from '../lib/errors';
import { taskRepository } from '../repositories/task.repository';

/**
 * タスクのビジネスロジック層。
 *
 * この層の主な仕事は**認可**（そのタスクを操作してよいか）。
 * ルート層は「誰か」までしか知らず、リポジトリ層は言われたとおりに
 * DB を触るだけなので、所有者チェックはここに置くのが正しい。
 */
export const taskService = {
  // 一覧は WHERE 句に userId が入るため、取得時点で他人のデータが混ざらない
  list(userId: string, q: TaskQuery) {
    return taskRepository.list(userId, q);
  },

  /**
   * 所有者スコープ込みの取得。他ユーザーのタスクは存在を秘匿して 404 にする（IDOR 対策）。
   *
   * IDOR (Insecure Direct Object Reference) は、URL の ID を書き換えるだけで
   * 他人のデータに触れてしまう脆弱性。ID が UUID でも「推測しにくい」だけで
   * 防御にはならないため、必ずサーバー側で所有者を突き合わせる。
   *
   * 403 ではなく 404 を返すのが要点。403 だと「その ID は存在する」と
   * 教えることになり、ID の総当たりで他人のデータの有無を調べられてしまう。
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

  // 更新・削除も必ず getOwned を先に通す。この1行が抜けると
  // 「ID さえ知っていれば他人のタスクを書き換えられる」状態になる。
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
