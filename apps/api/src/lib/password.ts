import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';

/**
 * パスワードハッシュ（node:crypto の scrypt / ネイティブ依存なし）。
 * 形式: `${salt(hex)}:${hash(hex)}`。packages/db の seed.ts と同一フォーマット。
 */
export function hashPassword(password: string): string {
  // salt はユーザーごとにランダム生成する。同じパスワードでも
  // 保存されるハッシュが変わるので、事前計算表（レインボーテーブル）や
  // 「同じハッシュ＝同じパスワード」という推測を防げる。
  // scrypt は意図的に計算コストが高く、総当たりを遅くする設計。
  const salt = randomBytes(16);
  const derived = scryptSync(password, salt, 64);
  return `${salt.toString('hex')}:${derived.toString('hex')}`;
}

/**
 * 保存済みハッシュとの照合。
 *
 * 同じ salt で derive し直して比較する（ハッシュは復号できないため、
 * 「入力を同じ手順で変換して一致するか」を見るしかない）。
 *
 * timingSafeEqual を使うのが重要。`===` や compare は不一致の位置で
 * 早期に処理を打ち切るため、応答時間の差から先頭何文字が合っているかを
 * 推測されうる（タイミング攻撃）。この関数は長さが同じなら常に
 * 一定時間で比較する。長さ比較を先に置いているのは、
 * timingSafeEqual が長さ違いで例外を投げる仕様への対応。
 */
export function verifyPassword(password: string, stored: string): boolean {
  const [saltHex, hashHex] = stored.split(':');
  if (!saltHex || !hashHex) return false;
  const salt = Buffer.from(saltHex, 'hex');
  const expected = Buffer.from(hashHex, 'hex');
  const derived = scryptSync(password, salt, expected.length);
  return expected.length === derived.length && timingSafeEqual(expected, derived);
}
