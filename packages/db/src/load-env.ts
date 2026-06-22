import { resolve } from 'node:path';
import { config } from 'dotenv';

// @repo/db の client.ts は import 時に DATABASE_URL を読むため、
// client より前にこのモジュールを import して .env を読み込む。
config({ path: resolve(process.cwd(), '../../.env') });
