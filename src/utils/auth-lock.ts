import { lock } from 'proper-lockfile';
import { AUTH_LOCK_OPTIONS } from '../constants/auth';
import { getConfigPath } from '../lib/config';

export async function withAuthLock<Output>(operation: () => Output | Promise<Output>): Promise<Output> {
  const release = await lock(getConfigPath(), AUTH_LOCK_OPTIONS);
  try {
    return await operation();
  } finally {
    await release();
  }
}
