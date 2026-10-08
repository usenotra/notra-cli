import { mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';
import { lock } from 'proper-lockfile';
import { AUTH_LOCK_OPTIONS } from '../constants/auth';
import { getConfigPath } from '../lib/config';

export async function withAuthLock<Output>(operation: () => Output | Promise<Output>): Promise<Output> {
  const path = getConfigPath();
  await mkdir(dirname(path), { recursive: true, mode: 0o700 });
  const release = await lock(path, AUTH_LOCK_OPTIONS);
  try {
    return await operation();
  } finally {
    await release();
  }
}
