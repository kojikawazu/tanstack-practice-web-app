import { randomBytes, scryptSync } from 'node:crypto';
import './load-env';
import { faker } from '@faker-js/faker';
import { TASK_PRIORITY, TASK_STATUS } from '@repo/shared/enums';
import { db, queryClient } from './client';
import { tasks, users } from './schema';
import type { NewTask } from './types';

/**
 * 開発用の初期データ投入。
 *
 * タスクを 5000 件も作るのは、TanStack Virtual の仮想化と
 * カーソルページングを実際に体感するため。数十件では
 * 仮想化してもしなくても見た目が変わらず、学習にならない。
 *
 * 先頭で './load-env' を import しているのは、次行以降の
 * './client' が DATABASE_URL を読むより先に .env をロードするため。
 */

const DEMO_EMAIL = 'demo@example.com';
const DEMO_PASSWORD = 'password123';
const TASK_COUNT = 5000;
const CHUNK = 1000;

// apps/api/src/lib/password.ts と同一フォーマット（salt:hash の hex / scrypt 64byte）
function hashPassword(password: string): string {
  const salt = randomBytes(16);
  const derived = scryptSync(password, salt, 64);
  return `${salt.toString('hex')}:${derived.toString('hex')}`;
}

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!;
}

async function main() {
  console.log('Seeding... 既存データを truncate します');
  // 冪等化: 再実行で重複しないよう全削除（cascade で tasks/sessions も消える）
  await db.delete(tasks);
  await db.delete(users);

  const [user] = await db
    .insert(users)
    .values({ email: DEMO_EMAIL, name: 'Demo User', passwordHash: hashPassword(DEMO_PASSWORD) })
    .returning();

  if (!user) throw new Error('demo user の作成に失敗しました');
  console.log(`demo user: ${DEMO_EMAIL} / ${DEMO_PASSWORD}`);

  // 1000 件ずつに分けて INSERT する。5000 件を1文で投げると
  // プレースホルダ数が上限に触れたりメモリを圧迫したりするため、
  // 大量投入は分割するのが定石。
  let inserted = 0;
  for (let start = 0; start < TASK_COUNT; start += CHUNK) {
    const batch: NewTask[] = [];
    const size = Math.min(CHUNK, TASK_COUNT - start);
    for (let i = 0; i < size; i++) {
      const hasDue = Math.random() > 0.3;
      batch.push({
        userId: user.id,
        title: faker.lorem.sentence({ min: 2, max: 6 }).slice(0, 120),
        description: Math.random() > 0.5 ? faker.lorem.paragraph().slice(0, 2000) : '',
        status: pick(TASK_STATUS),
        priority: pick(TASK_PRIORITY),
        dueDate: hasDue ? faker.date.between({ from: '2026-01-01', to: '2026-12-31' }) : null,
      });
    }
    await db.insert(tasks).values(batch);
    inserted += size;
    console.log(`  tasks: ${inserted}/${TASK_COUNT}`);
  }

  console.log('Seed 完了');
  await queryClient.end();
}

main().catch(async (err) => {
  console.error(err);
  await queryClient.end();
  process.exit(1);
});
